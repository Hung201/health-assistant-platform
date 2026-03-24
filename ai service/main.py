"""
AI Health Assistant Service
FastAPI application entrypoint.
Chạy: uvicorn main:app --reload --port 8000
"""
import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.agents.diagnostic_agent import DiagnosticAgent
from src.api.router import api_router

# ─── Logging ────────────────────────────────────────────────────────────────
# Cấu hình logging mức ROOT và áp dụng cho toàn bộ các module con
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
    force=True,  # Quan trọng: Ghi đè mọi cấu hình logging đã tồn tại (của uvicorn)
)
logger = logging.getLogger(__name__)
# Đảm bảo các logger con của uvicorn cũng dùng chung cấu hình này
for name in ["uvicorn", "uvicorn.error", "fastapi"]:
    logging.getLogger(name).handlers = []
    logging.getLogger(name).propagate = True


# ─── Lifespan (startup / shutdown) ──────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Khởi động: load DiagnosticAgent (Embedding model + ChromaDB + LLM) một lần.
    Tắt: cleanup nếu cần.
    """
    logger.info("🚀 Đang khởi động AI Service...")
    try:
        app.state.diagnostic_agent = DiagnosticAgent(k=10)
        logger.info("✅ DiagnosticAgent sẵn sàng!")
    except Exception as e:
        logger.error(f"❌ Không thể khởi tạo DiagnosticAgent: {e}")
        raise

    yield  # Server đang chạy

    logger.info("🛑 AI Service đang tắt...")


# ─── App Instance ────────────────────────────────────────────────────────────
app = FastAPI(
    title="AI Health Assistant Service",
    description=(
        "Microservice AI sàng lọc triệu chứng và gợi ý bệnh lý sơ bộ "
        "dựa trên RAG Pipeline (ChromaDB + LangChain + Gemini).\n\n"
        "**Lưu ý:** Đây là công cụ hỗ trợ sàng lọc, KHÔNG thay thế chẩn đoán bác sĩ."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


# ─── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",   # Next.js frontend
        "http://localhost:4000",   # NestJS backend
        "http://localhost:3000",   # Next.js alt port
        "*",                       # Dev: cho phép tất cả (bỏ khi production)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Global Exception Handler ────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error on {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal Server Error",
            "detail": str(exc),
        },
    )


# ─── Routes ──────────────────────────────────────────────────────────────────
app.include_router(api_router)


# ─── Dev entrypoint ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
