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


class TemplateCaptureBoardRequest(BaseModel):
    name: str
    description: str | None = None
    workspace_id: uuid.UUID
    is_public: bool = False


class TemplateCaptureCardRequest(BaseModel):
    name: str
    description: str | None = None
    workspace_id: uuid.UUID
    is_public: bool = False


class TemplateApplyRequest(BaseModel):
    workspace_id: uuid.UUID | None = None
    list_id: uuid.UUID | None = None
    name: str | None = None


class TemplateApplyResult(BaseModel):
    board_id: uuid.UUID | None = None
    card_id: uuid.UUID | None = None
