import uuid

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError, NotAuthenticatedError
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.board import BoardMember
from app.models.enums import BoardRole, WorkspaceRole
from app.models.user import User
from app.models.workspace import WorkspaceMember

_bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise NotAuthenticatedError()
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = uuid.UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise NotAuthenticatedError("Invalid or expired token")

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise NotAuthenticatedError("User not found or inactive")
    return user


_WORKSPACE_ROLE_RANK = {WorkspaceRole.member: 0, WorkspaceRole.admin: 1, WorkspaceRole.owner: 2}
_BOARD_ROLE_RANK = {BoardRole.viewer: 0, BoardRole.member: 1, BoardRole.admin: 2}


def require_workspace_role(min_role: WorkspaceRole):
    def dependency(
        workspace_id: uuid.UUID,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> WorkspaceMember:
        membership = (
            db.query(WorkspaceMember)
            .filter_by(workspace_id=workspace_id, user_id=current_user.id)
            .one_or_none()
        )
        if membership is None or _WORKSPACE_ROLE_RANK[membership.role] < _WORKSPACE_ROLE_RANK[min_role]:
            raise ForbiddenError("Insufficient workspace role")
        return membership

    return dependency


def require_board_role(min_role: BoardRole):
    def dependency(
        board_id: uuid.UUID,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> BoardMember:
        membership = db.query(BoardMember).filter_by(board_id=board_id, user_id=current_user.id).one_or_none()
        if membership is None or _BOARD_ROLE_RANK[membership.role] < _BOARD_ROLE_RANK[min_role]:
            raise ForbiddenError("Insufficient board role")
        return membership

    return dependency
