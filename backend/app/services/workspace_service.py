import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestError, ConflictError, NotFoundError
from app.models.enums import WorkspaceRole
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.schemas.workspace import WorkspaceCreate, WorkspaceMemberCreate, WorkspaceMemberUpdate, WorkspaceUpdate
from app.services.user_service import get_user_by_email


def list_user_workspaces(db: Session, user_id: uuid.UUID) -> list[Workspace]:
    return (
        db.query(Workspace)
        .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
        .filter(WorkspaceMember.user_id == user_id)
        .all()
    )


def create_workspace(db: Session, actor: User, data: WorkspaceCreate) -> Workspace:
    if db.query(Workspace).filter(Workspace.slug == data.slug).one_or_none() is not None:
        raise ConflictError("A workspace with this slug already exists")
    workspace = Workspace(name=data.name, description=data.description, slug=data.slug, created_by=actor.id)
    db.add(workspace)
    db.flush()
    db.add(WorkspaceMember(workspace_id=workspace.id, user_id=actor.id, role=WorkspaceRole.owner))
    db.commit()
    db.refresh(workspace)
    return workspace


def update_workspace(db: Session, workspace: Workspace, data: WorkspaceUpdate) -> Workspace:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(workspace, field, value)
    db.commit()
    db.refresh(workspace)
    return workspace


def delete_workspace(db: Session, workspace: Workspace) -> None:
    db.delete(workspace)
    db.commit()


def list_members(db: Session, workspace_id: uuid.UUID) -> list[WorkspaceMember]:
    return db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == workspace_id).all()


def add_member(db: Session, workspace_id: uuid.UUID, data: WorkspaceMemberCreate) -> WorkspaceMember:
    user = get_user_by_email(db, data.email)
    if user is None:
        raise NotFoundError("No user with this email")
    existing = (
        db.query(WorkspaceMember).filter_by(workspace_id=workspace_id, user_id=user.id).one_or_none()
    )
    if existing is not None:
        raise ConflictError("User is already a member of this workspace")
    member = WorkspaceMember(workspace_id=workspace_id, user_id=user.id, role=data.role)
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


def _count_owners(db: Session, workspace_id: uuid.UUID) -> int:
    return (
        db.query(WorkspaceMember)
        .filter(WorkspaceMember.workspace_id == workspace_id, WorkspaceMember.role == WorkspaceRole.owner)
        .count()
    )


def update_member_role(db: Session, workspace_id: uuid.UUID, member_id: uuid.UUID, data: WorkspaceMemberUpdate) -> WorkspaceMember:
    member = db.get(WorkspaceMember, member_id)
    if member is None or member.workspace_id != workspace_id:
        raise NotFoundError("Workspace member not found")
    if member.role == WorkspaceRole.owner and data.role != WorkspaceRole.owner and _count_owners(db, workspace_id) <= 1:
        raise BadRequestError("Cannot demote the last remaining workspace owner")
    member.role = data.role
    db.commit()
    db.refresh(member)
    return member


def remove_member(db: Session, workspace_id: uuid.UUID, member_id: uuid.UUID) -> None:
    member = db.get(WorkspaceMember, member_id)
    if member is None or member.workspace_id != workspace_id:
        raise NotFoundError("Workspace member not found")
    if member.role == WorkspaceRole.owner and _count_owners(db, workspace_id) <= 1:
        raise BadRequestError("Cannot remove the last remaining workspace owner")
    db.delete(member)
    db.commit()
