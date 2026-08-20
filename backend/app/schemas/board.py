import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.enums import BoardRole, BoardVisibility


class BoardBase(BaseModel):
    name: str
    description: str | None = None
    background: str | None = None
    visibility: BoardVisibility = BoardVisibility.workspace


class BoardCreate(BoardBase):
    workspace_id: uuid.UUID


class BoardUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    background: str | None = None
    visibility: BoardVisibility | None = None
    is_archived: bool | None = None


class BoardRead(BoardBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    is_archived: bool
    is_template: bool
    created_by: uuid.UUID
    created_at: datetime


class BoardMemberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    board_id: uuid.UUID
    user_id: uuid.UUID
    role: BoardRole
    is_starred: bool


class BoardMemberCreate(BaseModel):
    email: EmailStr
    role: BoardRole = BoardRole.member


class BoardMemberUpdate(BaseModel):
    role: BoardRole


class BoardStarUpdate(BaseModel):
    is_starred: bool
