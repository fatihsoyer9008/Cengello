export type BoardRole = "admin" | "member" | "viewer";
export type BoardVisibility = "private" | "workspace" | "public";

export interface Board {
  id: string;
  name: string;
  description: string | null;
  background: string | null;
  visibility: BoardVisibility;
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
  visibility?: BoardVisibility;
  workspace_id: string;
}

export interface BoardUpdate {
  name?: string;
  description?: string | null;
  background?: string | null;
  visibility?: BoardVisibility;
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

export interface BoardInviteLink {
  id: string;
  board_id: string;
  token: string;
  created_at: string;
}

export interface BoardJoinResult {
  board_id: string;
  already_member: boolean;
}
