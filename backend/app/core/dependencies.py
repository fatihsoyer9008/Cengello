import uuid
from collections.abc import Callable

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError, NotAuthenticatedError, NotFoundError
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.attachment import Attachment
from app.models.automation import AutomationRule
from app.models.board import Board, BoardMember
from app.models.card import Card
from app.models.checklist import Checklist, ChecklistItem
from app.models.comment import Comment
from app.models.custom_field import CustomField
from app.models.enums import BoardRole, WorkspaceRole
from app.models.label import Label
from app.models.list import List
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


def assert_workspace_role(db: Session, user_id: uuid.UUID, workspace_id: uuid.UUID, min_role: WorkspaceRole) -> WorkspaceMember:
    membership = db.query(WorkspaceMember).filter_by(workspace_id=workspace_id, user_id=user_id).one_or_none()
    if membership is None or _WORKSPACE_ROLE_RANK[membership.role] < _WORKSPACE_ROLE_RANK[min_role]:
        raise ForbiddenError("Insufficient workspace role")
    return membership


def assert_board_role(db: Session, user_id: uuid.UUID, board_id: uuid.UUID, min_role: BoardRole) -> BoardMember:
    membership = db.query(BoardMember).filter_by(board_id=board_id, user_id=user_id).one_or_none()
    if membership is None or _BOARD_ROLE_RANK[membership.role] < _BOARD_ROLE_RANK[min_role]:
        raise ForbiddenError("Insufficient board role")
    return membership


def require_workspace_role(min_role: WorkspaceRole):
    def dependency(
        workspace_id: uuid.UUID,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> WorkspaceMember:
        return assert_workspace_role(db, current_user.id, workspace_id, min_role)

    return dependency


def require_board_role(min_role: BoardRole):
    def dependency(
        board_id: uuid.UUID,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> BoardMember:
        return assert_board_role(db, current_user.id, board_id, min_role)

    return dependency


def _load_and_authorize(db: Session, user_id: uuid.UUID, model, resource_id: uuid.UUID, min_role: BoardRole, board_id_resolver: Callable[[Session, object], uuid.UUID]):
    obj = db.get(model, resource_id)
    if obj is None:
        raise NotFoundError(f"{model.__name__} not found")
    board_id = board_id_resolver(db, obj)
    assert_board_role(db, user_id, board_id, min_role)
    return obj


def _resolve_direct_board_id(db: Session, obj) -> uuid.UUID:
    return obj.board_id


def _resolve_via_card(db: Session, obj) -> uuid.UUID:
    card = db.get(Card, obj.card_id)
    if card is None:
        raise NotFoundError("Card not found")
    return card.board_id


def _resolve_via_checklist(db: Session, obj: ChecklistItem) -> uuid.UUID:
    checklist = db.get(Checklist, obj.checklist_id)
    if checklist is None:
        raise NotFoundError("Checklist not found")
    return _resolve_via_card(db, checklist)


def _resolve_via_rule(db: Session, obj) -> uuid.UUID:
    rule = db.get(AutomationRule, obj.rule_id)
    if rule is None:
        raise NotFoundError("Automation rule not found")
    return rule.board_id


def get_list_and_check_role(min_role: BoardRole):
    def dep(list_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> List:
        return _load_and_authorize(db, current_user.id, List, list_id, min_role, _resolve_direct_board_id)

    return dep


def get_card_and_check_role(min_role: BoardRole):
    def dep(card_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Card:
        return _load_and_authorize(db, current_user.id, Card, card_id, min_role, _resolve_direct_board_id)

    return dep


def get_checklist_and_check_role(min_role: BoardRole):
    def dep(checklist_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Checklist:
        return _load_and_authorize(db, current_user.id, Checklist, checklist_id, min_role, _resolve_via_card)

    return dep


def get_checklist_item_and_check_role(min_role: BoardRole):
    def dep(checklist_item_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> ChecklistItem:
        return _load_and_authorize(db, current_user.id, ChecklistItem, checklist_item_id, min_role, _resolve_via_checklist)

    return dep


def get_label_and_check_role(min_role: BoardRole):
    def dep(label_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Label:
        return _load_and_authorize(db, current_user.id, Label, label_id, min_role, _resolve_direct_board_id)

    return dep


def get_custom_field_and_check_role(min_role: BoardRole):
    def dep(custom_field_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> CustomField:
        return _load_and_authorize(db, current_user.id, CustomField, custom_field_id, min_role, _resolve_direct_board_id)

    return dep


def get_attachment_and_check_role(min_role: BoardRole):
    def dep(attachment_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Attachment:
        return _load_and_authorize(db, current_user.id, Attachment, attachment_id, min_role, _resolve_via_card)

    return dep


def get_comment_and_check_role(min_role: BoardRole):
    def dep(comment_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Comment:
        return _load_and_authorize(db, current_user.id, Comment, comment_id, min_role, _resolve_via_card)

    return dep


def get_automation_rule_and_check_role(min_role: BoardRole):
    def dep(automation_rule_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> AutomationRule:
        return _load_and_authorize(db, current_user.id, AutomationRule, automation_rule_id, min_role, _resolve_direct_board_id)

    return dep


def get_board_and_check_role(min_role: BoardRole):
    def dep(board_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Board:
        obj = db.get(Board, board_id)
        if obj is None:
            raise NotFoundError("Board not found")
        assert_board_role(db, current_user.id, board_id, min_role)
        return obj

    return dep
