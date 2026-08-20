import { apiFetch } from "@/lib/api/client";
import type { ActivityLogEntry } from "@/types/activity";
import type { AutomationRule } from "@/types/automation";
import type { Board, BoardCreate, BoardMember, BoardMemberCreate, BoardMemberUpdate, BoardUpdate } from "@/types/board";
import type { Card, CardListFilters, CardSummary } from "@/types/card";
import type { CustomField } from "@/types/customField";
import type { Label } from "@/types/label";
import type { BoardList } from "@/types/list";
import type { TemplateCaptureBoardRequest, Template } from "@/types/template";

function toQuery(params: Record<string, string | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (entries.length === 0) return "";
  return "?" + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

export const boardsApi = {
  create: (data: BoardCreate) => apiFetch<Board>("/boards", { method: "POST", body: JSON.stringify(data) }),
  get: (id: string) => apiFetch<Board>(`/boards/${id}`),
  update: (id: string, data: BoardUpdate) => apiFetch<Board>(`/boards/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<void>(`/boards/${id}`, { method: "DELETE" }),
  lists: (id: string, includeArchived = false) =>
    apiFetch<BoardList[]>(`/boards/${id}/lists${toQuery({ include_archived: includeArchived })}`),
  cards: (id: string, filters: CardListFilters = {}) =>
    apiFetch<Card[]>(`/boards/${id}/cards${toQuery(filters as Record<string, string | boolean | undefined>)}`),
  cardsSummary: (id: string, filters: CardListFilters = {}) =>
    apiFetch<CardSummary[]>(`/boards/${id}/cards/summary${toQuery(filters as Record<string, string | boolean | undefined>)}`),
  labels: (id: string) => apiFetch<Label[]>(`/boards/${id}/labels`),
  customFields: (id: string) => apiFetch<CustomField[]>(`/boards/${id}/custom-fields`),
  automationRules: (id: string) => apiFetch<AutomationRule[]>(`/boards/${id}/automation-rules`),
  activity: (id: string, cardId?: string, limit = 50) =>
    apiFetch<ActivityLogEntry[]>(`/boards/${id}/activity${toQuery({ card_id: cardId, limit: String(limit) })}`),
  setStarred: (id: string, is_starred: boolean) =>
    apiFetch<BoardMember>(`/boards/${id}/star`, { method: "PATCH", body: JSON.stringify({ is_starred }) }),
  members: (id: string) => apiFetch<BoardMember[]>(`/boards/${id}/members`),
  addMember: (id: string, data: BoardMemberCreate) =>
    apiFetch<BoardMember>(`/boards/${id}/members`, { method: "POST", body: JSON.stringify(data) }),
  updateMember: (id: string, memberId: string, data: BoardMemberUpdate) =>
    apiFetch<BoardMember>(`/boards/${id}/members/${memberId}`, { method: "PATCH", body: JSON.stringify(data) }),
  removeMember: (id: string, memberId: string) => apiFetch<void>(`/boards/${id}/members/${memberId}`, { method: "DELETE" }),
  captureTemplate: (id: string, data: TemplateCaptureBoardRequest) =>
    apiFetch<Template>(`/boards/${id}/templates`, { method: "POST", body: JSON.stringify(data) }),
};
