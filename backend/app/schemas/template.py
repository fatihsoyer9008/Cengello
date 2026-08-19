import uuid

from pydantic import BaseModel, ConfigDict

from app.models.enums import TemplateScope


class TemplateBase(BaseModel):
    name: str
    description: str | None = None
    scope: TemplateScope
    is_public: bool = False


class TemplateCreate(TemplateBase):
    workspace_id: uuid.UUID | None = None
    snapshot: dict


class TemplateRead(TemplateBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID | None
    snapshot: dict
    created_by: uuid.UUID
