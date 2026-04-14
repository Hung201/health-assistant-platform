"""
POST /api/v1/chat
Hội thoại đa lượt để thu thập triệu chứng và phân tích.
Tính năng Adaptive Hospital Suggestion: sau khi chẩn đoán có độ tin cậy ≥ 70%
và user_location được cung cấp, AI tự động tìm và gợi ý cơ sở y tế gần đó.
"""
import logging
from fastapi import APIRouter, HTTPException, Request
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from src.core.config import settings
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


@router.post(
    "/",
    response_model=ChatResponse,
    summary="Chat đa lượt thu thập triệu chứng",
    description=(
        "Agent hỏi-đáp để thu thập đầy đủ thông tin triệu chứng. "
        "Khi is_ready_to_diagnose=True, final_result sẽ chứa kết quả phân tích sơ bộ. "
        "Nếu confidence score ≥ 70% và user_location được cung cấp, "
        "hospital_suggestion sẽ chứa danh sách cơ sở y tế gần đó."
    ),
)
async def chat(body: ChatRequest, request: Request):
    """
    Nhận tin nhắn từ người dùng và trả về câu hỏi phụ hoặc kết quả chẩn đoán.

    - **session_id**: ID phiên, frontend tự tạo và quản lý (dùng UUID)
    - **message**: Tin nhắn hiện tại của người dùng
    - **history**: Lịch sử hội thoại trước đó
    - **user_location**: Địa chỉ người dùng (tùy chọn – để gợi ý bệnh viện gần đó)
    """
    diagnostic_agent: DiagnosticAgent = request.app.state.diagnostic_agent

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
        clean_reply = reply_text.replace("READY_TO_DIAGNOSE", "").strip()

        final_result = None
        hospital_suggestion = None

        if is_ready:
            # Ghép toàn bộ lịch sử thành một chuỗi triệu chứng để phân tích
            all_user_messages = [msg.content for msg in body.history if msg.role == "user"]
            all_user_messages.append(body.message)
            combined_symptoms = " ".join(all_user_messages)

            logger.info(f"[Chat] Ready to diagnose. Combined: {combined_symptoms[:100]}...")
            final_result = diagnostic_agent.analyze(combined_symptoms)

            # ── Adaptive Hospital Suggestion ───────────────────────────────────
            threshold = settings.HOSPITAL_SUGGESTION_CONFIDENCE_THRESHOLD
            top_score = max(
                (d.match_score for d in final_result.top_diseases),
                default=0.0,
            )
            top_specialty = (
                final_result.top_diseases[0].suggested_specialty
                if final_result.top_diseases else None
            )

            logger.info(
                f"[Chat] Confidence: {top_score:.2f} (threshold={threshold}) "
                f"| Specialty: {top_specialty}"
            )

            if top_score >= threshold and body.user_location:
                logger.info(f"[Chat] 🏥 Hospital search near: {body.user_location!r}")
                hospital_tool = HospitalSearchTool()
                summary = hospital_tool.search(
                    location=body.user_location,
                    specialty_hint=top_specialty,
                )
                if summary.found:
                    hospital_suggestion = _build_hospital_suggestion(
                        summary, top_specialty or ""
                    )
                    logger.info(
                        f"[Chat] Found {len(summary.results)} hospitals near "
                        f"{body.user_location!r}"
                    )
                else:
                    logger.warning(
                        f"[Chat] No hospitals found near {body.user_location!r}. "
                        f"Error: {summary.error}"
                    )

            elif top_score >= threshold and not body.user_location:
                # Nhắc nhẹ user cung cấp vị trí ở cuối reply
                clean_reply += (
                    "\n\n💡 *Bạn có thể chia sẻ vị trí của mình (VD: 'Quận 1, TP.HCM') "
                    "để tôi gợi ý các phòng khám phù hợp gần bạn nhé!*"
                )

        return ChatResponse(
            session_id=body.session_id,
            reply=clean_reply,
            is_ready_to_diagnose=is_ready,
            final_result=final_result,
            hospital_suggestion=hospital_suggestion,
        )

    except Exception as e:
        logger.exception(f"[Chat] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi hệ thống AI: {str(e)}")
