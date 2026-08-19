import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_card_and_check_role, get_current_user, get_custom_field_and_check_role
from app.db.session import get_db
from app.models.card import Card
from app.models.custom_field import CustomField
from app.models.enums import BoardRole
from app.models.user import User
from app.schemas.custom_field import (
    CustomFieldCreate,
    CustomFieldRead,
    CustomFieldUpdate,
    CustomFieldValueRead,
    CustomFieldValueUpsert,
)
from app.services import custom_field_service

router = APIRouter(tags=["custom-fields"])


@router.post("/custom-fields", response_model=CustomFieldRead, status_code=201)
def create_custom_field(data: CustomFieldCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return custom_field_service.create_custom_field(db, current_user, data)


@router.patch("/custom-fields/{custom_field_id}", response_model=CustomFieldRead)
def update_custom_field(data: CustomFieldUpdate, field: CustomField = Depends(get_custom_field_and_check_role(BoardRole.admin)), db: Session = Depends(get_db)):
    return custom_field_service.update_custom_field(db, field, data)


@router.delete("/custom-fields/{custom_field_id}", status_code=204)
def delete_custom_field(field: CustomField = Depends(get_custom_field_and_check_role(BoardRole.admin)), db: Session = Depends(get_db)):
    custom_field_service.delete_custom_field(db, field)


@router.get("/cards/{card_id}/custom-field-values", response_model=list[CustomFieldValueRead])
def list_values(card: Card = Depends(get_card_and_check_role(BoardRole.viewer)), db: Session = Depends(get_db)):
    return custom_field_service.list_card_values(db, card.id)


@router.put("/cards/{card_id}/custom-fields/{custom_field_id}", response_model=CustomFieldValueRead)
def upsert_value(
    custom_field_id: uuid.UUID,
    data: CustomFieldValueUpsert,
    card: Card = Depends(get_card_and_check_role(BoardRole.member)),
    db: Session = Depends(get_db),
):
    return custom_field_service.upsert_value(db, card, custom_field_id, data)
