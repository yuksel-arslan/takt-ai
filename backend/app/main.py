import logging
import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import engine, init_db
from app.routers import admin, auth, health, optimization, projects, users

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("TAKT AI starting up...")
    # Run init_db in background thread so it never blocks the lifespan.
    # Railway health check must respond within 30s; Neon cold-start can take 15s+.
    threading.Thread(target=_safe_init_db, daemon=True).start()

    if settings.NEON_API_KEY and settings.NEON_PROJECT_ID:
        logger.info("Neon API configured")

    yield

    logger.info("TAKT AI shutting down...")
    try:
        if engine is not None:
            engine.dispose()
            logger.info("Database connections closed")
    except Exception as e:
        logger.error("Error closing connections: %s", e)


def _safe_init_db():
    try:
        init_db()
        logger.info("Database initialized (background)")
    except Exception as e:
        logger.error("Database init failed (endpoints will work on first request): %s", e)


def create_app() -> FastAPI:
    app = FastAPI(
        title="TAKT AI Professional",
        version="2.0.0",
        description="Yapay Zeka Destekli Insaat Planlama ve Optimizasyon",
        lifespan=lifespan,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
    )

    # Global exception handler - ensures unhandled errors return a proper
    # JSONResponse so CORSMiddleware can attach CORS headers to it.
    # Without this, Starlette's ServerErrorMiddleware returns a bare 500
    # that bypasses CORSMiddleware, causing browsers to report CORS errors.
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error("Unhandled error on %s %s: %s", request.method, request.url.path, exc)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )

    # CORS
    cors_origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://takt-ai.vercel.app",
    ]
    extra = settings.CORS_ORIGINS
    if extra:
        cors_origins.extend([o.strip() for o in extra.split(",") if o.strip()])

    logger.info("CORS allowed origins: %s", cors_origins)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_origin_regex=r"https://takt-.*\.vercel\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    app.include_router(health.router)
    app.include_router(auth.router)
    app.include_router(projects.router)
    app.include_router(optimization.router)
    app.include_router(users.router)
    app.include_router(admin.router)

    return app


app = create_app()
