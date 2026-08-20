export interface Card {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  start_date: string | null;
  list_id: string;
  board_id: string;
  position: number;
  due_completed: boolean;
  cover_attachment_id: string | null;
  is_archived: boolean;
  created_by: string;
  created_at: string;
}

export interface CardCreate {
  title: string;
  description?: string | null;
  due_date?: string | null;
  start_date?: string | null;
  list_id: string;
}

export interface CardUpdate {
  title?: string;
  description?: string | null;
  due_date?: string | null;
  start_date?: string | null;
  due_completed?: boolean;
  is_archived?: boolean;
}

export interface MoveCardRequest {
  list_id: string;
  before_id?: string | null;
  after_id?: string | null;
}

export interface MoveCardResponse {
  card: Card;
  rebalanced: boolean;
}

export interface CardCoverUpdate {
  attachment_id: string | null;
}

export interface CardSummary extends Card {
  label_ids: string[];
  assignee_ids: string[];
  checklist_total: number;
  checklist_completed: number;
  comment_count: number;
}

export interface CardListFilters {
  list_id?: string;
  due_after?: string;
  due_before?: string;
  member_id?: string;
  label_id?: string;
  is_archived?: boolean;
  q?: string;
}
