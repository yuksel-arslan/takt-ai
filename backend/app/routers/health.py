import time

from fastapi import APIRouter

from app.config import settings
from app.schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health_check():
    """Lightweight health check - no DB call so Railway never times out."""
    return HealthResponse(
        service="TAKT AI",
        status="operational",
        database="not-checked",
        environment=settings.ENVIRONMENT,
        timestamp=time.time(),
    )
