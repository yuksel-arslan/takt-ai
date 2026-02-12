from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field


# ──────────────────────────── Auth ────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=120)
    company: str = ""
    password: str = Field(..., min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthUser(BaseModel):
    id: str
    email: str
    name: str
    credits: int


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUser


# ──────────────────────────── Project ─────────────────────────

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str = ""
    project_data: Dict[str, Any] = {}


class ProjectOut(BaseModel):
    id: str
    name: str
    description: str
    status: str
    created_at: datetime
    has_results: bool = False


class ProjectCreateResponse(BaseModel):
    id: str
    name: str
    status: str
    created_at: datetime
    credits_remaining: int


# ──────────────────────────── Optimization ────────────────────

class OptimizationConfig(BaseModel):
    population_size: int = Field(150, ge=10, le=500)
    generations: int = Field(80, ge=10, le=500)
    mutation_rate: float = Field(0.12, ge=0.01, le=0.5)
    crossover_rate: float = Field(0.85, ge=0.1, le=1.0)


class OptimizationStats(BaseModel):
    duration_days: int
    cost_tl: float
    fitness: float
    simulations: int
    optimization_time_ms: int


class OptimizationResponse(BaseModel):
    optimization_id: str
    project_id: str
    best_plan: Dict[str, Any]
    scenarios: List[Dict[str, Any]]
    statistics: OptimizationStats


class ResultsStatistics(BaseModel):
    optimization_date: datetime
    duration_ms: int
    population_size: int
    generations: int
    total_simulations: int


class ResultsProject(BaseModel):
    id: str
    name: str
    created_at: datetime


class ResultsResponse(BaseModel):
    project: ResultsProject
    best_plan: Dict[str, Any]
    scenarios: List[Dict[str, Any]]
    evolution_history: Dict[str, Any]
    statistics: ResultsStatistics


# ──────────────────────────── User ────────────────────────────

class UserStats(BaseModel):
    total_projects: int
    completed_projects: int


class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    company: str
    credits: int
    created_at: datetime
    statistics: UserStats


# ──────────────────────────── Admin ───────────────────────────

class AddCreditsRequest(BaseModel):
    amount: int = Field(..., ge=1)


class AddCreditsResponse(BaseModel):
    user_id: str
    credits: int
    added: int


# ──────────────────────────── Health ──────────────────────────

class HealthResponse(BaseModel):
    service: str
    status: str
    database: str
    environment: str
    timestamp: float
