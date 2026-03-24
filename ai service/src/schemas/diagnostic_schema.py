from pydantic import BaseModel, Field
from typing import Optional, List


class DiseaseCandidate(BaseModel):
    rank: int = Field(..., description="Thứ hạng (1=cao nhất)")
    disease: str = Field(..., description="Tên bệnh")
    match_score: float = Field(..., ge=0.0, le=1.0, description="Mức độ khớp với triệu chứng")
    reasoning: str = Field(..., description="Lý do phân tích")
    suggested_specialty: str = Field(..., description="Chuyên khoa gợi ý")


class WebSearchSource(BaseModel):
    """Nguồn thông tin bổ sung từ web search (khi RAG không đủ dữ liệu)."""
    title: str = Field(..., description="Tiêu đề bài viết/trang web")
    url: str = Field(..., description="Đường dẫn nguồn")


class DiagnosticResult(BaseModel):
    disclaimer: str = Field(
        default="Đây là kết quả sàng lọc AI, KHÔNG thay thế chẩn đoán từ bác sĩ.",
        description="Tuyên bố miễn trừ trách nhiệm"
    )
    top_diseases: List[DiseaseCandidate] = Field(..., description="Top 3 bệnh phù hợp nhất")
    emergency_warning: Optional[str] = Field(None, description="Cảnh báo khẩn cấp nếu có")
    general_advice: str = Field(..., description="Lời khuyên sức khỏe chung")

    # --- Web Search fields (chỉ có khi agent dùng web search fallback) ---
    used_web_search: bool = Field(
        default=False,
        description="True nếu kết quả có bổ sung thông tin từ Internet"
    )
    web_search_disclaimer: Optional[str] = Field(
        default=None,
        description="Cảnh báo về nguồn web search (chỉ xuất hiện khi used_web_search=True)"
    )
    web_search_sources: Optional[List[WebSearchSource]] = Field(
        default=None,
        description="Danh sách nguồn web được dùng để bổ sung phân tích"
    )
