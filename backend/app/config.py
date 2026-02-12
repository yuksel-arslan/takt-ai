import re

from pydantic_settings import BaseSettings
from pydantic import field_validator, model_validator
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

    @model_validator(mode="before")
    @classmethod
    def strip_env_quotes(cls, values):
        """Strip surrounding quotes that platforms (Railway) inject into env vars."""
        if isinstance(values, dict):
            for key, val in values.items():
                if isinstance(val, str):
                    values[key] = val.strip().strip("\"'")
        return values

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def clean_database_url(cls, v: str) -> str:
        if not isinstance(v, str):
            return v
        # Strip surrounding quotes
        v = v.strip().strip("\"'")
        # Use urllib to properly remove channel_binding param
        # (incompatible with Neon PgBouncer pooler)
        from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
        parsed = urlparse(v)
        params = parse_qs(parsed.query, keep_blank_values=True)
        params.pop("channel_binding", None)
        clean_query = urlencode(params, doseq=True)
        v = urlunparse(parsed._replace(query=clean_query))
        # Ensure sslmode=require is present
        if "sslmode=require" not in v:
            v += "&sslmode=require" if "?" in v else "?sslmode=require"
        return v


settings = Settings()
