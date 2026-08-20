import { apiFetch } from "@/lib/api/client";
import type { User } from "@/types/user";

export const usersApi = {
  search: (email: string) => apiFetch<User[]>(`/users/search?email=${encodeURIComponent(email)}`),
  get: (id: string) => apiFetch<User>(`/users/${id}`),
};
