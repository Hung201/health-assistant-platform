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
