import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    company = Column(String, default="")
    hashed_password = Column(String, nullable=False)
    credits = Column(Integer, default=10)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    neon_branch_id = Column(String, nullable=True)
    neon_branch_name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    projects = relationship("Project", back_populates="owner")


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    project_data = Column(JSON)
    status = Column(String, default="pending")  # pending | processing | completed | failed
    neon_branch_id = Column(String, nullable=True)
    neon_branch_uri = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="projects")
    results = relationship("OptimizationResult", back_populates="project")


class OptimizationResult(Base):
    __tablename__ = "optimization_results"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(
        String, ForeignKey("projects.id"), index=True, nullable=False
    )
    best_plan = Column(JSON)
    scenarios = Column(JSON)
    evolution_history = Column(JSON)
    duration_ms = Column(Integer)
    population_size = Column(Integer)
    generations = Column(Integer)
    total_simulations = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="results")
