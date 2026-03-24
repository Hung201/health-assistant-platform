"""
POST /api/v1/diagnostic/analyze
Phân tích triệu chứng sơ bộ bằng RAG + Gemini (DiagnosticAgent).
"""
import json
import logging
from fastapi import APIRouter, HTTPException, Request

from src.schemas.common_schema import APIResponse
from src.schemas.diagnostic_request_schema import DiagnosticRequest
from src.schemas.diagnostic_schema import DiagnosticResult

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/diagnostic", tags=["Diagnostic"])


@router.post(
    "/analyze",
    response_model=APIResponse[DiagnosticResult],
    summary="Phân tích triệu chứng sơ bộ (RAG + AI)",
    description=(
        "Nhận mô tả triệu chứng bằng tiếng Việt, dùng RAG Pipeline "
        "truy xuất kiến thức y khoa từ ChromaDB và Gemini để phân tích, "
        "trả về top 3 bệnh có thể, chuyên khoa gợi ý và cảnh báo khẩn cấp."
    ),
)
async def analyze_symptoms(body: DiagnosticRequest, request: Request):
    """
    Phân tích triệu chứng người dùng.

    - **symptoms**: Mô tả triệu chứng tự nhiên, tối thiểu 10 ký tự
    - **patient_context**: Thông tin bệnh nhân (tuổi, giới tính, bệnh nền...) – tùy chọn
    """
    agent = request.app.state.diagnostic_agent

    # Xây dựng query có ngữ cảnh bệnh nhân (nếu có)
    query = body.symptoms
    if body.patient_context:
        ctx_str = body.patient_context.to_context_string()
        if ctx_str:
            query = f"[Thông tin bệnh nhân: {ctx_str}]\n\nTriệu chứng: {body.symptoms}"

    try:
        logger.info(f"[Diagnostic] Analyzing query (len={len(query)}): {query[:80]}...")
        result: DiagnosticResult = agent.analyze(query)
        logger.info(f"[Diagnostic] Done. Top disease: {result.top_diseases[0].disease if result.top_diseases else 'N/A'}")

        return APIResponse(
            success=True,
            data=result,
            message="Phân tích hoàn tất",
        )

    except json.JSONDecodeError as e:
        logger.error(f"[Diagnostic] JSON parse error from LLM: {e}")
        raise HTTPException(
            status_code=422,
            detail="LLM trả về dữ liệu không hợp lệ. Vui lòng thử lại."
        )
    except Exception as e:
        logger.exception(f"[Diagnostic] Unexpected error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi hệ thống AI: {str(e)}"
        )
