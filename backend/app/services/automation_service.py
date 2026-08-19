"""Automation ("Butler") rule data model support: trigger/action config schemas,
validation, and the evaluation engine that matches live events against stored
rules and dispatches their actions.
"""
import logging
import uuid

from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.models.automation import AutomationAction, AutomationRule

logger = logging.getLogger(__name__)


# --- Trigger config schemas -------------------------------------------------

class CardMovedToListTrigger(BaseModel):
    to_list_id: uuid.UUID
    from_list_id: uuid.UUID | None = None


class CardCreatedInListTrigger(BaseModel):
    list_id: uuid.UUID


class LabelAddedTrigger(BaseModel):
    label_id: uuid.UUID


class DueDateApproachingTrigger(BaseModel):
    hours_before: int


class ChecklistCompletedTrigger(BaseModel):
    checklist_title: str | None = None


TRIGGER_SCHEMAS: dict[str, type[BaseModel]] = {
    "card_moved_to_list": CardMovedToListTrigger,
    "card_created_in_list": CardCreatedInListTrigger,
    "label_added": LabelAddedTrigger,
    "due_date_approaching": DueDateApproachingTrigger,
    "checklist_completed": ChecklistCompletedTrigger,
}


# --- Action config schemas ---------------------------------------------------

class AddLabelAction(BaseModel):
    label_id: uuid.UUID


class RemoveLabelAction(BaseModel):
    label_id: uuid.UUID


class MoveCardAction(BaseModel):
    list_id: uuid.UUID
    position: str = "bottom"  # "top" | "bottom"


class AssignMemberAction(BaseModel):
    user_id: uuid.UUID


class MarkDueCompleteAction(BaseModel):
    pass


class PostCommentAction(BaseModel):
    body: str


ACTION_SCHEMAS: dict[str, type[BaseModel]] = {
    "add_label": AddLabelAction,
    "remove_label": RemoveLabelAction,
    "move_card_to_list": MoveCardAction,
    "assign_member": AssignMemberAction,
    "mark_due_complete": MarkDueCompleteAction,
    "post_comment": PostCommentAction,
}


def validate_trigger_config(trigger_type: str, config: dict) -> BaseModel:
    schema = TRIGGER_SCHEMAS.get(trigger_type)
    if schema is None:
        raise ValueError(f"Unknown trigger_type: {trigger_type}")
    return schema.model_validate(config)


def validate_action_config(action_type: str, config: dict) -> BaseModel:
    schema = ACTION_SCHEMAS.get(action_type)
    if schema is None:
        raise ValueError(f"Unknown action_type: {action_type}")
    return schema.model_validate(config)


# --- Evaluation engine --------------------------------------------------------

def _s(value) -> str | None:
    """Normalize a UUID/str/None from either JSONB config or an in-memory context dict."""
    return str(value) if value is not None else None


def _trigger_matches(trigger_type: str, trigger_config: dict, context: dict) -> bool:
    if trigger_type == "card_moved_to_list":
        if _s(trigger_config.get("to_list_id")) != _s(context.get("to_list_id")):
            return False
        from_list_id = trigger_config.get("from_list_id")
        if from_list_id is not None and _s(from_list_id) != _s(context.get("from_list_id")):
            return False
        return True
    if trigger_type == "card_created_in_list":
        return _s(trigger_config.get("list_id")) == _s(context.get("list_id"))
    if trigger_type == "label_added":
        return _s(trigger_config.get("label_id")) == _s(context.get("label_id"))
    if trigger_type == "checklist_completed":
        title = trigger_config.get("checklist_title")
        return title is None or title == context.get("checklist_title")
    # due_date_approaching is evaluated by a separate time-based sweep, not the event path.
    return False


def _dispatch_action(db: Session, rule: AutomationRule, action: AutomationAction, context: dict) -> None:
    from app.models.card import Card
    from app.services import card_service, comment_service

    config = action.action_config
    card_id = context.get("card_id")
    card = db.get(Card, card_id) if card_id else None

    if action.action_type == "add_label" and card is not None:
        card_service.add_label(db, card, uuid.UUID(config["label_id"]), trigger_automation=False)
    elif action.action_type == "remove_label" and card is not None:
        card_service.remove_label(db, card, uuid.UUID(config["label_id"]))
    elif action.action_type == "move_card_to_list" and card is not None:
        from app.schemas.card import MoveCardRequest

        card_service.move_card(
            db, None, card, MoveCardRequest(list_id=uuid.UUID(config["list_id"])), trigger_automation=False
        )
    elif action.action_type == "assign_member" and card is not None:
        card_service.assign_member(db, card, uuid.UUID(config["user_id"]))
    elif action.action_type == "mark_due_complete" and card is not None:
        card_service.set_due_completed(db, card.id, True)
    elif action.action_type == "post_comment" and card is not None:
        comment_service.create_comment(db, card, rule.created_by, config["body"])

    from app.services import activity_service

    activity_service.log_activity(
        db, board_id=rule.board_id, card_id=card_id, action_type=f"automation.{action.action_type}",
        automation_rule_id=rule.id, payload={"action_config": config},
    )


def evaluate(db: Session, board_id: uuid.UUID, event_type: str, context: dict) -> None:
    """Called by domain services AFTER their own commit. Matches enabled rules of
    trigger_type == event_type on this board against context, then executes each
    matching rule's actions in order. One commit per rule; a failing rule is rolled
    back and logged so it can't break other rules or the request that triggered it.
    """
    rules = (
        db.query(AutomationRule)
        .filter(
            AutomationRule.board_id == board_id,
            AutomationRule.trigger_type == event_type,
            AutomationRule.is_enabled.is_(True),
        )
        .all()
    )
    for rule in rules:
        try:
            if not _trigger_matches(rule.trigger_type, rule.trigger_config, context):
                continue
            actions = (
                db.query(AutomationAction)
                .filter(AutomationAction.rule_id == rule.id)
                .order_by(AutomationAction.position)
                .all()
            )
            for action in actions:
                _dispatch_action(db, rule, action, context)
            db.commit()
        except Exception:
            db.rollback()
            logger.exception("automation rule %s failed to evaluate/execute", rule.id)
