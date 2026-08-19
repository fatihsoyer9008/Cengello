import uuid

from sqlalchemy.orm import Session

from app.core.dependencies import assert_board_role
from app.models.enums import BoardRole
from app.models.label import Label
from app.models.user import User
from app.schemas.label import LabelCreate, LabelUpdate


def list_board_labels(db: Session, board_id: uuid.UUID) -> list[Label]:
    return db.query(Label).filter(Label.board_id == board_id).all()


def create_label(db: Session, actor: User, data: LabelCreate) -> Label:
    assert_board_role(db, actor.id, data.board_id, BoardRole.admin)
    label = Label(board_id=data.board_id, name=data.name, color=data.color)
    db.add(label)
    db.commit()
    db.refresh(label)
    return label


def update_label(db: Session, label: Label, data: LabelUpdate) -> Label:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(label, field, value)
    db.commit()
    db.refresh(label)
    return label


def delete_label(db: Session, label: Label) -> None:
    db.delete(label)
    db.commit()
