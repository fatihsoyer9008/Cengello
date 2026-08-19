from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.core.dependencies import assert_board_role, get_card_and_check_role, get_comment_and_check_role, get_current_user
from app.core.exceptions import ForbiddenError, NotFoundError
from app.db.session import get_db
from app.models.board import BoardMember
from app.models.card import Card
from app.models.comment import Comment
from app.models.enums import BoardRole
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentRead, CommentUpdate
from app.services import comment_service

router = APIRouter(tags=["comments"])


@router.post("/comments", response_model=CommentRead, status_code=201)
def create_comment(data: CommentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    card = db.get(Card, data.card_id)
    if card is None:
        raise NotFoundError("Card not found")
    assert_board_role(db, current_user.id, card.board_id, BoardRole.member)
    return comment_service.create_comment(db, card, current_user.id, data.body)


@router.get("/cards/{card_id}/comments", response_model=list[CommentRead])
def list_comments(card: Card = Depends(get_card_and_check_role(BoardRole.viewer)), db: Session = Depends(get_db)):
    return comment_service.list_card_comments(db, card.id)


def _assert_author_or_board_admin(db: Session, current_user: User, comment: Comment) -> None:
    if comment.author_id == current_user.id:
        return
    membership = db.query(BoardMember).filter_by(board_id=_comment_board_id(db, comment), user_id=current_user.id).one_or_none()
    if membership is None or membership.role != BoardRole.admin:
        raise ForbiddenError("Only the author or a board admin can modify this comment")


def _comment_board_id(db: Session, comment: Comment):
    card = db.get(Card, comment.card_id)
    return card.board_id


@router.patch("/comments/{comment_id}", response_model=CommentRead)
def update_comment(
    data: CommentUpdate,
    current_user: User = Depends(get_current_user),
    comment: Comment = Depends(get_comment_and_check_role(BoardRole.viewer)),
    db: Session = Depends(get_db),
):
    _assert_author_or_board_admin(db, current_user, comment)
    return comment_service.update_comment(db, comment, data.body)


@router.delete("/comments/{comment_id}", status_code=204)
def delete_comment(
    current_user: User = Depends(get_current_user),
    comment: Comment = Depends(get_comment_and_check_role(BoardRole.viewer)),
    db: Session = Depends(get_db),
):
    _assert_author_or_board_admin(db, current_user, comment)
    comment_service.delete_comment(db, comment)
