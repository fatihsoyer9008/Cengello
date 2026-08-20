export type WorkspaceRole = "owner" | "admin" | "member";

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  created_by: string;
  created_at: string;
}

export interface WorkspaceCreate {
  name: string;
  description?: string | null;
  slug: string;
}

export interface WorkspaceUpdate {
  name?: string;
  description?: string | null;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
}

export interface WorkspaceMemberCreate {
  email: string;
  role?: WorkspaceRole;
}

export interface WorkspaceMemberUpdate {
  role: WorkspaceRole;
}
