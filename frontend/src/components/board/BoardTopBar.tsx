"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, LayoutGrid, MoreHorizontal, Settings, Share2, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { BoardMembersManager } from "@/components/admin/BoardMembersManager";
import { Dialog } from "@/components/ui/Dialog";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { useBoardLookups } from "@/hooks/useBoardLookups";
import { boardsApi } from "@/lib/api/boards";
import { useAuth } from "@/lib/auth/auth-context";
import { getUserColor } from "@/lib/board-theme";
import type { Board } from "@/types/board";

const MAX_AVATARS = 5;

function initials(fullName: string): string {
  return fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function BoardTopBar({ board }: { board: Board }) {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [shareOpen, setShareOpen] = useState(false);

  const { data: members } = useQuery({
    queryKey: ["boards", board.id, "members"],
    queryFn: () => boardsApi.members(board.id),
  });
  const { usersById } = useBoardLookups(board.id);

  const memberIds = members?.map((m) => m.user_id) ?? [];

  const isStarred = members?.find((m) => m.user_id === currentUser?.id)?.is_starred ?? false;
  const toggleStar = useMutation({
    mutationFn: () => boardsApi.setStarred(board.id, !isStarred),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["boards", board.id, "members"] }),
  });

  const archiveBoard = useMutation({
    mutationFn: () => boardsApi.update(board.id, { is_archived: true }),
    onSuccess: () => router.push("/workspaces"),
  });

  const visibleMemberIds = memberIds.slice(0, MAX_AVATARS);
  const overflow = memberIds.length - visibleMemberIds.length;

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-white/10 bg-black/20 px-4">
      <Link
        href={`/workspaces/${board.workspace_id}/boards`}
        className="flex min-w-0 items-center gap-2 text-sm font-semibold text-white hover:opacity-90"
      >
        <LayoutGrid className="h-4 w-4 shrink-0" />
        <span className="truncate">{board.name}</span>
      </Link>

      <div className="flex-1" />

      <div className="flex -space-x-1.5">
        {visibleMemberIds.map((id) => (
          <span
            key={id}
            title={usersById.get(id)?.full_name}
            className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#1d2125] text-[10px] font-bold text-white ${getUserColor(id)}`}
          >
            {usersById.get(id) ? initials(usersById.get(id)!.full_name) : "?"}
          </span>
        ))}
        {overflow > 0 && (
          <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#1d2125] bg-gray-600 text-[10px] font-bold text-white">
            +{overflow}
          </span>
        )}
      </div>

      <button className="rounded p-1.5 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Bildirimler">
        <Bell className="h-4 w-4" />
      </button>
      <Link
        href={`/boards/${board.id}/settings/labels`}
        className="rounded p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
        aria-label="Pano ayarları"
      >
        <Settings className="h-4 w-4" />
      </Link>
      <button
        onClick={() => toggleStar.mutate()}
        className={`rounded p-1.5 hover:bg-white/10 ${isStarred ? "text-amber-400" : "text-white/70 hover:text-white"}`}
        aria-label="Yıldızla"
      >
        <Star className="h-4 w-4" fill={isStarred ? "currentColor" : "none"} />
      </button>
      <button
        onClick={() => setShareOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/20"
      >
        <Share2 className="h-3.5 w-3.5" />
        Paylaş
      </button>
      <DropdownMenu
        trigger={
          <button className="rounded p-1.5 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Diğer">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        }
        items={[
          { label: "Pano ayarları", onSelect: () => router.push(`/boards/${board.id}/settings/labels`) },
          { label: "Panoyu arşivle", onSelect: () => archiveBoard.mutate(), destructive: true },
        ]}
      />

      <Dialog open={shareOpen} onOpenChange={setShareOpen} title="Panoyu paylaş" widthClassName="max-w-lg">
        <BoardMembersManager boardId={board.id} />
      </Dialog>
    </header>
  );
}
