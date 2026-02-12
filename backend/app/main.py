import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, init_db
from app.routers import admin, auth, health, optimization, projects, users

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("TAKT AI starting up...")
    # init_db has built-in retry for Neon cold-start
    try:
        init_db()
        logger.info("Database initialized")
    except Exception as e:
        # Do NOT crash - let the app start so Railway health checks pass.
        # DB-dependent endpoints will fail individually until Neon wakes up.
        logger.error("Database init deferred (will work on first request): %s", e)

    if settings.NEON_API_KEY and settings.NEON_PROJECT_ID:
        logger.info("Neon API configured")

    yield

    logger.info("TAKT AI shutting down...")
    try:
        engine.dispose()
        logger.info("Database connections closed")
    except Exception as e:
        logger.error("Error closing connections: %s", e)


def create_app() -> FastAPI:
    app = FastAPI(
        title="TAKT AI Professional",
        version="2.0.0",
        description="Yapay Zeka Destekli Insaat Planlama ve Optimizasyon",
        lifespan=lifespan,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
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
