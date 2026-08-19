"""Automation ("Butler") rule data model support: trigger/action config schemas
and validation. See phase-1 plan section 6.

The evaluation engine (matching live events against stored rules and dispatching
actions) is built in phase 2, once the domain services it calls into exist.
"""
import uuid

from pydantic import BaseModel


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
