export interface Checklist {
  id: string;
  title: string;
  card_id: string;
  position: number;
}

export interface ChecklistCreate {
  title?: string;
  card_id: string;
}

export interface ChecklistUpdate {
  title?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  assigned_to: string | null;
  due_date: string | null;
  checklist_id: string;
  is_complete: boolean;
  position: number;
}

export interface ChecklistItemCreate {
  text: string;
  assigned_to?: string | null;
  due_date?: string | null;
  checklist_id: string;
}

export interface ChecklistItemUpdate {
  text?: string;
  assigned_to?: string | null;
  due_date?: string | null;
  is_complete?: boolean;
}

export interface ChecklistWithItems extends Checklist {
  items: ChecklistItem[];
  completed_count: number;
  total_count: number;
}
