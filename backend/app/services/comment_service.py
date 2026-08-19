import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.comment import Comment
from app.services import activity_service


def list_card_comments(db: Session, card_id: uuid.UUID) -> list[Comment]:
    return db.query(Comment).filter(Comment.card_id == card_id).order_by(Comment.created_at).all()


def create_comment(db: Session, card, author_id: uuid.UUID, body: str) -> Comment:
    comment = Comment(card_id=card.id, author_id=author_id, body=body)
    db.add(comment)
    activity_service.log_activity(
        db, board_id=card.board_id, card_id=card.id, action_type="comment.created", actor_id=author_id,
        payload={},
    )
    db.commit()
    db.refresh(comment)
    return comment


def update_comment(db: Session, comment: Comment, body: str) -> Comment:
    comment.body = body
    comment.is_edited = True
    db.commit()
    db.refresh(comment)
    return comment


def delete_comment(db: Session, comment: Comment) -> None:
    db.delete(comment)
    db.commit()
