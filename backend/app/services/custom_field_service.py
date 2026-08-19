import uuid

from sqlalchemy.orm import Session

from app.core.dependencies import assert_board_role
from app.core.exceptions import BadRequestError, NotFoundError
from app.models.custom_field import CustomField, CustomFieldValue
from app.models.enums import BoardRole
from app.models.user import User
from app.schemas.custom_field import CustomFieldCreate, CustomFieldUpdate, CustomFieldValueUpsert
from app.services.ordering import next_append_position


def list_board_custom_fields(db: Session, board_id: uuid.UUID) -> list[CustomField]:
    return db.query(CustomField).filter(CustomField.board_id == board_id).order_by(CustomField.position).all()


def create_custom_field(db: Session, actor: User, data: CustomFieldCreate) -> CustomField:
    assert_board_role(db, actor.id, data.board_id, BoardRole.admin)
    existing_positions = [
        row.position for row in db.query(CustomField.position).filter(CustomField.board_id == data.board_id)
    ]
    field = CustomField(
        board_id=data.board_id,
        name=data.name,
        field_type=data.field_type,
        config=data.config,
        position=next_append_position(existing_positions),
    )
    db.add(field)
    db.commit()
    db.refresh(field)
    return field


def update_custom_field(db: Session, field: CustomField, data: CustomFieldUpdate) -> CustomField:
    for f, value in data.model_dump(exclude_unset=True).items():
        setattr(field, f, value)
    db.commit()
    db.refresh(field)
    return field


def delete_custom_field(db: Session, field: CustomField) -> None:
    db.delete(field)
    db.commit()


def list_card_values(db: Session, card_id: uuid.UUID) -> list[CustomFieldValue]:
    return db.query(CustomFieldValue).filter(CustomFieldValue.card_id == card_id).all()


def upsert_value(db: Session, card, custom_field_id: uuid.UUID, data: CustomFieldValueUpsert) -> CustomFieldValue:
    field = db.get(CustomField, custom_field_id)
    if field is None:
        raise NotFoundError("Custom field not found")
    if field.board_id != card.board_id:
        raise BadRequestError("Custom field does not belong to this card's board")

    existing = (
        db.query(CustomFieldValue)
        .filter_by(custom_field_id=custom_field_id, card_id=card.id)
        .one_or_none()
    )
    if existing is None:
        existing = CustomFieldValue(custom_field_id=custom_field_id, card_id=card.id, value=data.value)
        db.add(existing)
    else:
        existing.value = data.value
    db.commit()
    db.refresh(existing)
    return existing
