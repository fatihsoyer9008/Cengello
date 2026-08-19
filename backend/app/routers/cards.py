import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_card_and_check_role, get_current_user
from app.db.session import get_db
from app.models.card import Card
from app.models.enums import BoardRole
from app.models.user import User
from app.schemas.activity import ActivityLogRead
from app.schemas.card import (
    CardCoverUpdate,
    CardCreate,
    CardRead,
    CardUpdate,
    MoveCardRequest,
    MoveCardResponse,
)
from app.schemas.label import LabelRead
from app.schemas.template import TemplateCaptureCardRequest, TemplateRead
from app.schemas.user import UserRead
from app.services import activity_service, card_service, template_service

router = APIRouter(tags=["cards"])


@router.post("/cards", response_model=CardRead, status_code=201)
def create_card(data: CardCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return card_service.create_card(db, current_user, data)


@router.get("/cards/{card_id}", response_model=CardRead)
def get_card(card: Card = Depends(get_card_and_check_role(BoardRole.viewer))):
    return card


@router.patch("/cards/{card_id}", response_model=CardRead)
def update_card(
    data: CardUpdate,
    current_user: User = Depends(get_current_user),
    card: Card = Depends(get_card_and_check_role(BoardRole.member)),
    db: Session = Depends(get_db),
):
    return card_service.update_card(db, current_user, card, data)


@router.patch("/cards/{card_id}/move", response_model=MoveCardResponse)
def move_card(
    data: MoveCardRequest,
    current_user: User = Depends(get_current_user),
    card: Card = Depends(get_card_and_check_role(BoardRole.member)),
    db: Session = Depends(get_db),
):
    moved, rebalanced = card_service.move_card(db, current_user, card, data)
    return MoveCardResponse(card=moved, rebalanced=rebalanced)


@router.patch("/cards/{card_id}/cover", response_model=CardRead)
def set_cover(
    data: CardCoverUpdate,
    card: Card = Depends(get_card_and_check_role(BoardRole.member)),
    db: Session = Depends(get_db),
):
    return card_service.set_cover(db, card, data)


@router.delete("/cards/{card_id}", status_code=204)
def delete_card(card: Card = Depends(get_card_and_check_role(BoardRole.member)), db: Session = Depends(get_db)):
    card_service.delete_card(db, card)


@router.get("/cards/{card_id}/members", response_model=list[UserRead])
def list_members(card: Card = Depends(get_card_and_check_role(BoardRole.viewer)), db: Session = Depends(get_db)):
    return card_service.list_card_members(db, card.id)


@router.post("/cards/{card_id}/members/{user_id}", status_code=204)
def assign_member(user_id: uuid.UUID, card: Card = Depends(get_card_and_check_role(BoardRole.member)), db: Session = Depends(get_db)):
    card_service.assign_member(db, card, user_id)


@router.delete("/cards/{card_id}/members/{user_id}", status_code=204)
def unassign_member(user_id: uuid.UUID, card: Card = Depends(get_card_and_check_role(BoardRole.member)), db: Session = Depends(get_db)):
    card_service.unassign_member(db, card, user_id)


@router.get("/cards/{card_id}/labels", response_model=list[LabelRead])
def list_labels(card: Card = Depends(get_card_and_check_role(BoardRole.viewer)), db: Session = Depends(get_db)):
    return card_service.list_card_labels(db, card.id)


@router.post("/cards/{card_id}/labels/{label_id}", status_code=204)
def add_label(label_id: uuid.UUID, card: Card = Depends(get_card_and_check_role(BoardRole.member)), db: Session = Depends(get_db)):
    card_service.add_label(db, card, label_id)


@router.delete("/cards/{card_id}/labels/{label_id}", status_code=204)
def remove_label(label_id: uuid.UUID, card: Card = Depends(get_card_and_check_role(BoardRole.member)), db: Session = Depends(get_db)):
    card_service.remove_label(db, card, label_id)


@router.get("/cards/{card_id}/activity", response_model=list[ActivityLogRead])
def get_card_activity(limit: int = 50, card: Card = Depends(get_card_and_check_role(BoardRole.viewer)), db: Session = Depends(get_db)):
    return activity_service.list_card_activity(db, card.id, limit)


@router.post("/cards/{card_id}/templates", response_model=TemplateRead, status_code=201)
def capture_card_template(
    data: TemplateCaptureCardRequest,
    current_user: User = Depends(get_current_user),
    card: Card = Depends(get_card_and_check_role(BoardRole.member)),
    db: Session = Depends(get_db),
):
    return template_service.capture_card_template(db, current_user, card, data)
