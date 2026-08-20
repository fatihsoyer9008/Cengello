"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { Clock, Cog, LayoutGrid, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { CreateBoardDialog } from "@/components/workspace/CreateBoardDialog";
import { getBoardStyle, getWorkspaceColor } from "@/lib/board-theme";
import { getRecentBoardIds } from "@/lib/recent-boards";
import { workspacesApi } from "@/lib/api/workspaces";
import type { Board } from "@/types/board";

const pillClass =
  "inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10";

function BoardCard({ board }: { board: Board }) {
  return (
    <Link
      href={`/boards/${board.id}`}
      className="group relative flex h-24 flex-col justify-end overflow-hidden rounded-md p-3 shadow-sm transition hover:shadow-md"
      style={getBoardStyle(board)}
    >
      <span className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/20" />
      <span className="relative truncate text-sm font-semibold text-white drop-shadow">{board.name}</span>
    </Link>
  );
}

function CreateBoardCard({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-24 items-center justify-center rounded-md bg-gray-100 px-3 text-center text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
      >
        Yeni pano oluştur
      </button>
      <CreateBoardDialog open={open} onOpenChange={setOpen} workspaceId={workspaceId} />
    </>
  );
}

export default function WorkspacesPage() {
  const [recentIds, setRecentIds] = useState<string[]>([]);
  useEffect(() => setRecentIds(getRecentBoardIds()), []);

  const { data: workspaces, isLoading: workspacesLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: workspacesApi.list,
  });

  const boardQueries = useQueries({
    queries: (workspaces ?? []).map((ws) => ({
      queryKey: ["workspaces", ws.id, "boards"],
      queryFn: () => workspacesApi.boards(ws.id),
    })),
  });

  const boardsByWorkspace = new Map<string, Board[]>();
  (workspaces ?? []).forEach((ws, i) => {
    boardsByWorkspace.set(ws.id, boardQueries[i]?.data ?? []);
  });

  const allBoards = Array.from(boardsByWorkspace.values()).flat();
  const recentBoards = recentIds
    .map((id) => allBoards.find((b) => b.id === id))
    .filter((b): b is Board => !!b)
    .slice(0, 4);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <section className="mb-10">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
          <Clock className="h-4 w-4" />
          Son Görüntülenenler
        </div>
        {recentBoards.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Henüz görüntülenen pano yok.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {recentBoards.map((board) => (
              <BoardCard key={board.id} board={board} />
            ))}
          </div>
        )}
      </section>

      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        Çalışma Alanlarınız
      </div>

      {workspacesLoading && <p className="text-sm text-gray-400 dark:text-gray-500">Yükleniyor…</p>}
      {!workspacesLoading && workspaces?.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500">Henüz çalışma alanınız yok.</p>
      )}

      {workspaces?.map((ws) => (
        <section key={ws.id} className="mb-10">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded text-sm font-bold text-white ${getWorkspaceColor(ws.id)}`}
              >
                {ws.name[0]?.toUpperCase()}
              </span>
              <span className="font-semibold text-gray-800 dark:text-gray-100">{ws.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/workspaces/${ws.id}/boards`} className={pillClass}>
                <LayoutGrid className="h-4 w-4" />
                Panolar
              </Link>
              <Link href={`/workspaces/${ws.id}/members`} className={pillClass}>
                <Users className="h-4 w-4" />
                Üyeler
              </Link>
              <Link href={`/workspaces/${ws.id}/members`} className={pillClass}>
                <Cog className="h-4 w-4" />
                Ayarlar
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {(boardsByWorkspace.get(ws.id) ?? []).map((board) => (
              <BoardCard key={board.id} board={board} />
            ))}
            <CreateBoardCard workspaceId={ws.id} />
          </div>
        </section>
      ))}

      <button
        type="button"
        className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/5"
      >
        Tüm kapalı panoları görüntüle
      </button>
    </main>
  );
}
