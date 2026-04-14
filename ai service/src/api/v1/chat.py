"""
POST /api/v1/chat
Hội thoại đa lượt để thu thập triệu chứng và phân tích.
Tích hợp lưu trữ database (sessions & messages) và quản lý hạn mức token.
"""
import logging
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Request, Depends
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.database import get_db
from src.models.chat_model import ChatSession, ChatMessage
from src.agents.diagnostic_agent import DiagnosticAgent
from src.schemas.chat_schema import (
    ChatRequest, ChatResponse,
    HospitalResult, HospitalSuggestion,
)
from src.tools.hospital_search import HospitalSearchTool

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["Chat"])

# System prompt cho chat agent
CHAT_SYSTEM_PROMPT = """Bạn là một Trợ lý Y tế AI thân thiện, nhiệm vụ là thu thập thông tin triệu chứng từ bệnh nhân thông qua hội thoại tự nhiên.

QUY TRÌNH:
1. Lắng nghe triệu chứng ban đầu người dùng mô tả.
2. Đặt CÁC CÂU HỎI làm rõ CHỈ KHI cần thiết: vị trí đau, mức độ (1-10), thời gian xuất hiện, yếu tố làm nặng/nhẹ hơn, triệu chứng đi kèm.
3. Hỏi tối đa 2-3 câu hỏi phụ. SAU ĐÓ phải quyết định.
4. Khi đã có đủ thông tin (triệu chứng rõ ràng), hãy nói: "READY_TO_DIAGNOSE" ở cuối tin nhắn của bạn.

QUAN TRỌNG:
- Nếu người dùng mô tả triệu chứng nguy hiểm (đau ngực, khó thở đột ngột, đột quỵ), hãy NGAY LẬP TỨC nói "READY_TO_DIAGNOSE" và cảnh báo gọi 115.
- Hỏi ngắn gọn, thân thiện, bằng Tiếng Việt.
- Không bịa thông tin y tế.
- KHÔNG bao gồm "READY_TO_DIAGNOSE" nếu chưa đủ thông tin."""


def _estimate_tokens(text: str) -> int:
    """Ước lượng số lượng token (khoảng 1 token ~ 4 ký tự cho tiếng Việt)."""
    return len(text) // 4


def _build_hospital_suggestion(summary, specialty_hint: str) -> HospitalSuggestion:
    """Chuyển HospitalSearchSummary → HospitalSuggestion schema."""
    hospitals = [
        HospitalResult(
            name=r.name,
            address=r.address,
            phone=r.phone,
            specialty=r.specialty,
            amenity_type=r.amenity_type,
        )
        for r in summary.results
    ]
    return HospitalSuggestion(
        invitation_text=summary.invitation_text,
        hospitals=hospitals,
        search_radius_km=summary.search_radius_km,
        location_used=summary.location_used,
    )


async def _get_or_create_session(db: AsyncSession, session_id: Optional[str], user_id: Optional[str] = None) -> ChatSession:
    """Lấy session hiện có hoặc tạo mới nếu chưa có hoặc đã đóng."""
    session = None
    if session_id:
        try:
            # Tìm session theo ID
            result = await db.execute(select(ChatSession).where(ChatSession.id == uuid.UUID(session_id)))
            session = result.scalars().first()
        except (ValueError, AttributeError):
            pass

    # Nếu không tìm thấy hoặc session đã đóng, tạo mới
    if not session or not session.is_active:
        session = ChatSession(
            id=uuid.uuid4(),
            user_id=uuid.UUID(user_id) if user_id else None,
            is_active=True,
            title="Cuộc trò chuyện mới"
        )
        db.add(session)
        await db.flush()
        logger.info(f"Created new chat session: {session.id}")
    
    return session


@router.post(
    "/",
    response_model=ChatResponse,
    summary="Chat đa lượt thu thập triệu chứng",
    description=(
        "Agent hỏi-đáp để thu thập đầy đủ thông tin triệu chứng. "
        "Lịch sử hội thoại được tự động lưu vào database. "
        "Hạn mức: 8000 tokens mỗi phiên."
    ),
)
async def chat(
    body: ChatRequest, 
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    diagnostic_agent: DiagnosticAgent = request.app.state.diagnostic_agent

    # 1. Lấy hoặc tạo session
    # Lưu ý: body mang session_id từ frontend (thường là UUID)
    session = await _get_or_create_session(db, body.session_id)
    
    # 2. Lưu tin nhắn người dùng
    user_tokens = _estimate_tokens(body.message)
    user_msg = ChatMessage(
        session_id=session.id,
        role="user",
        content=body.message,
        token_count=user_tokens
    )
    db.add(user_msg)
    
    # Cập nhật title nếu là tin nhắn đầu tiên (rất thô sơ)
    if session.total_tokens == 0:
        session.title = body.message[:50] + "..." if len(body.message) > 50 else body.message

    # 3. Load lịch sử hội thoại gần nhất từ DB (giới hạn 15 tin nhắn)
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session.id)
        .order_by(desc(ChatMessage.created_at))
        .limit(15)
    )
    history_msgs = list(reversed(result.scalars().all()))

    # Dựng lịch sử tin nhắn cho LangChain
    messages = [SystemMessage(content=CHAT_SYSTEM_PROMPT)]
    for msg in history_msgs:
        if msg.role == "user":
            messages.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            messages.append(AIMessage(content=msg.content))
    
    # Nếu tin nhắn cuối cùng trong DB chưa phải là tin nhắn hiện tại (vừa add), LangChain sẽ thiếu
    # Nhưng ở đây history_msgs đã bao gồm user_msg vừa add vì đã flush/commit (Depends get_db commit lúc kết thúc)
    # Để chắc chắn, history_msgs luôn chứa tin nhắn mới nhất nếu query sau khi add.

    try:
        # 4. Gọi LLM
        chat_llm = ChatGoogleGenerativeAI(
            model=settings.LLM_MODEL,
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.3,
        )
        
        response = chat_llm.invoke(messages)
        reply_text: str = response.content

        is_ready = "READY_TO_DIAGNOSE" in reply_text
        clean_reply = reply_text.replace("READY_TO_DIAGNOSE", "").strip()

        # 5. Lưu phản hồi của AI
        ai_tokens = _estimate_tokens(clean_reply)
        ai_msg = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=clean_reply,
            token_count=ai_tokens
        )
        db.add(ai_msg)

        # 6. Cập nhật tokens và trạng thái session
        session.total_tokens += (user_tokens + ai_tokens)
        if session.total_tokens >= settings.CHAT_TOKEN_LIMIT:
            session.is_active = False
            clean_reply += "\n\n*(Thông báo: Phiên tư vấn này đã đạt giới hạn bộ nhớ và sẽ được đóng. Bạn có thể bắt đầu phiên mới nhé!)*"
        
        await db.flush()

        # 7. Xử lý chẩn đoán nếu đã sẵn sàng
        final_result = None
        hospital_suggestion = None

        if is_ready:
            # Ghép toàn bộ tin nhắn user trong session này để phân tích
            combined_symptoms = " ".join([m.content for m in history_msgs if m.role == "user"])
            if body.message not in combined_symptoms: # Đề phòng query history không kịp
                combined_symptoms += " " + body.message

            logger.info(f"[Chat] Ready to diagnose. Session: {session.id}")
            final_result = diagnostic_agent.analyze(combined_symptoms)

            # Adaptive Hospital Suggestion
            threshold = settings.HOSPITAL_SUGGESTION_CONFIDENCE_THRESHOLD
            top_score = max((d.match_score for d in final_result.top_diseases), default=0.0)
            top_specialty = final_result.top_diseases[0].suggested_specialty if final_result.top_diseases else None

            if top_score >= threshold and body.user_location:
                hospital_tool = HospitalSearchTool()
                summary = hospital_tool.search(location=body.user_location, specialty_hint=top_specialty)
                if summary.found:
                    hospital_suggestion = _build_hospital_suggestion(summary, top_specialty or "")
            elif top_score >= threshold and not body.user_location:
                clean_reply += "\n\n💡 *Bạn có thể chia sẻ vị trí của mình để tôi gợi ý các phòng khám gần bạn nhé!*"

        return ChatResponse(
            session_id=str(session.id),
            reply=clean_reply,
            is_ready_to_diagnose=is_ready,
            final_result=final_result,
            hospital_suggestion=hospital_suggestion,
        )

    except Exception as e:
        logger.exception(f"[Chat] Error: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi hệ thống AI: {str(e)}")

