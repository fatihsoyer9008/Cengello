import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from app.core.dependencies import assert_board_role
from app.core.exceptions import BadRequestError, NotFoundError
from app.models.board import BoardMember
from app.models.card import Card, CardMember
from app.models.enums import BoardRole
from app.models.label import CardLabel, Label
from app.models.list import List
from app.models.user import User
from app.schemas.card import CardCreate, CardCoverUpdate, CardListFilters, CardUpdate, MoveCardRequest
from app.services import activity_service
from app.services.ordering import needs_rebalance, next_append_position, position_between, rebalanced_positions


def _get_list_or_404(db: Session, list_id: uuid.UUID) -> List:
    list_obj = db.get(List, list_id)
    if list_obj is None:
        raise NotFoundError("List not found")
    return list_obj


def list_list_cards(db: Session, list_id: uuid.UUID, is_archived: bool = False) -> list[Card]:
    return (
        db.query(Card)
        .filter(Card.list_id == list_id, Card.is_archived.is_(is_archived))
        .order_by(Card.position)
        .all()
    )


def list_board_cards(db: Session, board_id: uuid.UUID, filters: CardListFilters) -> list[Card]:
    query = db.query(Card).filter(Card.board_id == board_id, Card.is_archived.is_(filters.is_archived))
    if filters.list_id is not None:
        query = query.filter(Card.list_id == filters.list_id)
    if filters.due_after is not None:
        query = query.filter(Card.due_date >= filters.due_after)
    if filters.due_before is not None:
        query = query.filter(Card.due_date <= filters.due_before)
    if filters.q:
        query = query.filter(Card.title.ilike(f"%{filters.q}%"))
    if filters.member_id is not None:
        query = query.join(CardMember, CardMember.card_id == Card.id).filter(CardMember.user_id == filters.member_id)
    if filters.label_id is not None:
        query = query.join(CardLabel, CardLabel.card_id == Card.id).filter(CardLabel.label_id == filters.label_id)
    return query.order_by(Card.position).all()


def list_board_cards_summary(db: Session, board_id: uuid.UUID, filters: CardListFilters) -> list[dict]:
    """Same card set as list_board_cards, annotated with the lightweight per-card
    aggregates the Kanban board tile needs (labels, assignees, checklist progress,
    comment count) via a handful of bulk queries -- not one query per card."""
    from sqlalchemy import func

    from app.models.checklist import Checklist, ChecklistItem
    from app.models.comment import Comment

    cards = list_board_cards(db, board_id, filters)
    card_ids = [c.id for c in cards]
    if not card_ids:
        return []

    label_ids_by_card: dict[uuid.UUID, list[uuid.UUID]] = {}
    for card_id, label_id in db.query(CardLabel.card_id, CardLabel.label_id).filter(CardLabel.card_id.in_(card_ids)):
        label_ids_by_card.setdefault(card_id, []).append(label_id)

    assignee_ids_by_card: dict[uuid.UUID, list[uuid.UUID]] = {}
    for card_id, user_id in db.query(CardMember.card_id, CardMember.user_id).filter(CardMember.card_id.in_(card_ids)):
        assignee_ids_by_card.setdefault(card_id, []).append(user_id)

    # Aggregated in Python rather than a SQL boolean-sum, which needs a dialect-specific
    # cast -- checklist counts per board are small enough that this is not worth it.
    checklist_counts: dict[uuid.UUID, tuple[int, int]] = {}
    checklist_id_to_card: dict[uuid.UUID, uuid.UUID] = dict(
        db.query(Checklist.id, Checklist.card_id).filter(Checklist.card_id.in_(card_ids)).all()
    )
    if checklist_id_to_card:
        for checklist_id, is_complete in db.query(ChecklistItem.checklist_id, ChecklistItem.is_complete).filter(
            ChecklistItem.checklist_id.in_(checklist_id_to_card.keys())
        ):
            card_id = checklist_id_to_card[checklist_id]
            total, completed = checklist_counts.get(card_id, (0, 0))
            checklist_counts[card_id] = (total + 1, completed + (1 if is_complete else 0))

    comment_counts: dict[uuid.UUID, int] = dict(
        db.query(Comment.card_id, func.count(Comment.id)).filter(Comment.card_id.in_(card_ids)).group_by(Comment.card_id).all()
    )

    summaries = []
    for card in cards:
        total, completed = checklist_counts.get(card.id, (0, 0))
        summaries.append({
            **{col.name: getattr(card, col.name) for col in Card.__table__.columns},
            "label_ids": label_ids_by_card.get(card.id, []),
            "assignee_ids": assignee_ids_by_card.get(card.id, []),
            "checklist_total": total,
            "checklist_completed": completed,
            "comment_count": comment_counts.get(card.id, 0),
        })
    return summaries


def create_card(db: Session, actor: User, data: CardCreate, trigger_automation: bool = True) -> Card:
    list_obj = _get_list_or_404(db, data.list_id)
    assert_board_role(db, actor.id, list_obj.board_id, BoardRole.member)

    existing_positions = [row.position for row in db.query(Card.position).filter(Card.list_id == data.list_id)]
    card = Card(
        list_id=data.list_id,
        board_id=list_obj.board_id,
        title=data.title,
        description=data.description,
        due_date=data.due_date,
        start_date=data.start_date,
        position=next_append_position(existing_positions),
        created_by=actor.id,
    )
    db.add(card)
    db.flush()
    activity_service.log_activity(
        db, board_id=card.board_id, card_id=card.id, action_type="card.created", actor_id=actor.id,
        payload={"list_id": str(data.list_id)},
    )
    db.commit()
    db.refresh(card)

    if trigger_automation:
        from app.services import automation_service

        automation_service.evaluate(
            db, card.board_id, "card_created_in_list", {"card_id": card.id, "list_id": card.list_id}
        )
    return card


def update_card(db: Session, actor: User, card: Card, data: CardUpdate) -> Card:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(card, field, value)
    db.commit()
    db.refresh(card)
    return card


def set_due_completed(db: Session, card_id: uuid.UUID, value: bool) -> Card:
    card = db.get(Card, card_id)
    if card is None:
        raise NotFoundError("Card not found")
    card.due_completed = value
    db.commit()
    db.refresh(card)
    return card


def delete_card(db: Session, card: Card) -> None:
    db.delete(card)
    db.commit()


def move_card(
    db: Session, actor: User | None, card: Card, data: MoveCardRequest, trigger_automation: bool = True
) -> tuple[Card, bool]:
    target_list = _get_list_or_404(db, data.list_id)
    if target_list.board_id != card.board_id:
        raise BadRequestError("Cross-board card moves are not supported")

    from_list_id = card.list_id

    siblings = (
        db.query(Card)
        .filter(Card.list_id == data.list_id)
        .order_by(Card.position)
        .with_for_update()
        .all()
    )
    others = [s for s in siblings if s.id != card.id]

    before = next((s for s in others if s.id == data.before_id), None) if data.before_id else None
    after = next((s for s in others if s.id == data.after_id), None) if data.after_id else None
    if data.before_id and before is None:
        raise BadRequestError("before_id is not a card in the target list")
    if data.after_id and after is None:
        raise BadRequestError("after_id is not a card in the target list")
    if before is not None and after is not None and before.position >= after.position:
        raise BadRequestError("before_id must precede after_id; refetch and retry")

    before_pos = before.position if before else None
    after_pos = after.position if after else None

    rebalanced = False
    if not needs_rebalance(before_pos, after_pos):
        new_position = position_between(before_pos, after_pos)
    else:
        rebalanced = True
        final_order: list[Card] = []
        inserted = False
        for sibling in others:
            if after is not None and sibling.id == after.id and not inserted:
                final_order.append(card)
                inserted = True
            final_order.append(sibling)
        if not inserted:
            final_order.append(card)
        new_positions = rebalanced_positions(final_order)
        for index, item in enumerate(final_order):
            if item.id != card.id:
                item.position = new_positions[index]
        new_position = new_positions[final_order.index(card)]

    card.list_id = data.list_id
    card.position = new_position

    activity_service.log_activity(
        db, board_id=card.board_id, card_id=card.id, action_type="card.moved",
        actor_id=actor.id if actor else None,
        payload={"from_list_id": str(from_list_id), "to_list_id": str(data.list_id)},
    )
    db.commit()
    db.refresh(card)

    if trigger_automation and from_list_id != data.list_id:
        from app.services import automation_service

        automation_service.evaluate(
            db, card.board_id, "card_moved_to_list",
            {"card_id": card.id, "from_list_id": from_list_id, "to_list_id": data.list_id},
        )
    return card, rebalanced


def set_cover(db: Session, card: Card, data: CardCoverUpdate) -> Card:
    if data.attachment_id is not None:
        from app.models.attachment import Attachment

        attachment = db.get(Attachment, data.attachment_id)
        if attachment is None or attachment.card_id != card.id:
            raise BadRequestError("Attachment must belong to this card")
    card.cover_attachment_id = data.attachment_id
    db.commit()
    db.refresh(card)
    return card


def list_card_members(db: Session, card_id: uuid.UUID) -> list[User]:
    return (
        db.query(User)
        .join(CardMember, CardMember.user_id == User.id)
        .filter(CardMember.card_id == card_id)
        .all()
    )


def assign_member(db: Session, card: Card, user_id: uuid.UUID) -> None:
    board_member = db.query(BoardMember).filter_by(board_id=card.board_id, user_id=user_id).one_or_none()
    if board_member is None:
        raise BadRequestError("User must be a board member to be assigned")
    existing = db.query(CardMember).filter_by(card_id=card.id, user_id=user_id).one_or_none()
    if existing is None:
        db.add(CardMember(card_id=card.id, user_id=user_id))
        activity_service.log_activity(
            db, board_id=card.board_id, card_id=card.id, action_type="card.member_assigned",
            payload={"user_id": str(user_id)},
        )
        db.commit()


def unassign_member(db: Session, card: Card, user_id: uuid.UUID) -> None:
    member = db.query(CardMember).filter_by(card_id=card.id, user_id=user_id).one_or_none()
    if member is not None:
        db.delete(member)
        db.commit()


def list_card_labels(db: Session, card_id: uuid.UUID) -> list[Label]:
    return db.query(Label).join(CardLabel, CardLabel.label_id == Label.id).filter(CardLabel.card_id == card_id).all()


def add_label(db: Session, card: Card, label_id: uuid.UUID, trigger_automation: bool = True) -> None:
    label = db.get(Label, label_id)
    if label is None or label.board_id != card.board_id:
        raise BadRequestError("Label must belong to this card's board")
    existing = db.query(CardLabel).filter_by(card_id=card.id, label_id=label_id).one_or_none()
    if existing is None:
        db.add(CardLabel(card_id=card.id, label_id=label_id))
        activity_service.log_activity(
            db, board_id=card.board_id, card_id=card.id, action_type="card.label_added",
            payload={"label_id": str(label_id)},
        )
        db.commit()

        if trigger_automation:
            from app.services import automation_service

            automation_service.evaluate(
                db, card.board_id, "label_added", {"card_id": card.id, "label_id": label_id}
            )


def remove_label(db: Session, card: Card, label_id: uuid.UUID) -> None:
    edge = db.query(CardLabel).filter_by(card_id=card.id, label_id=label_id).one_or_none()
    if edge is not None:
        db.delete(edge)
        db.commit()
