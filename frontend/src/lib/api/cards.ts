import { apiFetch } from "@/lib/api/client";
import type { ActivityLogEntry } from "@/types/activity";
import type { Card, CardCoverUpdate, CardCreate, CardUpdate, MoveCardRequest, MoveCardResponse } from "@/types/card";
import type { Label } from "@/types/label";
import type { TemplateCaptureCardRequest, Template } from "@/types/template";
import type { User } from "@/types/user";

export const cardsApi = {
  create: (data: CardCreate) => apiFetch<Card>("/cards", { method: "POST", body: JSON.stringify(data) }),
  get: (id: string) => apiFetch<Card>(`/cards/${id}`),
  update: (id: string, data: CardUpdate) => apiFetch<Card>(`/cards/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  move: (id: string, data: MoveCardRequest) =>
    apiFetch<MoveCardResponse>(`/cards/${id}/move`, { method: "PATCH", body: JSON.stringify(data) }),
  setCover: (id: string, data: CardCoverUpdate) =>
    apiFetch<Card>(`/cards/${id}/cover`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<void>(`/cards/${id}`, { method: "DELETE" }),
  members: (id: string) => apiFetch<User[]>(`/cards/${id}/members`),
  assignMember: (id: string, userId: string) => apiFetch<void>(`/cards/${id}/members/${userId}`, { method: "POST" }),
  unassignMember: (id: string, userId: string) => apiFetch<void>(`/cards/${id}/members/${userId}`, { method: "DELETE" }),
  labels: (id: string) => apiFetch<Label[]>(`/cards/${id}/labels`),
  addLabel: (id: string, labelId: string) => apiFetch<void>(`/cards/${id}/labels/${labelId}`, { method: "POST" }),
  removeLabel: (id: string, labelId: string) => apiFetch<void>(`/cards/${id}/labels/${labelId}`, { method: "DELETE" }),
  activity: (id: string, limit = 50) => apiFetch<ActivityLogEntry[]>(`/cards/${id}/activity?limit=${limit}`),
  captureTemplate: (id: string, data: TemplateCaptureCardRequest) =>
    apiFetch<Template>(`/cards/${id}/templates`, { method: "POST", body: JSON.stringify(data) }),
};
