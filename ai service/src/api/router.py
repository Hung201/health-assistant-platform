from fastapi import APIRouter
from src.api.v1 import health, diagnostic, chat

api_router = APIRouter()

# Health check (root level)
api_router.include_router(health.router)

# V1 endpoints
api_router.include_router(diagnostic.router, prefix="/api/v1")
api_router.include_router(chat.router, prefix="/api/v1")
