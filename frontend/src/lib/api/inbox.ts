import { apiFetch } from "@/lib/api/client";
import type { InboxItem, InboxItemCreate } from "@/types/inbox";

export const inboxApi = {
  list: () => apiFetch<InboxItem[]>("/inbox"),
  create: (data: InboxItemCreate) => apiFetch<InboxItem>("/inbox", { method: "POST", body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<void>(`/inbox/${id}`, { method: "DELETE" }),
};
