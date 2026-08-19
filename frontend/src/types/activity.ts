export interface ActivityLogEntry {
  id: string;
  board_id: string;
  card_id: string | null;
  actor_id: string | null;
  automation_rule_id: string | null;
  action_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}
