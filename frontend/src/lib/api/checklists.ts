import { apiFetch } from "@/lib/api/client";
import type {
  Checklist,
  ChecklistCreate,
  ChecklistItem,
  ChecklistItemCreate,
  ChecklistItemUpdate,
  ChecklistUpdate,
  ChecklistWithItems,
} from "@/types/checklist";

export const checklistsApi = {
  create: (data: ChecklistCreate) => apiFetch<Checklist>("/checklists", { method: "POST", body: JSON.stringify(data) }),
  listForCard: (cardId: string) => apiFetch<ChecklistWithItems[]>(`/cards/${cardId}/checklists`),
  update: (id: string, data: ChecklistUpdate) =>
    apiFetch<Checklist>(`/checklists/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<void>(`/checklists/${id}`, { method: "DELETE" }),
  createItem: (data: ChecklistItemCreate) =>
    apiFetch<ChecklistItem>("/checklist-items", { method: "POST", body: JSON.stringify(data) }),
  updateItem: (id: string, data: ChecklistItemUpdate) =>
    apiFetch<ChecklistItem>(`/checklist-items/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  removeItem: (id: string) => apiFetch<void>(`/checklist-items/${id}`, { method: "DELETE" }),
};
