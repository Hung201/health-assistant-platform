from typing import List, Literal, Optional
from pydantic import BaseModel, Field
from src.schemas.diagnostic_request_schema import PatientContext
from src.schemas.diagnostic_schema import DiagnosticResult


class ChatMessage(BaseModel):
    """Mot luot tin nhan trong lich su hoi thoai."""
    role: Literal["user", "assistant"] = Field(..., description="Vai tro nguoi gui")
    content: str = Field(..., min_length=1, description="Noi dung tin nhan")


class ChatRequest(BaseModel):
    """Request body cho endpoint chat da luot."""
    session_id: Optional[str] = Field(
        None,
        description="ID phien hoi thoai; co the de trong o lan dau"
    )
    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Tin nhan moi nhat cua nguoi dung"
    )
    history: List[ChatMessage] = Field(
        default_factory=list,
        description="Lich su hoi thoai truoc do; hien backend AI dang tu quan ly bang DB"
    )
    user_location: Optional[str] = Field(
        None,
        description="Dia chi/vi tri nguoi dung de goi y co so y te gan do"
    )
    user_id: Optional[str] = Field(
        None,
        description="ID user da duoc backend xac thuc, dung de gan chat session voi users.id"
    )
    patient_context: Optional[PatientContext] = Field(
        None,
        description="Ngu canh benh nhan do backend da xac thuc truyen sang de ca nhan hoa phan tich"
    )


class HospitalResult(BaseModel):
    """Thong tin mot co so y te."""
    name: str = Field(..., description="Ten benh vien/phong kham")
    address: Optional[str] = Field(None, description="Dia chi")
    phone: Optional[str] = Field(None, description="So dien thoai")
    specialty: Optional[str] = Field(None, description="Chuyen khoa neu co trong OSM")
    amenity_type: Optional[str] = Field(None, description="Loai: hospital | clinic | doctors")


class HospitalSuggestion(BaseModel):
    """Ket qua goi y co so y te."""
    invitation_text: str = Field(
        ...,
        description="Cau moi than thien kem so luong co so tim thay"
    )
    hospitals: List[HospitalResult] = Field(..., description="Danh sach co so y te gan do")
    search_radius_km: int = Field(..., description="Ban kinh tim kiem (km)")
    location_used: str = Field(..., description="Dia chi da dung de tim kiem")


class ChatResponse(BaseModel):
    """Response tu chat endpoint."""
    session_id: str = Field(..., description="ID phien hoi thoai")
    reply: str = Field(..., description="Cau tra loi cua AI")
    is_ready_to_diagnose: bool = Field(
        False,
        description="True khi AI da thu thap du thong tin de phan tich"
    )
    final_result: Optional[DiagnosticResult] = Field(
        None,
        description="Ket qua chan doan so bo"
    )
    hospital_suggestion: Optional[HospitalSuggestion] = Field(
        None,
        description="Goi y co so y te gan do neu co du location va confidence"
    )
