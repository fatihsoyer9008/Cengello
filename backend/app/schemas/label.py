import uuid

from pydantic import BaseModel, ConfigDict


class LabelBase(BaseModel):
    name: str = ""
    color: str


class LabelCreate(LabelBase):
    board_id: uuid.UUID


class LabelUpdate(BaseModel):
    name: str | None = None
    color: str | None = None


class LabelRead(LabelBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    board_id: uuid.UUID
