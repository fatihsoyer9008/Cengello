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


class CardUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    due_date: datetime | None = None
    start_date: datetime | None = None
    due_completed: bool | None = None
    is_archived: bool | None = None


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


class MoveCardRequest(BaseModel):
    list_id: uuid.UUID
    before_id: uuid.UUID | None = None
    after_id: uuid.UUID | None = None


class MoveCardResponse(BaseModel):
    card: CardRead
    rebalanced: bool


class CardCoverUpdate(BaseModel):
    attachment_id: uuid.UUID | None = None


class CardSummary(CardRead):
    label_ids: list[uuid.UUID] = []
    assignee_ids: list[uuid.UUID] = []
    checklist_total: int = 0
    checklist_completed: int = 0
    comment_count: int = 0


class CardListFilters(BaseModel):
    list_id: uuid.UUID | None = None
    due_after: datetime | None = None
    due_before: datetime | None = None
    member_id: uuid.UUID | None = None
    label_id: uuid.UUID | None = None
    is_archived: bool = False
    q: str | None = None
