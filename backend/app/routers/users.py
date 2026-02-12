from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Project, User
from app.schemas import UserProfile, UserStats

router = APIRouter(prefix="/user", tags=["users"])


@router.get("/me", response_model=UserProfile)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total = db.query(Project).filter(Project.user_id == current_user.id).count()
    completed = (
        db.query(Project)
        .filter(Project.user_id == current_user.id, Project.status == "completed")
        .count()
    )

    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        company=current_user.company or "",
        credits=current_user.credits,
        created_at=current_user.created_at,
        statistics=UserStats(
            total_projects=total,
            completed_projects=completed,
        ),
    )
