import { apiFetch } from "@/lib/api/client";
import type { Label, LabelCreate, LabelUpdate } from "@/types/label";

export const labelsApi = {
  create: (data: LabelCreate) => apiFetch<Label>("/labels", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: LabelUpdate) => apiFetch<Label>(`/labels/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<void>(`/labels/${id}`, { method: "DELETE" }),
};
