import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_board_and_check_role, get_current_user
from app.db.session import get_db
from app.models.board import Board
from app.models.enums import BoardRole
from app.models.user import User
from app.schemas.automation import AutomationRuleRead
from app.schemas.board import (
    BoardCreate,
    BoardInviteLinkRead,
    BoardJoinResult,
    BoardMemberCreate,
    BoardMemberRead,
    BoardMemberUpdate,
    BoardRead,
    BoardStarUpdate,
    BoardUpdate,
)
from app.schemas.card import CardListFilters, CardRead, CardSummary
from app.schemas.custom_field import CustomFieldRead
from app.schemas.label import LabelRead
from app.schemas.list import ListRead
from app.schemas.template import TemplateCaptureBoardRequest, TemplateRead
from app.services import (
    board_service,
    card_service,
    custom_field_service,
    label_service,
    list_service,
    template_service,
)

router = APIRouter(tags=["boards"])


@router.post("/boards", response_model=BoardRead, status_code=201)
def create_board(data: BoardCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return board_service.create_board(db, current_user, data)


@router.get("/boards/{board_id}", response_model=BoardRead)
def get_board(board: Board = Depends(get_board_and_check_role(BoardRole.viewer))):
    return board


@router.patch("/boards/{board_id}", response_model=BoardRead)
def update_board(data: BoardUpdate, board: Board = Depends(get_board_and_check_role(BoardRole.admin)), db: Session = Depends(get_db)):
    return board_service.update_board(db, board, data)


@router.delete("/boards/{board_id}", status_code=204)
def delete_board(board: Board = Depends(get_board_and_check_role(BoardRole.admin)), db: Session = Depends(get_db)):
    board_service.delete_board(db, board)


@router.patch("/boards/{board_id}/star", response_model=BoardMemberRead)
def set_starred(
    data: BoardStarUpdate,
    current_user: User = Depends(get_current_user),
    board: Board = Depends(get_board_and_check_role(BoardRole.viewer)),
    db: Session = Depends(get_db),
):
    return board_service.set_starred(db, board.id, current_user.id, data.is_starred)


@router.get("/boards/{board_id}/members", response_model=list[BoardMemberRead])
def list_members(board: Board = Depends(get_board_and_check_role(BoardRole.viewer)), db: Session = Depends(get_db)):
    return board_service.list_members(db, board.id)


@router.post("/boards/{board_id}/members", response_model=BoardMemberRead, status_code=201)
def add_member(data: BoardMemberCreate, board: Board = Depends(get_board_and_check_role(BoardRole.admin)), db: Session = Depends(get_db)):
    return board_service.add_member(db, board.id, data)


@router.patch("/boards/{board_id}/members/{member_id}", response_model=BoardMemberRead)
def update_member(member_id: uuid.UUID, data: BoardMemberUpdate, board: Board = Depends(get_board_and_check_role(BoardRole.admin)), db: Session = Depends(get_db)):
    return board_service.update_member_role(db, board.id, member_id, data)


@router.delete("/boards/{board_id}/members/{member_id}", status_code=204)
def remove_member(member_id: uuid.UUID, board: Board = Depends(get_board_and_check_role(BoardRole.admin)), db: Session = Depends(get_db)):
    board_service.remove_member(db, board.id, member_id)


@router.post("/boards/{board_id}/share", response_model=BoardInviteLinkRead)
def share_board(
    current_user: User = Depends(get_current_user),
    board: Board = Depends(get_board_and_check_role(BoardRole.admin)),
    db: Session = Depends(get_db),
):
    return board_service.get_or_create_invite_link(db, board.id, current_user)


@router.post("/boards/join/{token}", response_model=BoardJoinResult)
def join_board(token: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return board_service.join_via_token(db, current_user, token)


@router.get("/boards/{board_id}/lists", response_model=list[ListRead])
def list_lists(include_archived: bool = False, board: Board = Depends(get_board_and_check_role(BoardRole.viewer)), db: Session = Depends(get_db)):
    return list_service.list_board_lists(db, board.id, include_archived)


@router.get("/boards/{board_id}/cards", response_model=list[CardRead])
def list_cards(filters: CardListFilters = Depends(), board: Board = Depends(get_board_and_check_role(BoardRole.viewer)), db: Session = Depends(get_db)):
    return card_service.list_board_cards(db, board.id, filters)


@router.get("/boards/{board_id}/cards/summary", response_model=list[CardSummary])
def list_cards_summary(filters: CardListFilters = Depends(), board: Board = Depends(get_board_and_check_role(BoardRole.viewer)), db: Session = Depends(get_db)):
    return card_service.list_board_cards_summary(db, board.id, filters)


@router.get("/boards/{board_id}/labels", response_model=list[LabelRead])
def list_labels(board: Board = Depends(get_board_and_check_role(BoardRole.viewer)), db: Session = Depends(get_db)):
    return label_service.list_board_labels(db, board.id)


@router.get("/boards/{board_id}/custom-fields", response_model=list[CustomFieldRead])
def list_custom_fields(board: Board = Depends(get_board_and_check_role(BoardRole.viewer)), db: Session = Depends(get_db)):
    return custom_field_service.list_board_custom_fields(db, board.id)


@router.get("/boards/{board_id}/automation-rules", response_model=list[AutomationRuleRead])
def list_automation_rules(board: Board = Depends(get_board_and_check_role(BoardRole.viewer)), db: Session = Depends(get_db)):
    from app.models.automation import AutomationRule

    return db.query(AutomationRule).filter(AutomationRule.board_id == board.id).all()


@router.post("/boards/{board_id}/templates", response_model=TemplateRead, status_code=201)
def capture_board_template(
    data: TemplateCaptureBoardRequest,
    current_user: User = Depends(get_current_user),
    board: Board = Depends(get_board_and_check_role(BoardRole.member)),
    db: Session = Depends(get_db),
):
    return template_service.capture_board_template(db, current_user, board, data)
