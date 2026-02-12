import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_admin_user
from app.models import User
from app.schemas import AddCreditsRequest, AddCreditsResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/credits/{user_id}", response_model=AddCreditsResponse)
def add_credits(
    user_id: str,
    body: AddCreditsRequest,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.credits += body.amount
    db.commit()

    logger.info("Added %d credits to user %s", body.amount, user.email)

    return AddCreditsResponse(
        user_id=user.id,
        credits=user.credits,
        added=body.amount,
    )
