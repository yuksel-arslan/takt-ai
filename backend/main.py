from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
from sqlalchemy import text
import logging
import os
import time
from typing import Optional

from config import settings
from database import engine, SessionLocal, init_db, get_db
from models import Base, User, Project, OptimizationResult
from genetic_algorithm import TaktGeneticAlgorithm, TaktConfig
from neon_client import neon_client
from auth import create_access_token, verify_password, get_password_hash, verify_token

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lifespan manager - Neon DB için kritik!
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan events - Neon DB connection yönetimi
    """
    logger.info("🚀 TAKT AI starting up...")
    
    # 1. Veritabanı tablolarını oluştur
    try:
        init_db()
        logger.info("✅ Database initialized")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        raise
    
    # 2. Neon API test (opsiyonel)
    if settings.NEON_API_KEY and settings.NEON_PROJECT_ID:
        logger.info("✅ Neon API configured")
    
    yield
    
    # 3. Shutdown - connection pool'u temizle
    logger.info("🛑 TAKT AI shutting down...")
    try:
        engine.dispose()
        logger.info("✅ Database connections closed")
    except Exception as e:
        logger.error(f"❌ Error closing connections: {e}")

# FastAPI app
app = FastAPI(
    title="TAKT AI Professional",
    version="1.0.0",
    description="Yapay Zeka Destekli İnşaat Planlama ve Optimizasyon",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS - Vercel preview URL'leri dahil
cors_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://takt-ai.vercel.app",
]

# Environment'tan ek origin'ler ekle (virgülle ayrılmış)
extra_origins = os.environ.get("CORS_ORIGINS", "")
if extra_origins:
    cors_origins.extend([o.strip() for o in extra_origins.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://takt-.*\.vercel\.app",  # Tüm Vercel preview URL'leri
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# ============ HEALTH CHECK ============
@app.get("/health")
async def health_check():
    """Neon DB bağlantısını test et"""
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        db_status = "healthy"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = f"unhealthy: {str(e)}"
    
    return {
        "service": "TAKT AI",
        "status": "operational",
        "database": db_status,
        "environment": settings.ENVIRONMENT,
        "timestamp": time.time()
    }

# ============ AUTH ENDPOINTS ============
@app.post("/auth/register")
async def register(user_data: dict, db = Depends(get_db)):
    """Yeni kullanıcı kaydı - Neon DB'ye yazar"""
    try:
        # Email kontrol
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Yeni kullanıcı
        new_user = User(
            email=user_data["email"],
            name=user_data["name"],
            company=user_data.get("company", ""),
            hashed_password=get_password_hash(user_data["password"]),
            credits=10  # Yeni kullanıcılara 10 kredi
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Token oluştur
        token = create_access_token({"sub": new_user.email})
        
        logger.info(f"✅ New user registered: {new_user.email}")
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": new_user.id,
                "email": new_user.email,
                "name": new_user.name,
                "credits": new_user.credits
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration failed: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Registration failed")

@app.post("/auth/login")
async def login(login_data: dict, db = Depends(get_db)):
    """Kullanıcı girişi"""
    user = db.query(User).filter(User.email == login_data["email"]).first()
    
    if not user or not verify_password(login_data["password"], user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user.email})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "credits": user.credits
        }
    }

# ============ PROJECT ENDPOINTS ============
@app.post("/projects")
async def create_project(
    project_data: dict,
    token_data: dict = Depends(verify_token),
    db = Depends(get_db)
):
    """Yeni proje oluştur - Neon DB'ye kaydet"""
    
    # Kullanıcıyı bul
    user = db.query(User).filter(User.email == token_data["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Kredi kontrolü
    if user.credits < 1:
        raise HTTPException(status_code=402, detail="Insufficient credits")
    
    # Neon branch oluştur (opsiyonel - versiyonlama için)
    neon_branch_id = None
    neon_branch_uri = None
    
    if settings.NEON_API_KEY and settings.NEON_PROJECT_ID:
        try:
            branch_name = f"project-{user.id}-{int(time.time())}"
            branch = await neon_client.create_branch(branch_name)
            if branch:
                branch_id = branch["branch"]["id"]
                connection_uri = await neon_client.get_connection_uri(branch_id)
                
                neon_branch_id = branch_id
                neon_branch_uri = connection_uri  # Güvenlik: şifrele!
                
                logger.info(f"✅ Neon branch created for project: {branch_name}")
        except Exception as e:
            logger.warning(f"Failed to create Neon branch: {e}")
    
    # Projeyi kaydet
    project = Project(
        user_id=user.id,
        name=project_data["name"],
        description=project_data.get("description", ""),
        project_data=project_data.get("project_data", {}),
        status="pending",
        neon_branch_id=neon_branch_id,
        neon_branch_uri=neon_branch_uri
    )
    
    db.add(project)
    db.commit()
    db.refresh(project)
    
    # Kredi düş
    user.credits -= 1
    db.commit()
    
    return {
        "id": project.id,
        "name": project.name,
        "status": project.status,
        "created_at": project.created_at,
        "credits_remaining": user.credits
    }

@app.get("/projects")
async def list_projects(
    token_data: dict = Depends(verify_token),
    db = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Kullanıcının projelerini listele"""
    
    user = db.query(User).filter(User.email == token_data["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    projects = db.query(Project)\
        .filter(Project.user_id == user.id)\
        .order_by(Project.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()
    
    return [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "status": p.status,
            "created_at": p.created_at,
            "has_results": db.query(OptimizationResult)\
                .filter(OptimizationResult.project_id == p.id)\
                .first() is not None
        }
        for p in projects
    ]

# ============ OPTIMIZATION ENDPOINTS ============
@app.post("/optimize/{project_id}")
async def optimize_project(
    project_id: str,
    config: Optional[dict] = None,
    token_data: dict = Depends(verify_token),
    db = Depends(get_db)
):
    """Genetik algoritma ile optimizasyon yap"""
    
    start_time = time.time()
    
    # Kullanıcı ve proje kontrolü
    user = db.query(User).filter(User.email == token_data["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    project = db.query(Project)\
        .filter(Project.id == project_id, Project.user_id == user.id)\
        .first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Proje durumunu güncelle
    project.status = "processing"
    db.commit()
    
    try:
        # Genetik algoritma konfigürasyonu
        ga_config = TaktConfig()
        if config:
            ga_config.population_size = config.get("population_size", 150)
            ga_config.generations = config.get("generations", 80)
            ga_config.mutation_rate = config.get("mutation_rate", 0.12)
            ga_config.crossover_rate = config.get("crossover_rate", 0.85)
        
        # Optimizasyonu çalıştır
        ga = TaktGeneticAlgorithm(project.project_data, ga_config)
        result = ga.optimize()
        
        # Sonuçları kaydet
        optimization_time = int((time.time() - start_time) * 1000)
        
        db_result = OptimizationResult(
            project_id=project.id,
            best_plan=result["best_plan"],
            scenarios=result["scenarios"],
            evolution_history=result["evolution_history"],
            duration_ms=optimization_time,
            population_size=ga_config.population_size,
            generations=ga_config.generations,
            total_simulations=ga_config.population_size * ga_config.generations
        )
        
        db.add(db_result)
        project.status = "completed"
        db.commit()
        
        logger.info(f"✅ Optimization completed for project {project_id} in {optimization_time}ms")
        
        return {
            "optimization_id": db_result.id,
            "project_id": project.id,
            "best_plan": result["best_plan"],
            "scenarios": result["scenarios"],
            "statistics": {
                "duration_days": result["best_plan"]["duration"],
                "cost_tl": result["best_plan"]["cost"],
                "fitness": result["best_plan"]["fitness"],
                "simulations": ga_config.population_size * ga_config.generations,
                "optimization_time_ms": optimization_time
            }
        }
        
    except Exception as e:
        project.status = "failed"
        db.commit()
        logger.error(f"❌ Optimization failed for project {project_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

@app.get("/results/{project_id}")
async def get_results(
    project_id: str,
    token_data: dict = Depends(verify_token),
    db = Depends(get_db)
):
    """Optimizasyon sonuçlarını getir"""
    
    user = db.query(User).filter(User.email == token_data["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    project = db.query(Project)\
        .filter(Project.id == project_id, Project.user_id == user.id)\
        .first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    result = db.query(OptimizationResult)\
        .filter(OptimizationResult.project_id == project.id)\
        .order_by(OptimizationResult.created_at.desc())\
        .first()
    
    if not result:
        raise HTTPException(status_code=404, detail="No results found")
    
    return {
        "project": {
            "id": project.id,
            "name": project.name,
            "created_at": project.created_at
        },
        "best_plan": result.best_plan,
        "scenarios": result.scenarios,
        "evolution_history": result.evolution_history,
        "statistics": {
            "optimization_date": result.created_at,
            "duration_ms": result.duration_ms,
            "population_size": result.population_size,
            "generations": result.generations,
            "total_simulations": result.total_simulations
        }
    }

# ============ USER PROFILE ============
@app.get("/user/me")
async def get_current_user(
    token_data: dict = Depends(verify_token),
    db = Depends(get_db)
):
    """Mevcut kullanıcı bilgisi"""
    
    user = db.query(User).filter(User.email == token_data["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Proje istatistikleri
    total_projects = db.query(Project).filter(Project.user_id == user.id).count()
    completed_projects = db.query(Project)\
        .filter(Project.user_id == user.id, Project.status == "completed")\
        .count()
    
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "company": user.company,
        "credits": user.credits,
        "created_at": user.created_at,
        "statistics": {
            "total_projects": total_projects,
            "completed_projects": completed_projects
        }
    }

# ============ ADMIN ENDPOINTS ============
@app.post("/admin/credits/{user_id}")
async def add_credits(
    user_id: str,
    amount: int,
    token_data: dict = Depends(verify_token),
    db = Depends(get_db)
):
    """Admin: kullanıcıya kredi ekle"""
    
    admin = db.query(User).filter(User.email == token_data["sub"]).first()
    if not admin or not admin.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.credits += amount
    db.commit()
    
    logger.info(f"💰 Added {amount} credits to user {user.email}")
    
    return {
        "user_id": user.id,
        "credits": user.credits,
        "added": amount
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development",
        log_level="info"
    )