import { apiFetch } from "@/lib/api/client";
import type { Board } from "@/types/board";
import type {
  Workspace,
  WorkspaceCreate,
  WorkspaceMember,
  WorkspaceMemberCreate,
  WorkspaceMemberUpdate,
  WorkspaceUpdate,
} from "@/types/workspace";

export const workspacesApi = {
  list: () => apiFetch<Workspace[]>("/workspaces"),
  create: (data: WorkspaceCreate) => apiFetch<Workspace>("/workspaces", { method: "POST", body: JSON.stringify(data) }),
  get: (id: string) => apiFetch<Workspace>(`/workspaces/${id}`),
  update: (id: string, data: WorkspaceUpdate) =>
    apiFetch<Workspace>(`/workspaces/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<void>(`/workspaces/${id}`, { method: "DELETE" }),
  boards: (id: string) => apiFetch<Board[]>(`/workspaces/${id}/boards`),
  members: (id: string) => apiFetch<WorkspaceMember[]>(`/workspaces/${id}/members`),
  addMember: (id: string, data: WorkspaceMemberCreate) =>
    apiFetch<WorkspaceMember>(`/workspaces/${id}/members`, { method: "POST", body: JSON.stringify(data) }),
  updateMember: (id: string, memberId: string, data: WorkspaceMemberUpdate) =>
    apiFetch<WorkspaceMember>(`/workspaces/${id}/members/${memberId}`, { method: "PATCH", body: JSON.stringify(data) }),
  removeMember: (id: string, memberId: string) =>
    apiFetch<void>(`/workspaces/${id}/members/${memberId}`, { method: "DELETE" }),
};
