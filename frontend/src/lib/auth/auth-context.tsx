"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { authApi } from "@/lib/api/auth";
import { onAuthFailure } from "@/lib/api/client";
import type { User } from "@/types/user";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    onAuthFailure(() => {
      setUser(null);
      setStatus("unauthenticated");
    });
  }, []);

  useEffect(() => {
    // No token is set yet on a fresh page load. This request will 401, which
    // triggers apiFetch's single-flight refresh-and-retry against the
    // httpOnly refresh cookie -- recovering the session without a redirect.
    authApi
      .me()
      .then((fetchedUser) => {
        setUser(fetchedUser);
        setStatus("authenticated");
      })
      .catch(() => {
        setStatus("unauthenticated");
      });
  }, []);

  const login = (loggedInUser: User) => {
    setUser(loggedInUser);
    setStatus("authenticated");
  };

  const logout = () => {
    setUser(null);
    setStatus("unauthenticated");
  };

  return <AuthContext.Provider value={{ user, status, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
