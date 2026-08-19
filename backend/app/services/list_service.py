import uuid

from sqlalchemy.orm import Session

from app.core.dependencies import assert_board_role
from app.core.exceptions import BadRequestError, NotFoundError
from app.models.enums import BoardRole
from app.models.list import List
from app.models.user import User
from app.schemas.list import ListCreate, ListUpdate, MoveListRequest
from app.services import activity_service
from app.services.ordering import needs_rebalance, next_append_position, position_between, rebalanced_positions


def list_board_lists(db: Session, board_id: uuid.UUID, include_archived: bool = False) -> list[List]:
    query = db.query(List).filter(List.board_id == board_id)
    if not include_archived:
        query = query.filter(List.is_archived.is_(False))
    return query.order_by(List.position).all()


def create_list(db: Session, actor: User, data: ListCreate) -> List:
    assert_board_role(db, actor.id, data.board_id, BoardRole.member)
    existing_positions = [row.position for row in db.query(List.position).filter(List.board_id == data.board_id)]
    new_list = List(board_id=data.board_id, name=data.name, position=next_append_position(existing_positions))
    db.add(new_list)
    db.flush()
    activity_service.log_activity(
        db, board_id=data.board_id, action_type="list.created", actor_id=actor.id, payload={"list_id": str(new_list.id)}
    )
    db.commit()
    db.refresh(new_list)
    return new_list


def update_list(db: Session, actor: User, list_obj: List, data: ListUpdate) -> List:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(list_obj, field, value)
    db.commit()
    db.refresh(list_obj)
    return list_obj


def delete_list(db: Session, list_obj: List) -> None:
    db.delete(list_obj)
    db.commit()


def move_list(db: Session, actor: User, list_obj: List, data: MoveListRequest) -> tuple[List, bool]:
    siblings = (
        db.query(List)
        .filter(List.board_id == list_obj.board_id)
        .order_by(List.position)
        .with_for_update()
        .all()
    )
    others = [s for s in siblings if s.id != list_obj.id]

    before = next((s for s in others if s.id == data.before_id), None) if data.before_id else None
    after = next((s for s in others if s.id == data.after_id), None) if data.after_id else None
    if data.before_id and before is None:
        raise BadRequestError("before_id is not a list in this board")
    if data.after_id and after is None:
        raise BadRequestError("after_id is not a list in this board")
    if before is not None and after is not None and before.position >= after.position:
        raise BadRequestError("before_id must precede after_id; refetch and retry")

    before_pos = before.position if before else None
    after_pos = after.position if after else None

    rebalanced = False
    if not needs_rebalance(before_pos, after_pos):
        list_obj.position = position_between(before_pos, after_pos)
    else:
        rebalanced = True
        final_order: list[List] = []
        inserted = False
        for sibling in others:
            if after is not None and sibling.id == after.id and not inserted:
                final_order.append(list_obj)
                inserted = True
            final_order.append(sibling)
        if not inserted:
            final_order.append(list_obj)
        new_positions = rebalanced_positions(final_order)
        for index, item in enumerate(final_order):
            item.position = new_positions[index]

    activity_service.log_activity(
        db, board_id=list_obj.board_id, action_type="list.moved", actor_id=actor.id, payload={"list_id": str(list_obj.id)}
    )
    db.commit()
    db.refresh(list_obj)
    return list_obj, rebalanced
