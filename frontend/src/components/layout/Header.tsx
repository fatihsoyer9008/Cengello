"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell, HelpCircle, LayoutGrid, Moon, Plus, Search, Sun } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { CreateBoardDialog } from "@/components/workspace/CreateBoardDialog";
import { authApi } from "@/lib/api/auth";
import { workspacesApi } from "@/lib/api/workspaces";
import { useAuth } from "@/lib/auth/auth-context";
import { clearAccessToken } from "@/lib/auth/token-store";
import { useTheme } from "@/lib/theme/theme-context";

function initials(fullName: string): string {
  return fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [createTarget, setCreateTarget] = useState<string | null>(null);

  const { data: workspaces } = useQuery({ queryKey: ["workspaces"], queryFn: workspacesApi.list });

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

  const createButtonClass =
    "inline-flex shrink-0 items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 dark:border-white/10 dark:bg-[#1d2125]">
      <Link href="/workspaces" className="flex shrink-0 items-center gap-2 text-gray-900 dark:text-gray-100">
        <LayoutGrid className="h-6 w-6 text-brand" />
        <span className="text-lg font-bold tracking-tight">Cengello</span>
      </Link>

      <div className="flex flex-1 items-center justify-center gap-2 px-2">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            placeholder="Arama"
            className="w-full rounded-md border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-brand focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:bg-white/10"
          />
        </div>

        {workspaces && workspaces.length > 1 ? (
          <DropdownMenu
            trigger={
              <button className={createButtonClass}>
                <Plus className="h-4 w-4" />
                Oluştur
              </button>
            }
            items={workspaces.map((ws) => ({ label: ws.name, onSelect: () => setCreateTarget(ws.id) }))}
          />
        ) : (
          <button
            className={createButtonClass}
            disabled={!workspaces || workspaces.length === 0}
            onClick={() => workspaces?.[0] && setCreateTarget(workspaces[0].id)}
          >
            <Plus className="h-4 w-4" />
            Oluştur
          </button>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={toggleTheme}
          className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
          aria-label="Temayı değiştir"
        >
          {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>
        <button
          className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
          aria-label="Bildirimler"
        >
          <Bell className="h-[18px] w-[18px]" />
        </button>
        <button
          className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
          aria-label="Yardım"
        >
          <HelpCircle className="h-[18px] w-[18px]" />
        </button>
        {user && (
          <DropdownMenu
            trigger={
              <button className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-xs font-semibold text-white">
                {initials(user.full_name)}
              </button>
            }
            items={[{ label: "Çıkış yap", onSelect: handleLogout, destructive: true }]}
          />
        )}
      </div>

      {createTarget && (
        <CreateBoardDialog
          open={!!createTarget}
          onOpenChange={(open) => !open && setCreateTarget(null)}
          workspaceId={createTarget}
        />
      )}
    </header>
  );
}
