import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import OperationalError, ProgrammingError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import AuthResponse, AuthUser, LoginRequest, RegisterRequest
from app.services.auth_service import create_access_token, get_password_hash, verify_password

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    try:
        existing = db.query(User).filter(User.email == body.email).first()
    except (OperationalError, ProgrammingError) as e:
        logger.error("DB error during register query: %s", e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable, please try again",
        )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        email=body.email,
        name=body.name,
        company=body.company,
        hashed_password=get_password_hash(body.password),
        credits=10,
    )
    db.add(user)

    try:
        db.commit()
        db.refresh(user)
    except (OperationalError, ProgrammingError) as e:
        db.rollback()
        logger.error("DB error during register commit: %s", e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable, please try again",
        )

    token = create_access_token({"sub": user.email})
    logger.info("New user registered: %s", user.email)

    return AuthResponse(
        access_token=token,
        user=AuthUser(
            id=user.id, email=user.email, name=user.name, credits=user.credits
        ),
    )


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == body.email).first()
    except (OperationalError, ProgrammingError) as e:
        logger.error("DB error during login query: %s", e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable, please try again",
        )

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = create_access_token({"sub": user.email})

    return AuthResponse(
        access_token=token,
        user=AuthUser(
            id=user.id, email=user.email, name=user.name, credits=user.credits
        ),
    )
