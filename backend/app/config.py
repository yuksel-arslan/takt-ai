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

    # Connection Pool - Neon serverless icin kucuk tutulmali
    DB_POOL_SIZE: int = 2
    DB_MAX_OVERFLOW: int = 3
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 120  # 2 dk - Neon auto-suspend oncesi yenile
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
        if isinstance(v, str):
            # Strip surrounding quotes that some platforms inject
            v = v.strip().strip("\"'")
            if "sslmode=require" not in v:
                v += "&sslmode=require" if "?" in v else "?sslmode=require"
        return v


settings = Settings()
