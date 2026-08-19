import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_board_and_check_role
from app.db.session import get_db
from app.models.board import Board
from app.models.enums import BoardRole
from app.schemas.activity import ActivityLogRead
from app.services import activity_service

router = APIRouter(tags=["activity"])


@router.get("/boards/{board_id}/activity", response_model=list[ActivityLogRead])
def get_board_activity(
    card_id: uuid.UUID | None = None,
    limit: int = 50,
    board: Board = Depends(get_board_and_check_role(BoardRole.viewer)),
    db: Session = Depends(get_db),
):
    return activity_service.list_board_activity(db, board.id, card_id, limit)
