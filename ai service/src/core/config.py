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

settings = Settings()
