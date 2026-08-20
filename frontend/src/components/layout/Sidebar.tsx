"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Home, LayoutDashboard, LayoutTemplate, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { CreateWorkspaceDialog } from "@/components/workspace/CreateWorkspaceDialog";
import { getWorkspaceColor } from "@/lib/board-theme";
import { workspacesApi } from "@/lib/api/workspaces";

function navItemClass(active: boolean): string {
  return `flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium transition-colors ${
    active
      ? "bg-blue-50 text-brand dark:bg-blue-500/15 dark:text-blue-400"
      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
  }`;
}

export function Sidebar() {
  const pathname = usePathname();
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const { data: workspaces } = useQuery({ queryKey: ["workspaces"], queryFn: workspacesApi.list });

  const boardsActive = pathname.startsWith("/workspaces") || pathname.startsWith("/boards");

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-white px-2 py-3 dark:border-white/10 dark:bg-[#1d2125]">
      <nav className="space-y-0.5">
        <Link href="/workspaces" className={navItemClass(boardsActive)}>
          <LayoutDashboard className="h-[18px] w-[18px]" />
          Panolar
        </Link>
        <button type="button" className={navItemClass(false)}>
          <LayoutTemplate className="h-[18px] w-[18px]" />
          Şablonlar
        </button>
        <Link href="/workspaces" className={navItemClass(false)}>
          <Home className="h-[18px] w-[18px]" />
          Anasayfa
        </Link>
      </nav>

      <div className="mt-5 flex items-center justify-between px-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Çalışma Alanları</span>
        <button
          type="button"
          onClick={() => setCreateWorkspaceOpen(true)}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-white/10 dark:hover:text-gray-300"
          aria-label="Çalışma alanı oluştur"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-1 space-y-0.5">
        {workspaces?.map((ws) => (
          <Link
            key={ws.id}
            href={`/workspaces/${ws.id}/boards`}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold text-white ${getWorkspaceColor(ws.id)}`}
            >
              {ws.name[0]?.toUpperCase()}
            </span>
            <span className="truncate">{ws.name}</span>
            <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 text-gray-400" />
          </Link>
        ))}
      </div>

      <CreateWorkspaceDialog open={createWorkspaceOpen} onOpenChange={setCreateWorkspaceOpen} />
    </aside>
  );
}
