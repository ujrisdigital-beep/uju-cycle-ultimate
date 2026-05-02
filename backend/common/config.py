from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    app_name: str = "UJU Cycle v4"
    database_url: str = "postgresql://uju:uju_secret@localhost:5432/uju_cycle"
    redis_url: str = "redis://localhost:6379"
    openai_api_key: str = ""
    embedding_model: str = "text-embedding-3-small"
    compressor_fast_ratio: float = 0.90
    compressor_depth_ratio: float = 0.70
    checkpoint_interval: int = 30
    diversity_score_min: float = 0.30

    class Config:
        env_file = ".env"

@lru_cache
def get_settings():
    return Settings()
