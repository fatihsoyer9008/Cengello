import uuid

from sqlalchemy.orm import Session

from app.models.inbox import InboxItem


def list_inbox_items(db: Session, user_id: uuid.UUID) -> list[InboxItem]:
    return db.query(InboxItem).filter(InboxItem.user_id == user_id).order_by(InboxItem.created_at.desc()).all()


def create_inbox_item(db: Session, user_id: uuid.UUID, text: str) -> InboxItem:
    item = InboxItem(user_id=user_id, text=text)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def delete_inbox_item(db: Session, item: InboxItem) -> None:
    db.delete(item)
    db.commit()
