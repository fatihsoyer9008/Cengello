"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Inbox, LayoutGrid, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { workspacesApi } from "@/lib/api/workspaces";

export type BoardTab = "inbox" | "board";

function tabClass(active: boolean, disabled = false): string {
  if (disabled) return "flex flex-col items-center gap-0.5 px-4 py-1.5 text-[11px] font-medium text-white/30 cursor-not-allowed";
  return `flex flex-col items-center gap-0.5 px-4 py-1.5 text-[11px] font-medium transition-colors ${
    active ? "text-white" : "text-white/50 hover:text-white/80"
  }`;
}

export function BoardBottomNav({
  activeTab,
  onTabChange,
  workspaceId,
  currentBoardId,
}: {
  activeTab: BoardTab;
  onTabChange: (tab: BoardTab) => void;
  workspaceId: string;
  currentBoardId: string;
}) {
  const router = useRouter();
  const { data: boards } = useQuery({
    queryKey: ["workspaces", workspaceId, "boards"],
    queryFn: () => workspacesApi.boards(workspaceId),
    enabled: !!workspaceId,
  });

  const otherBoards = (boards ?? []).filter((b) => b.id !== currentBoardId);

  return (
    <nav className="flex h-14 shrink-0 items-center justify-center gap-1 border-t border-white/10 bg-[#161a1d]">
      <button className={tabClass(activeTab === "inbox")} onClick={() => onTabChange("inbox")}>
        <Inbox className="h-4 w-4" />
        Gelen Kutusu
      </button>
      <button className={tabClass(false, true)} disabled title="Yakında">
        <CalendarDays className="h-4 w-4" />
        Planlayıcı
      </button>
      <button className={tabClass(activeTab === "board")} onClick={() => onTabChange("board")}>
        <LayoutGrid className="h-4 w-4" />
        Pano
      </button>
      <DropdownMenu
        trigger={
          <button className={tabClass(false)}>
            <RefreshCw className="h-4 w-4" />
            Panoları değiştir
          </button>
        }
        items={
          otherBoards.length > 0
            ? otherBoards.map((b) => ({ label: b.name, onSelect: () => router.push(`/boards/${b.id}`) }))
            : [{ label: "Bu çalışma alanında başka pano yok", onSelect: () => {} }]
        }
      />
    </nav>
  );
}
