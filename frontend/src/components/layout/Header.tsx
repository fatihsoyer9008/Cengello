"use client";

import { useRouter } from "next/navigation";

import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth/auth-context";
import { clearAccessToken } from "@/lib/auth/token-store";

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

function initials(fullName: string): string {
  return fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Header({ title }: { title?: string }) {
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
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
      <h1 className="text-base font-bold text-gray-900">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </span>
          <input
            placeholder="Search"
            className="w-48 rounded-md border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-sm focus:border-brand focus:bg-white focus:outline-none"
          />
        </div>
        <button className="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Notifications">
          <BellIcon />
        </button>
        {user && (
          <DropdownMenu
            trigger={
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
                {initials(user.full_name)}
              </button>
            }
            items={[{ label: "Sign out", onSelect: handleLogout, destructive: true }]}
          />
        )}
      </div>
    </header>
  );
}
