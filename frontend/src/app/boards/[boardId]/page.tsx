"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

import { BoardView } from "@/components/board/BoardView";
import { CardDetailModal } from "@/components/card-modal/CardDetailModal";
import { AppShell } from "@/components/layout/AppShell";
import { boardsApi } from "@/lib/api/boards";
import { useAuth } from "@/lib/auth/auth-context";

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

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
    <AppShell boardId={boardId} workspaceId={board?.workspace_id} title={board?.name}>
      <div className="h-full pt-4">
        <BoardView boardId={boardId} />
      </div>

      {cardId && <CardDetailModal boardId={boardId} cardId={cardId} onClose={() => router.push(pathname)} />}
    </AppShell>
  );
}
