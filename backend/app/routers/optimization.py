import logging
import time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.genetic_algorithm import TaktConfig, TaktGeneticAlgorithm
from app.models import OptimizationResult, Project, User
from app.schemas import (
    OptimizationConfig,
    OptimizationResponse,
    OptimizationStats,
    ResultsProject,
    ResultsResponse,
    ResultsStatistics,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["optimization"])


@router.post("/optimize/{project_id}", response_model=OptimizationResponse)
def optimize_project(
    project_id: str,
    config: Optional[OptimizationConfig] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start_time = time.time()

    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    project.status = "processing"
    db.commit()

    try:
        ga_config = TaktConfig()
        if config:
            ga_config.population_size = config.population_size
            ga_config.generations = config.generations
            ga_config.mutation_rate = config.mutation_rate
            ga_config.crossover_rate = config.crossover_rate

        ga = TaktGeneticAlgorithm(project.project_data, ga_config)
        result = ga.optimize()

        optimization_time = int((time.time() - start_time) * 1000)
        total_sims = ga_config.population_size * ga_config.generations

        db_result = OptimizationResult(
            project_id=project.id,
            best_plan=result["best_plan"],
            scenarios=result["scenarios"],
            evolution_history=result["evolution_history"],
            duration_ms=optimization_time,
            population_size=ga_config.population_size,
            generations=ga_config.generations,
            total_simulations=total_sims,
        )
        db.add(db_result)
        project.status = "completed"
        db.commit()

        logger.info(
            "Optimization completed for project %s in %dms",
            project_id,
            optimization_time,
        )

        return OptimizationResponse(
            optimization_id=db_result.id,
            project_id=project.id,
            best_plan=result["best_plan"],
            scenarios=result["scenarios"],
            statistics=OptimizationStats(
                duration_days=result["best_plan"]["duration"],
                cost_tl=result["best_plan"]["cost"],
                fitness=result["best_plan"]["fitness"],
                simulations=total_sims,
                optimization_time_ms=optimization_time,
            ),
        )

    except Exception as e:
        project.status = "failed"
        db.commit()
        logger.error("Optimization failed for project %s: %s", project_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Optimization failed: {e}",
        )


@router.get("/results/{project_id}", response_model=ResultsResponse)
def get_results(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    result = (
        db.query(OptimizationResult)
        .filter(OptimizationResult.project_id == project.id)
        .order_by(OptimizationResult.created_at.desc())
        .first()
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No results found",
        )

    return ResultsResponse(
        project=ResultsProject(
            id=project.id,
            name=project.name,
            created_at=project.created_at,
        ),
        best_plan=result.best_plan,
        scenarios=result.scenarios,
        evolution_history=result.evolution_history,
        statistics=ResultsStatistics(
            optimization_date=result.created_at,
            duration_ms=result.duration_ms,
            population_size=result.population_size,
            generations=result.generations,
            total_simulations=result.total_simulations,
        ),
    )
