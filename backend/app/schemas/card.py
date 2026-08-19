import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CardBase(BaseModel):
    title: str
    description: str | None = None
    due_date: datetime | None = None
    start_date: datetime | None = None


class CardCreate(CardBase):
    list_id: uuid.UUID


class CardRead(CardBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    list_id: uuid.UUID
    board_id: uuid.UUID
    position: float
    due_completed: bool
    cover_attachment_id: uuid.UUID | None
    is_archived: bool
    created_by: uuid.UUID
    created_at: datetime
