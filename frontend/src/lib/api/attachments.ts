import { apiFetch, apiFetchBlob } from "@/lib/api/client";
import type { Attachment } from "@/types/attachment";

export const attachmentsApi = {
  listForCard: (cardId: string) => apiFetch<Attachment[]>(`/cards/${cardId}/attachments`),
  upload: (cardId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch<Attachment>(`/cards/${cardId}/attachments`, { method: "POST", body: formData });
  },
  remove: (id: string) => apiFetch<void>(`/attachments/${id}`, { method: "DELETE" }),
  downloadUrl: (id: string) => `/attachments/${id}/download`,
  fetchDownload: (id: string) => apiFetchBlob(`/attachments/${id}/download`),
};
