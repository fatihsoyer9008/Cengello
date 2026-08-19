import { apiFetch } from "@/lib/api/client";
import type { Comment, CommentCreate, CommentUpdate } from "@/types/comment";

export const commentsApi = {
  create: (data: CommentCreate) => apiFetch<Comment>("/comments", { method: "POST", body: JSON.stringify(data) }),
  listForCard: (cardId: string) => apiFetch<Comment[]>(`/cards/${cardId}/comments`),
  update: (id: string, data: CommentUpdate) => apiFetch<Comment>(`/comments/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<void>(`/comments/${id}`, { method: "DELETE" }),
};
