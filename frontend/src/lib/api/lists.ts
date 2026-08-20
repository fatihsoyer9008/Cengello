import { apiFetch } from "@/lib/api/client";
import type { Card } from "@/types/card";
import type { BoardList, ListCreate, ListUpdate, MoveListRequest, MoveListResponse } from "@/types/list";

export const listsApi = {
  create: (data: ListCreate) => apiFetch<BoardList>("/lists", { method: "POST", body: JSON.stringify(data) }),
  get: (id: string) => apiFetch<BoardList>(`/lists/${id}`),
  update: (id: string, data: ListUpdate) => apiFetch<BoardList>(`/lists/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  move: (id: string, data: MoveListRequest) =>
    apiFetch<MoveListResponse>(`/lists/${id}/move`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<void>(`/lists/${id}`, { method: "DELETE" }),
  cards: (id: string, isArchived = false) => apiFetch<Card[]>(`/lists/${id}/cards?is_archived=${isArchived}`),
};
