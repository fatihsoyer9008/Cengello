import uuid

from sqlalchemy.orm import Session

from app.models.activity import ActivityLog


def log_activity(
    db: Session,
    *,
    board_id: uuid.UUID,
    action_type: str,
    card_id: uuid.UUID | None = None,
    actor_id: uuid.UUID | None = None,
    automation_rule_id: uuid.UUID | None = None,
    payload: dict | None = None,
) -> ActivityLog:
    entry = ActivityLog(
        board_id=board_id,
        card_id=card_id,
        actor_id=actor_id,
        automation_rule_id=automation_rule_id,
        action_type=action_type,
        payload=payload or {},
    )
    db.add(entry)
    db.flush()
    return entry


def list_board_activity(
    db: Session, board_id: uuid.UUID, card_id: uuid.UUID | None = None, limit: int = 50
) -> list[ActivityLog]:
    query = db.query(ActivityLog).filter(ActivityLog.board_id == board_id)
    if card_id is not None:
        query = query.filter(ActivityLog.card_id == card_id)
    return query.order_by(ActivityLog.created_at.desc()).limit(limit).all()


def list_card_activity(db: Session, card_id: uuid.UUID, limit: int = 50) -> list[ActivityLog]:
    return (
        db.query(ActivityLog)
        .filter(ActivityLog.card_id == card_id)
        .order_by(ActivityLog.created_at.desc())
        .limit(limit)
        .all()
    )
