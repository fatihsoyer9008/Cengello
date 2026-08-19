import uuid

from pydantic import BaseModel, ConfigDict


class AutomationActionBase(BaseModel):
    action_type: str
    action_config: dict = {}
    position: int


class AutomationActionCreate(AutomationActionBase):
    pass


class AutomationActionRead(AutomationActionBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    rule_id: uuid.UUID


class AutomationRuleBase(BaseModel):
    name: str
    trigger_type: str
    trigger_config: dict = {}
    is_enabled: bool = True


class AutomationRuleCreate(AutomationRuleBase):
    board_id: uuid.UUID
    actions: list[AutomationActionCreate] = []


class AutomationRuleRead(AutomationRuleBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    board_id: uuid.UUID
    created_by: uuid.UUID
    actions: list[AutomationActionRead] = []


class AutomationRuleUpdate(BaseModel):
    name: str | None = None
    trigger_type: str | None = None
    trigger_config: dict | None = None
    is_enabled: bool | None = None
