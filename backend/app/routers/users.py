import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserRead
from app.services import user_service

router = APIRouter(tags=["users"])


@router.get("/users/search", response_model=list[UserRead])
def search_users(email: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return user_service.search_users_by_email(db, email)


@router.get("/users/{user_id}", response_model=UserRead)
def get_user(user_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return user_service.get_user(db, user_id)
