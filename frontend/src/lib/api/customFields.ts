import { apiFetch } from "@/lib/api/client";
import type { CustomField, CustomFieldCreate, CustomFieldUpdate, CustomFieldValue, CustomFieldValueUpsert } from "@/types/customField";

export const customFieldsApi = {
  create: (data: CustomFieldCreate) => apiFetch<CustomField>("/custom-fields", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: CustomFieldUpdate) =>
    apiFetch<CustomField>(`/custom-fields/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<void>(`/custom-fields/${id}`, { method: "DELETE" }),
  valuesForCard: (cardId: string) => apiFetch<CustomFieldValue[]>(`/cards/${cardId}/custom-field-values`),
  upsertValue: (cardId: string, customFieldId: string, data: CustomFieldValueUpsert) =>
    apiFetch<CustomFieldValue>(`/cards/${cardId}/custom-fields/${customFieldId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
