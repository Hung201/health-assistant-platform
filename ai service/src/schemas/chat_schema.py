from typing import List, Literal, Optional
from pydantic import BaseModel, Field
from src.schemas.diagnostic_schema import DiagnosticResult


class ChatMessage(BaseModel):
    """Một lượt tin nhắn trong lịch sử hội thoại."""
    role: Literal["user", "assistant"] = Field(..., description="Vai trò người gửi")
    content: str = Field(..., min_length=1, description="Nội dung tin nhắn")


class ChatRequest(BaseModel):
    """Request body cho endpoint chat đa lượt."""
    session_id: str = Field(
        ...,
        min_length=1,
        description="ID phiên hội thoại (do frontend quản lý)"
    )
    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Tin nhắn mới nhất của người dùng"
    )
    history: List[ChatMessage] = Field(
        default_factory=list,
        description="Lịch sử hội thoại trước đó (không kể message hiện tại)"
    )
    user_location: Optional[str] = Field(
        None,
        description=(
            "Địa chỉ / vị trí người dùng để gợi ý cơ sở y tế gần đó "
            "(VD: 'Hoàn Kiếm, Hà Nội'). Nếu không có, tính năng gợi ý bệnh viện sẽ bị bỏ qua."
        ),
    )


# ─── Hospital Suggestion Schemas ────────────────────────────────────────────

class HospitalResult(BaseModel):
    """Thông tin một cơ sở y tế."""
    name: str = Field(..., description="Tên bệnh viện / phòng khám")
    address: Optional[str] = Field(None, description="Địa chỉ")
    phone: Optional[str] = Field(None, description="Số điện thoại")
    specialty: Optional[str] = Field(None, description="Chuyên khoa (nếu có trong OSM)")
    amenity_type: Optional[str] = Field(None, description="Loại: hospital | clinic | doctors")


class HospitalSuggestion(BaseModel):
    """Kết quả gợi ý cơ sở y tế – chỉ xuất hiện khi confidence ≥ ngưỡng."""
    invitation_text: str = Field(
        ...,
        description="Câu mời thân thiện kèm số lượng cơ sở tìm thấy"
    )
    hospitals: List[HospitalResult] = Field(..., description="Danh sách cơ sở y tế gần đó")
    search_radius_km: int = Field(..., description="Bán kính tìm kiếm (km)")
    location_used: str = Field(..., description="Địa chỉ đã dùng để tìm kiếm")


class ChatResponse(BaseModel):
    """Response từ chat endpoint."""
    session_id: str = Field(..., description="ID phiên hội thoại")
    reply: str = Field(..., description="Câu trả lời của AI")
    is_ready_to_diagnose: bool = Field(
        False,
        description="True khi AI đã thu thập đủ thông tin để phân tích"
    )
    final_result: Optional[DiagnosticResult] = Field(
        None,
        description="Kết quả chẩn đoán sơ bộ (chỉ có khi is_ready_to_diagnose=True)"
    )
    hospital_suggestion: Optional[HospitalSuggestion] = Field(
        None,
        description=(
            "Gợi ý cơ sở y tế gần đó. Chỉ xuất hiện khi "
            "is_ready_to_diagnose=True và confidence ≥ 70% và user_location được cung cấp."
        ),
    )
