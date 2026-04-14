from datetime import datetime
from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Health Check")
async def health_check():
    """
    Kiểm tra trạng thái hoạt động của AI Service.
    Không cần xác thực.
    """
    return {
        "status": "healthy",
        "service": "AI Health Assistant Service",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
