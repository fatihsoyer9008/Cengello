from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.exceptions import NotAuthenticatedError
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.services import auth_service, user_service
from app.services.auth_service import REFRESH_COOKIE_NAME

router = APIRouter(tags=["auth"])


@router.post("/auth/register", response_model=TokenResponse, status_code=201)
def register(data: UserCreate, response: Response, request: Request, db: Session = Depends(get_db)):
    user = user_service.create_user(db, data)
    return auth_service.issue_tokens(db, user, response, request.headers.get("user-agent"))


@router.post("/auth/login", response_model=TokenResponse)
def login(data: LoginRequest, response: Response, request: Request, db: Session = Depends(get_db)):
    user = auth_service.authenticate(db, data.email, data.password)
    return auth_service.issue_tokens(db, user, response, request.headers.get("user-agent"))


@router.post("/auth/refresh", response_model=TokenResponse)
def refresh(response: Response, request: Request, db: Session = Depends(get_db)):
    raw_token = request.cookies.get(REFRESH_COOKIE_NAME)
    if not raw_token:
        raise NotAuthenticatedError("No refresh token cookie present")
    return auth_service.refresh(db, raw_token, response, request.headers.get("user-agent"))


@router.post("/auth/logout", status_code=204)
def logout(response: Response, request: Request, db: Session = Depends(get_db)):
    raw_token = request.cookies.get(REFRESH_COOKIE_NAME)
    auth_service.logout(db, raw_token, response)


@router.get("/auth/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/auth/me", response_model=UserRead)
def update_me(data: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return user_service.update_user(db, current_user, data)
