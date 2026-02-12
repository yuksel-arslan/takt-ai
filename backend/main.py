"""Entry point - backwards-compatible with existing deployment configs."""

import uvicorn

from app.config import settings
from app.main import app  # noqa: F401 - re-export for uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development",
        log_level="info",
    )
