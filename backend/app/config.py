from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    NEON_API_KEY: Optional[str] = None
    NEON_PROJECT_ID: Optional[str] = None

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 saat

    # App
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    # Connection Pool
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 300  # 5 dk - Neon auto-suspend uyumlu
    DB_POOL_PRE_PING: bool = True

    # CORS
    CORS_ORIGINS: str = ""

    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
    }

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def ensure_ssl(cls, v: str) -> str:
        if isinstance(v, str) and "sslmode=require" not in v:
            v += "&sslmode=require" if "?" in v else "?sslmode=require"
        return v


settings = Settings()
