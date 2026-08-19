import { apiFetch } from "@/lib/api/client";
import type { LoginRequest, TokenResponse } from "@/types/auth";
import type { User, UserCreate, UserUpdate } from "@/types/user";

export const authApi = {
  register: (data: UserCreate) =>
    apiFetch<TokenResponse>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data: LoginRequest) =>
    apiFetch<TokenResponse>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  logout: () => apiFetch<void>("/auth/logout", { method: "POST" }),
  me: () => apiFetch<User>("/auth/me"),
  updateMe: (data: UserUpdate) => apiFetch<User>("/auth/me", { method: "PATCH", body: JSON.stringify(data) }),
};
