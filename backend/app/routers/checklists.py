from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import (
    get_card_and_check_role,
    get_checklist_and_check_role,
    get_checklist_item_and_check_role,
    get_current_user,
)
from app.db.session import get_db
from app.models.card import Card
from app.models.checklist import Checklist, ChecklistItem
from app.models.enums import BoardRole
from app.models.user import User
from app.schemas.checklist import (
    ChecklistCreate,
    ChecklistItemCreate,
    ChecklistItemRead,
    ChecklistItemUpdate,
    ChecklistRead,
    ChecklistUpdate,
    ChecklistWithItemsRead,
)
from app.services import checklist_service

router = APIRouter(tags=["checklists"])


@router.post("/checklists", response_model=ChecklistRead, status_code=201)
def create_checklist(data: ChecklistCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return checklist_service.create_checklist(db, current_user, data)


@router.get("/cards/{card_id}/checklists", response_model=list[ChecklistWithItemsRead])
def list_card_checklists(card: Card = Depends(get_card_and_check_role(BoardRole.viewer)), db: Session = Depends(get_db)):
    checklists = checklist_service.list_card_checklists(db, card.id)
    result = []
    for cl in checklists:
        items = checklist_service.list_checklist_items(db, cl.id)
        completed = sum(1 for i in items if i.is_complete)
        result.append(
            ChecklistWithItemsRead(
                id=cl.id, card_id=cl.card_id, title=cl.title, position=cl.position,
                items=items, completed_count=completed, total_count=len(items),
            )
        )
    return result


@router.patch("/checklists/{checklist_id}", response_model=ChecklistRead)
def update_checklist(data: ChecklistUpdate, checklist: Checklist = Depends(get_checklist_and_check_role(BoardRole.member)), db: Session = Depends(get_db)):
    return checklist_service.update_checklist(db, checklist, data)


@router.delete("/checklists/{checklist_id}", status_code=204)
def delete_checklist(checklist: Checklist = Depends(get_checklist_and_check_role(BoardRole.member)), db: Session = Depends(get_db)):
    checklist_service.delete_checklist(db, checklist)


@router.get("/checklists/{checklist_id}/items", response_model=list[ChecklistItemRead])
def list_items(checklist: Checklist = Depends(get_checklist_and_check_role(BoardRole.viewer)), db: Session = Depends(get_db)):
    return checklist_service.list_checklist_items(db, checklist.id)


@router.post("/checklist-items", response_model=ChecklistItemRead, status_code=201)
def create_item(data: ChecklistItemCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return checklist_service.create_item(db, current_user, data)


@router.patch("/checklist-items/{checklist_item_id}", response_model=ChecklistItemRead)
def update_item(
    data: ChecklistItemUpdate,
    current_user: User = Depends(get_current_user),
    item: ChecklistItem = Depends(get_checklist_item_and_check_role(BoardRole.member)),
    db: Session = Depends(get_db),
):
    return checklist_service.update_item(db, current_user, item, data)


@router.delete("/checklist-items/{checklist_item_id}", status_code=204)
def delete_item(item: ChecklistItem = Depends(get_checklist_item_and_check_role(BoardRole.member)), db: Session = Depends(get_db)):
    checklist_service.delete_item(db, item)
