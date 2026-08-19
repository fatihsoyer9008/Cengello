import uuid

from pydantic import BaseModel, ConfigDict

from app.models.enums import CustomFieldType


class CustomFieldBase(BaseModel):
    name: str
    field_type: CustomFieldType
    config: dict = {}


class CustomFieldCreate(CustomFieldBase):
    board_id: uuid.UUID


class CustomFieldRead(CustomFieldBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    board_id: uuid.UUID
    position: float


class CustomFieldValueUpsert(BaseModel):
    value: dict | None = None


class CustomFieldValueRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    custom_field_id: uuid.UUID
    card_id: uuid.UUID
    value: dict | None
