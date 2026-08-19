import uuid

from sqlalchemy.orm import Session

from app.core.dependencies import assert_board_role, assert_workspace_role
from app.core.exceptions import BadRequestError, ForbiddenError, NotFoundError
from app.models.board import Board, BoardMember
from app.models.card import Card
from app.models.checklist import Checklist, ChecklistItem
from app.models.custom_field import CustomField, CustomFieldValue
from app.models.enums import BoardRole, TemplateScope, WorkspaceRole
from app.models.label import CardLabel, Label
from app.models.list import List
from app.models.template import Template
from app.models.user import User
from app.schemas.template import TemplateApplyRequest, TemplateCaptureBoardRequest, TemplateCaptureCardRequest


def _capture_labels(db: Session, card_id: uuid.UUID) -> list[dict]:
    labels = db.query(Label).join(CardLabel, CardLabel.label_id == Label.id).filter(CardLabel.card_id == card_id).all()
    return [{"name": l.name, "color": l.color} for l in labels]


def _capture_checklists(db: Session, card_id: uuid.UUID) -> list[dict]:
    checklists = db.query(Checklist).filter(Checklist.card_id == card_id).order_by(Checklist.position).all()
    result = []
    for cl in checklists:
        items = db.query(ChecklistItem).filter(ChecklistItem.checklist_id == cl.id).order_by(ChecklistItem.position).all()
        result.append({"title": cl.title, "items": [{"text": i.text, "position": idx} for idx, i in enumerate(items)]})
    return result


def _capture_custom_field_values(db: Session, card_id: uuid.UUID) -> dict:
    values = db.query(CustomFieldValue).filter(CustomFieldValue.card_id == card_id).all()
    result = {}
    for v in values:
        field = db.get(CustomField, v.custom_field_id)
        if field is not None:
            result[field.name] = v.value
    return result


def capture_board(db: Session, board: Board) -> dict:
    labels = db.query(Label).filter(Label.board_id == board.id).all()
    custom_fields = db.query(CustomField).filter(CustomField.board_id == board.id).order_by(CustomField.position).all()
    lists = db.query(List).filter(List.board_id == board.id, List.is_archived.is_(False)).order_by(List.position).all()

    list_payload = []
    for idx, lst in enumerate(lists):
        cards = db.query(Card).filter(Card.list_id == lst.id, Card.is_archived.is_(False)).order_by(Card.position).all()
        card_payload = []
        for c_idx, card in enumerate(cards):
            card_payload.append({
                "title": card.title,
                "description": card.description,
                "position": c_idx,
                "labels": _capture_labels(db, card.id),
                "checklists": _capture_checklists(db, card.id),
                "custom_field_values": _capture_custom_field_values(db, card.id),
            })
        list_payload.append({"name": lst.name, "position": idx, "cards": card_payload})

    return {
        "board": {"name": board.name, "description": board.description, "background": board.background},
        "labels": [{"name": l.name, "color": l.color} for l in labels],
        "custom_fields": [
            {"name": f.name, "field_type": f.field_type.value, "config": f.config, "position": idx}
            for idx, f in enumerate(custom_fields)
        ],
        "lists": list_payload,
    }


def capture_card(db: Session, card: Card) -> dict:
    return {
        "card": {"title": card.title, "description": card.description},
        "labels": _capture_labels(db, card.id),
        "checklists": _capture_checklists(db, card.id),
        "custom_field_values": _capture_custom_field_values(db, card.id),
    }


def capture_board_template(db: Session, actor: User, board: Board, data: TemplateCaptureBoardRequest) -> Template:
    assert_workspace_role(db, actor.id, data.workspace_id, WorkspaceRole.member)
    template = Template(
        name=data.name, description=data.description, scope=TemplateScope.board.value,
        workspace_id=data.workspace_id, is_public=data.is_public,
        snapshot=capture_board(db, board), created_by=actor.id,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


def capture_card_template(db: Session, actor: User, card: Card, data: TemplateCaptureCardRequest) -> Template:
    assert_workspace_role(db, actor.id, data.workspace_id, WorkspaceRole.member)
    template = Template(
        name=data.name, description=data.description, scope=TemplateScope.card.value,
        workspace_id=data.workspace_id, is_public=data.is_public,
        snapshot=capture_card(db, card), created_by=actor.id,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


def list_templates(db: Session, actor: User, workspace_id: uuid.UUID | None, scope: TemplateScope | None) -> list[Template]:
    query = db.query(Template)
    if workspace_id is not None:
        assert_workspace_role(db, actor.id, workspace_id, WorkspaceRole.member)
        query = query.filter((Template.workspace_id == workspace_id) | (Template.is_public.is_(True)))
    else:
        query = query.filter(Template.is_public.is_(True))
    if scope is not None:
        query = query.filter(Template.scope == scope.value)
    return query.all()


def get_template(db: Session, actor: User, template_id: uuid.UUID) -> Template:
    template = db.get(Template, template_id)
    if template is None:
        raise NotFoundError("Template not found")
    if not template.is_public and template.workspace_id is not None:
        assert_workspace_role(db, actor.id, template.workspace_id, WorkspaceRole.member)
    return template


def delete_template(db: Session, actor: User, template: Template) -> None:
    if template.created_by != actor.id:
        if template.workspace_id is None:
            raise ForbiddenError("Only the creator can delete this template")
        assert_workspace_role(db, actor.id, template.workspace_id, WorkspaceRole.admin)
    db.delete(template)
    db.commit()


def _apply_card_content(db: Session, card: Card, content: dict, label_map: dict[tuple[str, str], uuid.UUID], field_map: dict[str, CustomField]) -> None:
    for label_ref in content.get("labels", []):
        key = (label_ref["name"], label_ref["color"])
        label_id = label_map.get(key)
        if label_id is not None:
            db.add(CardLabel(card_id=card.id, label_id=label_id))
    for cl_ref in content.get("checklists", []):
        checklist = Checklist(card_id=card.id, title=cl_ref["title"], position=cl_ref.get("position", 0) or 0)
        db.add(checklist)
        db.flush()
        for item_ref in cl_ref.get("items", []):
            db.add(ChecklistItem(checklist_id=checklist.id, text=item_ref["text"], position=item_ref.get("position", 0)))
    for field_name, value in content.get("custom_field_values", {}).items():
        field = field_map.get(field_name)
        if field is not None:
            db.add(CustomFieldValue(custom_field_id=field.id, card_id=card.id, value=value))


def materialize_board(db: Session, actor: User, template: Template, data: TemplateApplyRequest) -> Board:
    if data.workspace_id is None:
        raise BadRequestError("workspace_id is required to apply a board template")
    assert_workspace_role(db, actor.id, data.workspace_id, WorkspaceRole.member)
    snapshot = template.snapshot

    board_info = snapshot.get("board", {})
    board = Board(
        workspace_id=data.workspace_id,
        name=data.name or board_info.get("name", template.name),
        description=board_info.get("description"),
        background=board_info.get("background"),
        created_by=actor.id,
    )
    db.add(board)
    db.flush()
    db.add(BoardMember(board_id=board.id, user_id=actor.id, role=BoardRole.admin))

    label_map: dict[tuple[str, str], uuid.UUID] = {}
    for label_ref in snapshot.get("labels", []):
        label = Label(board_id=board.id, name=label_ref["name"], color=label_ref["color"])
        db.add(label)
        db.flush()
        label_map[(label_ref["name"], label_ref["color"])] = label.id

    field_map: dict[str, CustomField] = {}
    for field_ref in snapshot.get("custom_fields", []):
        field = CustomField(
            board_id=board.id, name=field_ref["name"], field_type=field_ref["field_type"],
            config=field_ref.get("config", {}), position=field_ref.get("position", 0),
        )
        db.add(field)
        db.flush()
        field_map[field_ref["name"]] = field

    for list_ref in snapshot.get("lists", []):
        new_list = List(board_id=board.id, name=list_ref["name"], position=list_ref.get("position", 0))
        db.add(new_list)
        db.flush()
        for card_ref in list_ref.get("cards", []):
            card = Card(
                list_id=new_list.id, board_id=board.id, title=card_ref["title"],
                description=card_ref.get("description"), position=card_ref.get("position", 0),
                created_by=actor.id,
            )
            db.add(card)
            db.flush()
            _apply_card_content(db, card, card_ref, label_map, field_map)

    db.commit()
    db.refresh(board)
    return board


def materialize_card(db: Session, actor: User, template: Template, data: TemplateApplyRequest) -> Card:
    if data.list_id is None:
        raise BadRequestError("list_id is required to apply a card template")
    target_list = db.get(List, data.list_id)
    if target_list is None:
        raise NotFoundError("List not found")
    assert_board_role(db, actor.id, target_list.board_id, BoardRole.member)
    snapshot = template.snapshot

    existing_labels = db.query(Label).filter(Label.board_id == target_list.board_id).all()
    label_map = {(l.name, l.color): l.id for l in existing_labels}
    existing_fields = db.query(CustomField).filter(CustomField.board_id == target_list.board_id).all()
    field_map = {f.name: f for f in existing_fields}

    existing_positions = [row.position for row in db.query(Card.position).filter(Card.list_id == data.list_id)]
    from app.services.ordering import next_append_position

    card_info = snapshot.get("card", {})
    card = Card(
        list_id=target_list.id, board_id=target_list.board_id,
        title=data.name or card_info.get("title", template.name),
        description=card_info.get("description"),
        position=next_append_position(existing_positions),
        created_by=actor.id,
    )
    db.add(card)
    db.flush()
    _apply_card_content(db, card, snapshot, label_map, field_map)

    db.commit()
    db.refresh(card)
    return card
