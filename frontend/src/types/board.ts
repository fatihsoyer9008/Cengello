export type BoardRole = "admin" | "member" | "viewer";

export interface Board {
  id: string;
  name: string;
  description: string | null;
  background: string | null;
  workspace_id: string;
  is_archived: boolean;
  is_template: boolean;
  created_by: string;
  created_at: string;
}

export interface BoardCreate {
  name: string;
  description?: string | null;
  background?: string | null;
  workspace_id: string;
}

export interface BoardUpdate {
  name?: string;
  description?: string | null;
  background?: string | null;
  is_archived?: boolean;
}

export interface BoardMember {
  id: string;
  board_id: string;
  user_id: string;
  role: BoardRole;
  is_starred: boolean;
}

export interface BoardMemberCreate {
  email: string;
  role?: BoardRole;
}

export interface BoardMemberUpdate {
  role: BoardRole;
}
