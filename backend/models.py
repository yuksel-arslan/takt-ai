from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Boolean, Text
from sqlalchemy.sql import func
from database import Base
import uuid

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, indexable=True, nullable=False)
    name = Column(String, nullable=False)
    company = Column(String)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    credits = Column(Integer, default=10)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    
    # Neon branch bilgisi (opsiyonel)
    neon_branch_id = Column(String, nullable=True)
    neon_branch_name = Column(String, nullable=True)

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, indexable=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    project_data = Column(JSON)  # Metraj verisi
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    status = Column(String, default="pending")  # pending, processing, completed, failed
    
    # Neon branch bilgisi
    neon_branch_id = Column(String, nullable=True)
    neon_branch_uri = Column(String, nullable=True)  # Encrypted!

class OptimizationResult(Base):
    __tablename__ = "optimization_results"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, indexable=True, nullable=False)
    best_plan = Column(JSON)
    scenarios = Column(JSON)
    evolution_history = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    duration_ms = Column(Integer)
    
    # Metadata
    population_size = Column(Integer)
    generations = Column(Integer)
    total_simulations = Column(Integer)