import logging
import re
from time import perf_counter
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Request

from src.core.config import settings
from src.schemas.chat_schema import (
    ChatRequest,
    ChatResponse,
    ChatTelemetry,
    HospitalResult,
    HospitalSuggestion,
    RecommendationOption,
)
from src.tools.hospital_search import HospitalSearchTool

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/v1/chat", tags=["Chat V1"])


def _normalize_text(value: Optional[str]) -> str:
    return re.sub(r"\s+", " ", (value or "").strip())


def _extract_location_from_message(message: str) -> Optional[str]:
    text = _normalize_text(message)
    if not text:
        return None
    match = re.search(r"\b(?:o|ở|tai|tại)\s+([^.!?]+)", text, flags=re.IGNORECASE)
    if not match:
        return None
    location = _normalize_text(match.group(1))
    return location or None


def _is_ready_to_diagnose(message: str) -> bool:
    text = _normalize_text(message).lower()
    if not text:
        return False
    symptom_keywords = [
        "dau",
        "đau",
        "ho",
        "sot",
        "sốt",
        "met",
        "mệt",
        "ngua",
        "ngứa",
        "te",
        "tê",
        "chay mau",
        "chảy máu",
    ]
    detail_keywords = [
        "ngay",
        "tuan",
        "thang",
        "gio",
        "muc",
        "mức",
        "do",
        "độ",
        "keo dai",
        "kéo dài",
    ]
    return any(k in text for k in symptom_keywords) and any(k in text for k in detail_keywords)


def _build_recommendation_options() -> list[RecommendationOption]:
    return [
        RecommendationOption(
            id="doctor",
            label="Gợi ý bác sĩ uy tín",
            message="Tôi muốn được gợi ý bác sĩ uy tín phù hợp với tình trạng hiện tại.",
        ),
        RecommendationOption(
            id="facility",
            label="Bệnh viện/phòng khám gần tôi",
            message="Tôi muốn xem các bệnh viện, phòng khám gần tôi.",
        ),
    ]


def _build_hospital_suggestion(summary) -> HospitalSuggestion:
    hospitals = [
        HospitalResult(
            name=item.name,
            address=item.address,
            phone=item.phone,
            specialty=item.specialty,
            amenity_type=item.amenity_type,
        )
        for item in summary.results
    ]
    return HospitalSuggestion(
        invitation_text=summary.invitation_text,
        hospitals=hospitals,
        search_radius_km=summary.search_radius_km,
        location_used=summary.location_used,
    )


@router.post("/", response_model=ChatResponse)
async def chat_v1(body: ChatRequest, request: Request):
    started = perf_counter()
    diagnostic_agent = request.app.state.diagnostic_agent
    message = _normalize_text(body.message)
    session_id = body.session_id or str(uuid4())
    location_hint = _normalize_text(body.user_location) or _extract_location_from_message(message)

    is_ready = _is_ready_to_diagnose(message)
    final_result = None
    hospital_suggestion = None
    reply = "Tôi đã ghi nhận thông tin của bạn. Bạn có thể mô tả rõ hơn mức độ đau và thời gian kéo dài không?"

    if is_ready:
        final_result = diagnostic_agent.analyze(message)
        top_score = 0.0
        specialty_selected = None
        if final_result and final_result.top_diseases:
            top_score = float(final_result.top_diseases[0].match_score)
            specialty_selected = final_result.top_diseases[0].suggested_specialty
        else:
            specialty_selected = None

        reply = "Tôi đã có phân tích sơ bộ cho bạn."
        if location_hint and top_score >= settings.HOSPITAL_SUGGESTION_CONFIDENCE_THRESHOLD:
            try:
                hospital_tool = HospitalSearchTool()
                summary = hospital_tool.search(location=location_hint, specialty_hint=specialty_selected)
                if summary.found:
                    hospital_suggestion = _build_hospital_suggestion(summary)
            except Exception as error:
                logger.warning("[chat_v1] hospital suggestion failed: %s", error)

    recommendation_options = _build_recommendation_options() if final_result else None
    latency_ms = int((perf_counter() - started) * 1000)

    confidence_top_score = None
    specialty_selected = None
    if final_result and final_result.top_diseases:
        confidence_top_score = float(final_result.top_diseases[0].match_score)
        specialty_selected = final_result.top_diseases[0].suggested_specialty

    telemetry = ChatTelemetry(
        provider="python_v1",
        specialty_selected=specialty_selected,
        location_hint_used=location_hint,
        confidence_top_score=confidence_top_score,
        latency_ms=latency_ms,
    )

    return ChatResponse(
        session_id=session_id,
        reply=reply,
        is_ready_to_diagnose=is_ready,
        final_result=final_result,
        hospital_suggestion=hospital_suggestion,
        recommendation_options=recommendation_options,
        telemetry=telemetry,
    )
