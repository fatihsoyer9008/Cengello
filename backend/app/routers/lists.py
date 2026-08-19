import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_list_and_check_role
from app.db.session import get_db
from app.models.enums import BoardRole
from app.models.list import List
from app.models.user import User
from app.schemas.card import CardRead
from app.schemas.list import ListCreate, ListRead, ListUpdate, MoveListRequest, MoveListResponse
from app.services import card_service, list_service

router = APIRouter(tags=["lists"])


@router.post("/lists", response_model=ListRead, status_code=201)
def create_list(data: ListCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return list_service.create_list(db, current_user, data)


@router.get("/lists/{list_id}", response_model=ListRead)
def get_list(list_obj: List = Depends(get_list_and_check_role(BoardRole.viewer))):
    return list_obj


@router.patch("/lists/{list_id}", response_model=ListRead)
def update_list(
    data: ListUpdate,
    current_user: User = Depends(get_current_user),
    list_obj: List = Depends(get_list_and_check_role(BoardRole.member)),
    db: Session = Depends(get_db),
):
    return list_service.update_list(db, current_user, list_obj, data)


@router.patch("/lists/{list_id}/move", response_model=MoveListResponse)
def move_list(
    data: MoveListRequest,
    current_user: User = Depends(get_current_user),
    list_obj: List = Depends(get_list_and_check_role(BoardRole.member)),
    db: Session = Depends(get_db),
):
    moved, rebalanced = list_service.move_list(db, current_user, list_obj, data)
    return MoveListResponse(list=moved, rebalanced=rebalanced)


@router.delete("/lists/{list_id}", status_code=204)
def delete_list(list_obj: List = Depends(get_list_and_check_role(BoardRole.member)), db: Session = Depends(get_db)):
    list_service.delete_list(db, list_obj)


@router.get("/lists/{list_id}/cards", response_model=list[CardRead])
def list_cards(
    is_archived: bool = False,
    list_obj: List = Depends(get_list_and_check_role(BoardRole.viewer)),
    db: Session = Depends(get_db),
):
    return card_service.list_list_cards(db, list_obj.id, is_archived)
