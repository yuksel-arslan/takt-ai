import logging
import time
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import OptimizationResult, Project, User
from app.schemas import ProjectCreate, ProjectCreateResponse, ProjectOut
from app.services.neon_service import neon_client
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", response_model=ProjectCreateResponse)
async def create_project(
    body: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.credits < 1:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Insufficient credits",
        )

    # Neon branch (optional)
    neon_branch_id = None
    neon_branch_uri = None

    if settings.NEON_API_KEY and settings.NEON_PROJECT_ID:
        try:
            branch_name = f"project-{current_user.id}-{int(time.time())}"
            branch = await neon_client.create_branch(branch_name)
            if branch:
                bid = branch["branch"]["id"]
                uri = await neon_client.get_connection_uri(bid)
                neon_branch_id = bid
                neon_branch_uri = uri
        except Exception as e:
            logger.warning("Failed to create Neon branch: %s", e)

    project = Project(
        user_id=current_user.id,
        name=body.name,
        description=body.description,
        project_data=body.project_data,
        status="pending",
        neon_branch_id=neon_branch_id,
        neon_branch_uri=neon_branch_uri,
    )
    db.add(project)

    current_user.credits -= 1
    db.commit()
    db.refresh(project)

    return ProjectCreateResponse(
        id=project.id,
        name=project.name,
        status=project.status,
        created_at=project.created_at,
        credits_remaining=current_user.credits,
    )


@router.get("", response_model=List[ProjectOut])
def list_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    projects = (
        db.query(Project)
        .filter(Project.user_id == current_user.id)
        .order_by(Project.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    result = []
    for p in projects:
        has_results = (
            db.query(OptimizationResult)
            .filter(OptimizationResult.project_id == p.id)
            .first()
            is not None
        )
        result.append(
            ProjectOut(
                id=p.id,
                name=p.name,
                description=p.description or "",
                status=p.status,
                created_at=p.created_at,
                has_results=has_results,
            )
        )
    return result
