import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ChecklistBase(BaseModel):
    title: str = "Checklist"


class ChecklistCreate(ChecklistBase):
    card_id: uuid.UUID


class ChecklistUpdate(BaseModel):
    title: str | None = None


class ChecklistRead(ChecklistBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    card_id: uuid.UUID
    position: float


class ChecklistWithItemsRead(ChecklistRead):
    items: list["ChecklistItemRead"] = []
    completed_count: int = 0
    total_count: int = 0


class ChecklistItemBase(BaseModel):
    text: str
    assigned_to: uuid.UUID | None = None
    due_date: datetime | None = None


class ChecklistItemCreate(ChecklistItemBase):
    checklist_id: uuid.UUID


class ChecklistItemUpdate(BaseModel):
    text: str | None = None
    assigned_to: uuid.UUID | None = None
    due_date: datetime | None = None
    is_complete: bool | None = None


class ChecklistItemRead(ChecklistItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    checklist_id: uuid.UUID
    is_complete: bool
    position: float


ChecklistWithItemsRead.model_rebuild()
