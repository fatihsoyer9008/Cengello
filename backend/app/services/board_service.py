import secrets
import uuid

from sqlalchemy.orm import Session

from app.core.dependencies import _WORKSPACE_ROLE_RANK, assert_workspace_role
from app.core.exceptions import BadRequestError, ConflictError, ForbiddenError, NotFoundError
from app.models.board import Board, BoardMember
from app.models.board_invite import BoardInviteLink
from app.models.enums import BoardRole, WorkspaceRole
from app.models.user import User
from app.models.workspace import WorkspaceMember
from app.schemas.board import BoardCreate, BoardJoinResult, BoardMemberCreate, BoardMemberUpdate, BoardUpdate
from app.services.user_service import get_user_by_email


def create_board(db: Session, actor: User, data: BoardCreate) -> Board:
    assert_workspace_role(db, actor.id, data.workspace_id, WorkspaceRole.member)
    board = Board(
        workspace_id=data.workspace_id,
        name=data.name,
        description=data.description,
        background=data.background,
        visibility=data.visibility,
        created_by=actor.id,
    )
    db.add(board)
    db.flush()
    db.add(BoardMember(board_id=board.id, user_id=actor.id, role=BoardRole.admin))
    db.commit()
    db.refresh(board)
    return board


def list_workspace_boards(db: Session, actor: User, workspace_id: uuid.UUID) -> list[Board]:
    membership = assert_workspace_role(db, actor.id, workspace_id, WorkspaceRole.member)
    if _WORKSPACE_ROLE_RANK[membership.role] >= _WORKSPACE_ROLE_RANK[WorkspaceRole.admin]:
        return db.query(Board).filter(Board.workspace_id == workspace_id, Board.is_archived.is_(False)).all()
    return (
        db.query(Board)
        .join(BoardMember, BoardMember.board_id == Board.id)
        .filter(Board.workspace_id == workspace_id, BoardMember.user_id == actor.id)
        .all()
    )


def update_board(db: Session, board: Board, data: BoardUpdate) -> Board:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(board, field, value)
    db.commit()
    db.refresh(board)
    return board


def delete_board(db: Session, board: Board) -> None:
    db.delete(board)
    db.commit()


def list_members(db: Session, board_id: uuid.UUID) -> list[BoardMember]:
    return db.query(BoardMember).filter(BoardMember.board_id == board_id).all()


def add_member(db: Session, board_id: uuid.UUID, data: BoardMemberCreate) -> BoardMember:
    user = get_user_by_email(db, data.email)
    if user is None:
        raise NotFoundError("No user with this email")
    existing = db.query(BoardMember).filter_by(board_id=board_id, user_id=user.id).one_or_none()
    if existing is not None:
        raise ConflictError("User is already a member of this board")
    member = BoardMember(board_id=board_id, user_id=user.id, role=data.role)
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


def _count_admins(db: Session, board_id: uuid.UUID) -> int:
    return db.query(BoardMember).filter(BoardMember.board_id == board_id, BoardMember.role == BoardRole.admin).count()


def update_member_role(db: Session, board_id: uuid.UUID, member_id: uuid.UUID, data: BoardMemberUpdate) -> BoardMember:
    member = db.get(BoardMember, member_id)
    if member is None or member.board_id != board_id:
        raise NotFoundError("Board member not found")
    board = db.get(Board, board_id)
    if board is not None and member.user_id == board.created_by:
        raise ForbiddenError("Cannot change the role of the board owner")
    if member.role == BoardRole.admin and data.role != BoardRole.admin and _count_admins(db, board_id) <= 1:
        raise BadRequestError("Cannot demote the last remaining board admin")
    member.role = data.role
    db.commit()
    db.refresh(member)
    return member


def set_starred(db: Session, board_id: uuid.UUID, user_id: uuid.UUID, is_starred: bool) -> BoardMember:
    member = db.query(BoardMember).filter_by(board_id=board_id, user_id=user_id).one_or_none()
    if member is None:
        raise NotFoundError("Board member not found")
    member.is_starred = is_starred
    db.commit()
    db.refresh(member)
    return member


def remove_member(db: Session, board_id: uuid.UUID, member_id: uuid.UUID) -> None:
    member = db.get(BoardMember, member_id)
    if member is None or member.board_id != board_id:
        raise NotFoundError("Board member not found")
    board = db.get(Board, board_id)
    if board is not None and member.user_id == board.created_by:
        raise ForbiddenError("Cannot remove the board owner")
    if member.role == BoardRole.admin and _count_admins(db, board_id) <= 1:
        raise BadRequestError("Cannot remove the last remaining board admin")
    db.delete(member)
    db.commit()


def get_or_create_invite_link(db: Session, board_id: uuid.UUID, actor: User) -> BoardInviteLink:
    existing = (
        db.query(BoardInviteLink)
        .filter(BoardInviteLink.board_id == board_id, BoardInviteLink.is_active.is_(True))
        .one_or_none()
    )
    if existing is not None:
        return existing
    link = BoardInviteLink(board_id=board_id, token=secrets.token_urlsafe(24), created_by=actor.id)
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


def join_via_token(db: Session, actor: User, token: str) -> BoardJoinResult:
    link = db.query(BoardInviteLink).filter_by(token=token, is_active=True).one_or_none()
    if link is None:
        raise NotFoundError("Invite link is invalid or has been revoked")

    existing = db.query(BoardMember).filter_by(board_id=link.board_id, user_id=actor.id).one_or_none()
    if existing is not None:
        return BoardJoinResult(board_id=link.board_id, already_member=True)

    db.add(BoardMember(board_id=link.board_id, user_id=actor.id, role=BoardRole.member))
    db.commit()
    return BoardJoinResult(board_id=link.board_id, already_member=False)
