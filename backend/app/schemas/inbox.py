import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class InboxItemCreate(BaseModel):
    text: str


class InboxItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    text: str
    created_at: datetime
