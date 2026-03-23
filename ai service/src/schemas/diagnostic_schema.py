from pydantic import BaseModel, Field
from typing import Optional


class DiseaseCandidate(BaseModel):
    rank: int = Field(..., description="Thứ hạng (1=cao nhất)")
    disease: str = Field(..., description="Tên bệnh")
    match_score: float = Field(..., ge=0.0, le=1.0, description="Mức độ khớp với triệu chứng")
    reasoning: str = Field(..., description="Lý do phân tích")
    suggested_specialty: str = Field(..., description="Chuyên khoa gợi ý")


class DiagnosticResult(BaseModel):
    disclaimer: str = Field(
        default="Đây là kết quả sàng lọc AI, KHÔNG thay thế chẩn đoán từ bác sĩ.",
        description="Tuyên bố miễn trừ trách nhiệm"
    )
    top_diseases: list[DiseaseCandidate] = Field(..., description="Top 3 bệnh phù hợp nhất")
    emergency_warning: Optional[str] = Field(None, description="Cảnh báo khẩn cấp nếu có")
    general_advice: str = Field(..., description="Lời khuyên sức khỏe chung")
