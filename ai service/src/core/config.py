import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Symptom Checker Service"
    API_V1_STR: str = "/api/v1"
    
    # RAG / Vector DB Configs
    CHROMA_DB_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models", "chroma_db")
    EMBEDDING_MODEL: str = "dangvantuan/vietnamese-embedding"
    
    # Path to processed Data
    PROCESSED_DATA_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "processed")

    # LLM Config (Google Gemini)
    GEMINI_API_KEY: str = ""
    LLM_MODEL: str = "gemini-2.0-flash"
    
    # Database Config
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/health_assistant"
    
    # Chat Config
    CHAT_TOKEN_LIMIT: int = 8000

    # Web Search (Tavily)
    TAVILY_API_KEY: str = ""

    # Hospital Search (Nominatim + Overpass)
    HOSPITAL_SEARCH_RADIUS_M: int = 5000   # Bán kính tìm kiếm: 5km
    HOSPITAL_SUGGESTION_CONFIDENCE_THRESHOLD: float = 0.70  # Score >= 70% → gợi ý
    NOMINATIM_USER_AGENT: str = "AIHealthAssistantService/1.0 (contact@example.com)"


    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
