"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import Link from "next/link";

import { BoardBottomNav, type BoardTab } from "@/components/board/BoardBottomNav";
import { BoardTopBar } from "@/components/board/BoardTopBar";
import { BoardView } from "@/components/board/BoardView";
import { InboxPanel } from "@/components/board/InboxPanel";
import { CardDetailModal } from "@/components/card-modal/CardDetailModal";
import { boardsApi } from "@/lib/api/boards";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { getBoardStyle } from "@/lib/board-theme";
import { pushRecentBoard } from "@/lib/recent-boards";

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useAuth();
  const [tab, setTab] = useState<BoardTab>("board");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (boardId) pushRecentBoard(boardId);
  }, [boardId]);

  const {
    data: board,
    isError,
    error,
  } = useQuery({
    queryKey: ["boards", boardId],
    queryFn: () => boardsApi.get(boardId),
    enabled: !!boardId,
  });

  const cardId = searchParams.get("card");

  if (status === "authenticated" && isError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#1d2125] px-4 text-center">
        <p className="text-gray-300">
          {error instanceof ApiError ? String(error.detail) : "Bu pano yüklenemedi."}
        </p>
        <Link href="/workspaces" className="text-sm text-blue-400 hover:underline">
          Çalışma alanlarına dön
        </Link>
      </main>
    );
  }

  if (status !== "authenticated" || !board) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#1d2125]">
        <p className="text-gray-400">Yükleniyor…</p>
      </main>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={getBoardStyle(board)}>
      <BoardTopBar board={board} />

      <div className="flex flex-1 overflow-hidden">
        {tab === "inbox" && <InboxPanel onClose={() => setTab("board")} />}
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden pt-3">
          <BoardView boardId={boardId} />
        </div>
      </div>

      <BoardBottomNav activeTab={tab} onTabChange={setTab} workspaceId={board.workspace_id} currentBoardId={boardId} />

      {cardId && <CardDetailModal boardId={boardId} cardId={cardId} onClose={() => router.push(pathname)} />}
    </div>
  );
}
