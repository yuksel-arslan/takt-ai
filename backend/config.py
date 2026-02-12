from pydantic_settings import BaseSettings
from pydantic import PostgresDsn, field_validator
from typing import Optional
import os

class Settings(BaseSettings):
    # Neon DB
    DATABASE_URL: PostgresDsn
    NEON_API_KEY: Optional[str] = None
    NEON_PROJECT_ID: Optional[str] = None
    
    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    
    # App
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    
    # Neon Pool Settings
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 300  # 5 dakika - Neon auto-suspend ile uyumlu
    DB_POOL_PRE_PING: bool = True  # Stale connection kontrolü
    
    class Config:
        env_file = ".env"
        case_sensitive = False

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def validate_database_url(cls, v):
        """Neon için SSL zorunlu"""
        if isinstance(v, str):
            if "sslmode=require" not in v and "?" in v:
                v += "&sslmode=require"
            elif "sslmode=require" not in v:
                v += "?sslmode=require"
        return v

settings = Settings()