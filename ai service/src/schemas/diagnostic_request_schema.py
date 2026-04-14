from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class PatientContext(BaseModel):
    """Thông tin ngữ cảnh bệnh nhân từ backend NestJS."""
    age: Optional[int] = Field(None, ge=1, le=120, description="Tuổi bệnh nhân")
    gender: Optional[Literal["male", "female", "other"]] = Field(None, description="Giới tính")
    height_cm: Optional[float] = Field(None, gt=0, description="Chiều cao (cm)")
    weight_kg: Optional[float] = Field(None, gt=0, description="Cân nặng (kg)")
    chronic_conditions: Optional[List[str]] = Field(
        default_factory=list,
        description="Danh sách bệnh nền (VD: ['Đái tháo đường', 'Tăng huyết áp'])"
    )

    @property
    def bmi(self) -> Optional[float]:
        if self.height_cm is not None and self.weight_kg is not None and self.height_cm > 0:
            h: float = self.height_cm / 100.0
            return round(float(self.weight_kg) / (h * h), 1)
        return None

    def to_context_string(self) -> str:
        """Chuyển thành chuỗi mô tả để thêm vào prompt."""
        parts: list[str] = []
        if self.age is not None:
            parts.append(f"Tuổi: {self.age}")
        if self.gender is not None:
            gender_map = {"male": "Nam", "female": "Nữ", "other": "Khác"}
            parts.append(f"Giới tính: {gender_map.get(str(self.gender), str(self.gender))}")
        bmi_val = self.bmi
        if bmi_val is not None:
            parts.append(f"BMI: {bmi_val}")
        if self.chronic_conditions:
            parts.append(f"Bệnh nền: {', '.join(self.chronic_conditions or [])}")
        return " | ".join(parts) if parts else ""


class DiagnosticRequest(BaseModel):
    """Request body cho endpoint phân tích triệu chứng."""
    symptoms: str = Field(
        ...,
        min_length=10,
        max_length=2000,
        description="Mô tả triệu chứng bằng tiếng Việt tự nhiên",
        examples=["Tôi bị đau đầu dữ dội vùng trán, kèm buồn nôn và chóng mặt từ sáng đến giờ"]
    )
    patient_context: Optional[PatientContext] = Field(
        None,
        description="Thông tin bệnh nhân để cá nhân hóa kết quả"
    )
