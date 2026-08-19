import uuid

from pydantic import BaseModel, ConfigDict


class ListBase(BaseModel):
    name: str


class ListCreate(ListBase):
    board_id: uuid.UUID


class ListUpdate(BaseModel):
    name: str | None = None
    is_archived: bool | None = None


class ListRead(ListBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    board_id: uuid.UUID
    position: float
    is_archived: bool


class MoveListRequest(BaseModel):
    before_id: uuid.UUID | None = None
    after_id: uuid.UUID | None = None


class MoveListResponse(BaseModel):
    list: ListRead
    rebalanced: bool
