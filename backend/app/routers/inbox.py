import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.exceptions import ForbiddenError, NotFoundError
from app.db.session import get_db
from app.models.inbox import InboxItem
from app.models.user import User
from app.schemas.inbox import InboxItemCreate, InboxItemRead
from app.services import inbox_service

router = APIRouter(tags=["inbox"])


@router.get("/inbox", response_model=list[InboxItemRead])
def list_inbox(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return inbox_service.list_inbox_items(db, current_user.id)


@router.post("/inbox", response_model=InboxItemRead, status_code=201)
def create_inbox_item(data: InboxItemCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return inbox_service.create_inbox_item(db, current_user.id, data.text)


@router.delete("/inbox/{item_id}", status_code=204)
def delete_inbox_item(item_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.get(InboxItem, item_id)
    if item is None:
        raise NotFoundError("Inbox item not found")
    if item.user_id != current_user.id:
        raise ForbiddenError("Not your inbox item")
    inbox_service.delete_inbox_item(db, item)
