"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

import { BoardView } from "@/components/board/BoardView";
import { CardDetailModal } from "@/components/card-modal/CardDetailModal";
import { AppShell } from "@/components/layout/AppShell";
import { boardsApi } from "@/lib/api/boards";
import { useAuth } from "@/lib/auth/auth-context";
import { pushRecentBoard } from "@/lib/recent-boards";

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (boardId) pushRecentBoard(boardId);
  }, [boardId]);

  const { data: board } = useQuery({
    queryKey: ["boards", boardId],
    queryFn: () => boardsApi.get(boardId),
    enabled: !!boardId,
  });

  const cardId = searchParams.get("card");

  if (status !== "authenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading…</p>
      </main>
    );
  }

  return (
    <AppShell>
      <div className="flex h-full flex-col pt-4">
        <h1 className="shrink-0 px-4 pb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{board?.name}</h1>
        <div className="min-h-0 flex-1">
          <BoardView boardId={boardId} />
        </div>
      </div>

      {cardId && <CardDetailModal boardId={boardId} cardId={cardId} onClose={() => router.push(pathname)} />}
    </AppShell>
  );
}
