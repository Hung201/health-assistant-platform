from typing import Generic, Optional, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """Response wrapper chuẩn cho tất cả API endpoint."""
    success: bool = True
    data: Optional[T] = None
    message: str = "OK"


class ErrorResponse(BaseModel):
    """Response khi có lỗi."""
    success: bool = False
    error: str
    detail: Optional[str] = None
