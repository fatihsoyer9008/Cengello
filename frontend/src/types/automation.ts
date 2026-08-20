export interface AutomationAction {
  id: string;
  rule_id: string;
  action_type: string;
  action_config: Record<string, unknown>;
  position: number;
}

export interface AutomationActionCreate {
  action_type: string;
  action_config: Record<string, unknown>;
  position: number;
}

export interface AutomationRule {
  id: string;
  board_id: string;
  name: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  is_enabled: boolean;
  created_by: string;
  actions: AutomationAction[];
}

export interface AutomationRuleCreate {
  name: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  is_enabled?: boolean;
  board_id: string;
  actions: AutomationActionCreate[];
}

export interface AutomationRuleUpdate {
  name?: string;
  trigger_type?: string;
  trigger_config?: Record<string, unknown>;
  is_enabled?: boolean;
}

export const TRIGGER_TYPES = [
  "card_moved_to_list",
  "card_created_in_list",
  "label_added",
  "due_date_approaching",
  "checklist_completed",
] as const;

export const ACTION_TYPES = [
  "add_label",
  "remove_label",
  "move_card_to_list",
  "assign_member",
  "mark_due_complete",
  "post_comment",
] as const;
