"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

import { BoardView } from "@/components/board/BoardView";
import { CardDetailModal } from "@/components/card-modal/CardDetailModal";
import { TopNav } from "@/components/layout/TopNav";
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
        <p className="text-gray-500">Loading…</p>
      </main>
    );
  }

  return (
    <div className="flex h-screen flex-col" style={{ backgroundColor: board?.background || "#f3f4f6" }}>
      <TopNav />
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <Link href={`/workspaces/${board?.workspace_id ?? ""}/boards`} className="text-sm text-gray-700 hover:underline">
            ←
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">{board?.name}</h1>
        </div>
        <div className="flex gap-3 text-sm">
          <Link href={`/boards/${boardId}/settings/labels`} className="text-gray-700 hover:underline">
            Labels
          </Link>
          <Link href={`/boards/${boardId}/settings/custom-fields`} className="text-gray-700 hover:underline">
            Custom fields
          </Link>
          <Link href={`/boards/${boardId}/settings/members`} className="text-gray-700 hover:underline">
            Members
          </Link>
          <Link href={`/boards/${boardId}/settings/automation`} className="text-gray-700 hover:underline">
            Automation
          </Link>
          <Link href={`/boards/${boardId}/settings/templates`} className="text-gray-700 hover:underline">
            Templates
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <BoardView boardId={boardId} />
      </div>

      {cardId && (
        <CardDetailModal
          boardId={boardId}
          cardId={cardId}
          onClose={() => router.push(pathname)}
        />
      )}
    </div>
  );
}
