"""
POST /api/v1/chat
Hội thoại đa lượt để thu thập triệu chứng và phân tích.
"""
import logging
import uuid
from fastapi import APIRouter, HTTPException, Request
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from src.core.config import settings
from src.agents.diagnostic_agent import DiagnosticAgent
from src.schemas.chat_schema import ChatRequest, ChatResponse

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


@router.post(
    "/",
    response_model=ChatResponse,
    summary="Chat đa lượt thu thập triệu chứng",
    description=(
        "Agent hỏi-đáp để thu thập đầy đủ thông tin triệu chứng. "
        "Khi is_ready_to_diagnose=True, final_result sẽ chứa kết quả phân tích sơ bộ."
    ),
)
async def chat(body: ChatRequest, request: Request):
    """
    Nhận tin nhắn từ người dùng và trả về câu hỏi phụ hoặc kết quả chẩn đoán.

    - **session_id**: ID phiên, frontend tự tạo và quản lý (dùng UUID)
    - **message**: Tin nhắn hiện tại của người dùng
    - **history**: Lịch sử hội thoại trước đó
    """
    diagnostic_agent: DiagnosticAgent = request.app.state.diagnostic_agent

    # Khởi tạo LLM chat riêng (nhẹ hơn, không cần RAG)
    chat_llm = ChatGoogleGenerativeAI(
        model=settings.LLM_MODEL,
        google_api_key=settings.GEMINI_API_KEY,
        temperature=0.3,
    )

    # Dựng lịch sử tin nhắn cho LangChain
    messages = [SystemMessage(content=CHAT_SYSTEM_PROMPT)]
    for msg in body.history:
        if msg.role == "user":
            messages.append(HumanMessage(content=msg.content))
        else:
            messages.append(AIMessage(content=msg.content))
    messages.append(HumanMessage(content=body.message))

    try:
        response = chat_llm.invoke(messages)
        reply_text: str = response.content

        is_ready = "READY_TO_DIAGNOSE" in reply_text
        # Bỏ chuỗi sentinel khỏi reply trả về user
        clean_reply = reply_text.replace("READY_TO_DIAGNOSE", "").strip()

        final_result = None
        if is_ready:
            # Ghép toàn bộ lịch sử thành một chuỗi triệu chứng để phân tích
            all_user_messages = [msg.content for msg in body.history if msg.role == "user"]
            all_user_messages.append(body.message)
            combined_symptoms = " ".join(all_user_messages)

            logger.info(f"[Chat] Ready to diagnose. Combined symptoms: {combined_symptoms[:100]}...")
            final_result = diagnostic_agent.analyze(combined_symptoms)

        return ChatResponse(
            session_id=body.session_id,
            reply=clean_reply,
            is_ready_to_diagnose=is_ready,
            final_result=final_result,
        )

    except Exception as e:
        logger.exception(f"[Chat] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi hệ thống AI: {str(e)}")
