"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Copy, LayoutGrid, Link2, MoreHorizontal, Settings, Share2, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BoardMembersManager } from "@/components/admin/BoardMembersManager";
import { Button } from "@/components/ui/Button";
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

function ShareLinkSection({ boardId, open }: { boardId: string; open: boolean }) {
  const [copied, setCopied] = useState(false);
  const generateLink = useMutation({ mutationFn: () => boardsApi.share(boardId) });

  useEffect(() => {
    if (open && !generateLink.data && !generateLink.isPending) {
      generateLink.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const url = generateLink.data ? `${window.location.origin}/join/${generateLink.data.token}` : null;

  async function handleCopy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mb-4 rounded-md border border-gray-200 p-3 dark:border-white/10">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200">
        <Link2 className="h-3.5 w-3.5" />
        Bağlantıyla davet et
      </p>
      {url ? (
        <div className="flex gap-2">
          <input
            readOnly
            value={url}
            onFocus={(e) => e.target.select()}
            className="w-full truncate rounded border border-gray-300 bg-gray-50 px-2.5 py-1.5 text-sm text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
          />
          <Button type="button" variant="secondary" onClick={handleCopy} className="shrink-0">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Kopyalandı" : "Kopyala"}
          </Button>
        </div>
      ) : generateLink.isError ? (
        <p className="text-sm text-red-500">Bağlantı oluşturulamadı.</p>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500">Bağlantı oluşturuluyor…</p>
      )}
      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
        Bu bağlantıya sahip olan herkes panoya üye olarak katılabilir.
      </p>
    </div>
  );
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
        <ShareLinkSection boardId={board.id} open={shareOpen} />
        <BoardMembersManager boardId={board.id} ownerId={board.created_by} />
      </Dialog>
    </header>
  );
}
