import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_workspace_role
from app.core.exceptions import NotFoundError
from app.db.session import get_db
from app.models.enums import WorkspaceRole
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.board import BoardRead
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceMemberCreate,
    WorkspaceMemberRead,
    WorkspaceMemberUpdate,
    WorkspaceRead,
    WorkspaceUpdate,
)
from app.services import board_service, workspace_service

router = APIRouter(tags=["workspaces"])


def _get_workspace_or_404(db: Session, workspace_id: uuid.UUID) -> Workspace:
    workspace = db.get(Workspace, workspace_id)
    if workspace is None:
        raise NotFoundError("Workspace not found")
    return workspace


@router.post("/workspaces", response_model=WorkspaceRead, status_code=201)
def create_workspace(data: WorkspaceCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return workspace_service.create_workspace(db, current_user, data)


@router.get("/workspaces", response_model=list[WorkspaceRead])
def list_workspaces(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return workspace_service.list_user_workspaces(db, current_user.id)


@router.get("/workspaces/{workspace_id}", response_model=WorkspaceRead, dependencies=[Depends(require_workspace_role(WorkspaceRole.member))])
def get_workspace(workspace_id: uuid.UUID, db: Session = Depends(get_db)):
    return _get_workspace_or_404(db, workspace_id)


@router.patch("/workspaces/{workspace_id}", response_model=WorkspaceRead, dependencies=[Depends(require_workspace_role(WorkspaceRole.admin))])
def update_workspace(workspace_id: uuid.UUID, data: WorkspaceUpdate, db: Session = Depends(get_db)):
    return workspace_service.update_workspace(db, _get_workspace_or_404(db, workspace_id), data)


@router.delete("/workspaces/{workspace_id}", status_code=204, dependencies=[Depends(require_workspace_role(WorkspaceRole.owner))])
def delete_workspace(workspace_id: uuid.UUID, db: Session = Depends(get_db)):
    workspace_service.delete_workspace(db, _get_workspace_or_404(db, workspace_id))


@router.get("/workspaces/{workspace_id}/members", response_model=list[WorkspaceMemberRead], dependencies=[Depends(require_workspace_role(WorkspaceRole.member))])
def list_members(workspace_id: uuid.UUID, db: Session = Depends(get_db)):
    return workspace_service.list_members(db, workspace_id)


@router.post("/workspaces/{workspace_id}/members", response_model=WorkspaceMemberRead, status_code=201, dependencies=[Depends(require_workspace_role(WorkspaceRole.admin))])
def add_member(workspace_id: uuid.UUID, data: WorkspaceMemberCreate, db: Session = Depends(get_db)):
    return workspace_service.add_member(db, workspace_id, data)


@router.patch("/workspaces/{workspace_id}/members/{member_id}", response_model=WorkspaceMemberRead, dependencies=[Depends(require_workspace_role(WorkspaceRole.admin))])
def update_member(workspace_id: uuid.UUID, member_id: uuid.UUID, data: WorkspaceMemberUpdate, db: Session = Depends(get_db)):
    return workspace_service.update_member_role(db, workspace_id, member_id, data)


@router.delete("/workspaces/{workspace_id}/members/{member_id}", status_code=204, dependencies=[Depends(require_workspace_role(WorkspaceRole.admin))])
def remove_member(workspace_id: uuid.UUID, member_id: uuid.UUID, db: Session = Depends(get_db)):
    workspace_service.remove_member(db, workspace_id, member_id)


@router.get("/workspaces/{workspace_id}/boards", response_model=list[BoardRead], dependencies=[Depends(require_workspace_role(WorkspaceRole.member))])
def list_boards(workspace_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return board_service.list_workspace_boards(db, current_user, workspace_id)
