from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import assert_board_role, get_automation_rule_and_check_role, get_current_user
from app.core.exceptions import BadRequestError
from app.db.session import get_db
from app.models.automation import AutomationAction, AutomationRule
from app.models.enums import BoardRole
from app.models.user import User
from app.schemas.automation import AutomationActionCreate, AutomationRuleCreate, AutomationRuleRead, AutomationRuleUpdate
from app.services.automation_service import validate_action_config, validate_trigger_config

router = APIRouter(tags=["automation-rules"])


def _validate_rule(trigger_type: str, trigger_config: dict, actions: list[AutomationActionCreate]) -> None:
    try:
        validate_trigger_config(trigger_type, trigger_config)
        for action in actions:
            validate_action_config(action.action_type, action.action_config)
    except ValueError as exc:
        raise BadRequestError(str(exc))


@router.post("/automation-rules", response_model=AutomationRuleRead, status_code=201)
def create_rule(data: AutomationRuleCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assert_board_role(db, current_user.id, data.board_id, BoardRole.admin)
    _validate_rule(data.trigger_type, data.trigger_config, data.actions)

    rule = AutomationRule(
        board_id=data.board_id, name=data.name, trigger_type=data.trigger_type,
        trigger_config=data.trigger_config, is_enabled=data.is_enabled, created_by=current_user.id,
    )
    db.add(rule)
    db.flush()
    for index, action in enumerate(data.actions):
        db.add(AutomationAction(rule_id=rule.id, position=index, action_type=action.action_type, action_config=action.action_config))
    db.commit()
    db.refresh(rule)
    return rule


@router.get("/automation-rules/{automation_rule_id}", response_model=AutomationRuleRead)
def get_rule(rule: AutomationRule = Depends(get_automation_rule_and_check_role(BoardRole.viewer))):
    return rule


@router.patch("/automation-rules/{automation_rule_id}", response_model=AutomationRuleRead)
def update_rule(
    data: AutomationRuleUpdate,
    rule: AutomationRule = Depends(get_automation_rule_and_check_role(BoardRole.admin)),
    db: Session = Depends(get_db),
):
    updates = data.model_dump(exclude_unset=True)
    new_trigger_type = updates.get("trigger_type", rule.trigger_type)
    new_trigger_config = updates.get("trigger_config", rule.trigger_config)
    if "trigger_type" in updates or "trigger_config" in updates:
        try:
            validate_trigger_config(new_trigger_type, new_trigger_config)
        except ValueError as exc:
            raise BadRequestError(str(exc))
    for field, value in updates.items():
        setattr(rule, field, value)
    db.commit()
    db.refresh(rule)
    return rule


@router.put("/automation-rules/{automation_rule_id}/actions", response_model=AutomationRuleRead)
def replace_actions(
    actions: list[AutomationActionCreate],
    rule: AutomationRule = Depends(get_automation_rule_and_check_role(BoardRole.admin)),
    db: Session = Depends(get_db),
):
    try:
        for action in actions:
            validate_action_config(action.action_type, action.action_config)
    except ValueError as exc:
        raise BadRequestError(str(exc))

    db.query(AutomationAction).filter(AutomationAction.rule_id == rule.id).delete()
    for index, action in enumerate(actions):
        db.add(AutomationAction(rule_id=rule.id, position=index, action_type=action.action_type, action_config=action.action_config))
    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/automation-rules/{automation_rule_id}", status_code=204)
def delete_rule(rule: AutomationRule = Depends(get_automation_rule_and_check_role(BoardRole.admin)), db: Session = Depends(get_db)):
    db.delete(rule)
    db.commit()
