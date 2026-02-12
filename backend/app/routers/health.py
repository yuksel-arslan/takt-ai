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
    """Health check - DB durumunu raporlar ama basarisiz olsa da 200 doner."""
    db_status = "unknown"
    try:
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
            db_status = "healthy"
        finally:
            db.close()
    except Exception as e:
        logger.warning("Database health check failed: %s", e)
        db_status = f"unhealthy: {e}"

    return HealthResponse(
        service="TAKT AI",
        status="operational",
        database=db_status,
        environment=settings.ENVIRONMENT,
        timestamp=time.time(),
    )
