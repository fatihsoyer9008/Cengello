import uuid

from pydantic import BaseModel, ConfigDict


class ListBase(BaseModel):
    name: str


class ListCreate(ListBase):
    board_id: uuid.UUID


class ListRead(ListBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    board_id: uuid.UUID
    position: float
    is_archived: bool
