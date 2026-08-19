import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.checklist import Checklist, ChecklistItem
from app.models.user import User
from app.schemas.checklist import ChecklistCreate, ChecklistItemCreate, ChecklistItemUpdate, ChecklistUpdate
from app.services import activity_service
from app.services.ordering import next_append_position


def _get_card_or_404(db: Session, card_id: uuid.UUID):
    from app.models.card import Card

    card = db.get(Card, card_id)
    if card is None:
        raise NotFoundError("Card not found")
    return card


def list_card_checklists(db: Session, card_id: uuid.UUID) -> list[Checklist]:
    return db.query(Checklist).filter(Checklist.card_id == card_id).order_by(Checklist.position).all()


def checklist_progress(db: Session, checklist_id: uuid.UUID) -> tuple[int, int]:
    items = db.query(ChecklistItem).filter(ChecklistItem.checklist_id == checklist_id).all()
    total = len(items)
    completed = sum(1 for item in items if item.is_complete)
    return completed, total


def create_checklist(db: Session, actor: User, data: ChecklistCreate) -> Checklist:
    _get_card_or_404(db, data.card_id)
    existing_positions = [
        row.position for row in db.query(Checklist.position).filter(Checklist.card_id == data.card_id)
    ]
    checklist = Checklist(card_id=data.card_id, title=data.title, position=next_append_position(existing_positions))
    db.add(checklist)
    db.commit()
    db.refresh(checklist)
    return checklist


def update_checklist(db: Session, checklist: Checklist, data: ChecklistUpdate) -> Checklist:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(checklist, field, value)
    db.commit()
    db.refresh(checklist)
    return checklist


def delete_checklist(db: Session, checklist: Checklist) -> None:
    db.delete(checklist)
    db.commit()


def list_checklist_items(db: Session, checklist_id: uuid.UUID) -> list[ChecklistItem]:
    return (
        db.query(ChecklistItem).filter(ChecklistItem.checklist_id == checklist_id).order_by(ChecklistItem.position).all()
    )


def create_item(db: Session, actor: User, data: ChecklistItemCreate) -> ChecklistItem:
    checklist = db.get(Checklist, data.checklist_id)
    if checklist is None:
        raise NotFoundError("Checklist not found")
    existing_positions = [
        row.position for row in db.query(ChecklistItem.position).filter(ChecklistItem.checklist_id == data.checklist_id)
    ]
    item = ChecklistItem(
        checklist_id=data.checklist_id,
        text=data.text,
        assigned_to=data.assigned_to,
        due_date=data.due_date,
        position=next_append_position(existing_positions),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_item(db: Session, actor: User, item: ChecklistItem, data: ChecklistItemUpdate, trigger_automation: bool = True) -> ChecklistItem:
    updates = data.model_dump(exclude_unset=True)
    completing = updates.get("is_complete") is True and not item.is_complete

    for field, value in updates.items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)

    if completing:
        checklist = db.get(Checklist, item.checklist_id)
        remaining = (
            db.query(ChecklistItem)
            .filter(ChecklistItem.checklist_id == item.checklist_id, ChecklistItem.is_complete.is_(False))
            .count()
        )
        if remaining == 0 and checklist is not None:
            from app.models.card import Card

            card = db.get(Card, checklist.card_id)
            activity_service.log_activity(
                db, board_id=card.board_id, card_id=card.id, action_type="checklist.completed",
                actor_id=actor.id, payload={"checklist_id": str(checklist.id)},
            )
            db.commit()
            if trigger_automation:
                from app.services import automation_service

                automation_service.evaluate(
                    db, card.board_id, "checklist_completed",
                    {"card_id": card.id, "checklist_id": checklist.id, "checklist_title": checklist.title},
                )
    return item


def delete_item(db: Session, item: ChecklistItem) -> None:
    db.delete(item)
    db.commit()
