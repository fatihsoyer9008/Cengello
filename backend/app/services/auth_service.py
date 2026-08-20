from datetime import datetime, timezone

from fastapi import Response
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import NotAuthenticatedError
from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_refresh_token,
    verify_password,
)
from app.models.auth import RefreshToken
from app.models.user import User
from app.schemas.auth import TokenResponse
from app.services.user_service import get_user_by_email

REFRESH_COOKIE_NAME = "refresh_token"
# Must be "/" rather than "/auth": in production the browser only ever sees
# requests under the reverse proxy's "/api" prefix (Caddy strips it before
# forwarding to the backend), so a narrower path here would never match and
# the cookie would never be sent back.
REFRESH_COOKIE_PATH = "/"


def authenticate(db: Session, email: str, password: str) -> User:
    user = get_user_by_email(db, email)
    if user is None or not user.is_active or not verify_password(password, user.hashed_password):
        raise NotAuthenticatedError("Invalid email or password")
    return user


def issue_tokens(db: Session, user: User, response: Response, user_agent: str | None) -> TokenResponse:
    access_token = create_access_token(user.id)
    raw_refresh, token_hash, expires_at = generate_refresh_token()

    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
            user_agent=user_agent,
        )
    )
    db.commit()

    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=raw_refresh,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path=REFRESH_COOKIE_PATH,
        max_age=settings.jwt_refresh_ttl_days * 86400,
    )
    return TokenResponse(access_token=access_token)


def refresh(db: Session, raw_token: str, response: Response, user_agent: str | None) -> TokenResponse:
    token_hash = hash_refresh_token(raw_token)
    stored = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).one_or_none()

    now = datetime.now(timezone.utc)
    if stored is None or stored.revoked_at is not None or stored.expires_at < now:
        raise NotAuthenticatedError("Invalid or expired refresh token")

    stored.revoked_at = now
    db.commit()

    user = db.get(User, stored.user_id)
    if user is None or not user.is_active:
        raise NotAuthenticatedError("User not found or inactive")

    return issue_tokens(db, user, response, user_agent)


def logout(db: Session, raw_token: str | None, response: Response) -> None:
    if raw_token:
        token_hash = hash_refresh_token(raw_token)
        stored = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).one_or_none()
        if stored is not None and stored.revoked_at is None:
            stored.revoked_at = datetime.now(timezone.utc)
            db.commit()
    response.delete_cookie(key=REFRESH_COOKIE_NAME, path=REFRESH_COOKIE_PATH)
