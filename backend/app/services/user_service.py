import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


def get_user(db: Session, user_id: uuid.UUID) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise NotFoundError("User not found")
    return user


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).one_or_none()


def search_users_by_email(db: Session, email_query: str, limit: int = 10) -> list[User]:
    return db.query(User).filter(User.email.ilike(f"%{email_query}%")).limit(limit).all()


def create_user(db: Session, data: UserCreate) -> User:
    if get_user_by_email(db, data.email) is not None:
        raise ConflictError("A user with this email already exists")
    user = User(
        email=data.email,
        full_name=data.full_name,
        avatar_url=data.avatar_url,
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user: User, data: UserUpdate) -> User:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user
