import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CommentBase(BaseModel):
    body: str


class CommentCreate(CommentBase):
    card_id: uuid.UUID


class CommentRead(CommentBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    card_id: uuid.UUID
    author_id: uuid.UUID
    is_edited: bool
    created_at: datetime
    updated_at: datetime
