"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth/auth-context";
import { clearAccessToken } from "@/lib/auth/token-store";

export function TopNav() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch {
      // ignore -- we're logging out client-side regardless
    }
    clearAccessToken();
    logout();
    router.replace("/login");
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
      <Link href="/workspaces" className="text-lg font-bold text-gray-900">
        Cengello
      </Link>
      <div className="flex items-center gap-3">
        {user && <span className="text-sm text-gray-600">{user.full_name}</span>}
        <Button variant="ghost" onClick={handleLogout}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
