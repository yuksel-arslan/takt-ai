import logging
import time

from fastapi import APIRouter
from sqlalchemy import text

from app.database import SessionLocal
from app.config import settings
from app.schemas import HealthResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health_check():
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        db_status = "healthy"
    except Exception as e:
        logger.error("Database health check failed: %s", e)
        db_status = f"unhealthy: {e}"

    return HealthResponse(
        service="TAKT AI",
        status="operational",
        database=db_status,
        environment=settings.ENVIRONMENT,
        timestamp=time.time(),
    )
