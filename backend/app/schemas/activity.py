import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ActivityLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    board_id: uuid.UUID
    card_id: uuid.UUID | None
    actor_id: uuid.UUID | None
    automation_rule_id: uuid.UUID | None
    action_type: str
    payload: dict
    created_at: datetime
