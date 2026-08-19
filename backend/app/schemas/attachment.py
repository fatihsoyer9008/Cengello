import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AttachmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    card_id: uuid.UUID
    uploaded_by: uuid.UUID
    filename: str
    content_type: str | None
    size_bytes: int
    created_at: datetime
