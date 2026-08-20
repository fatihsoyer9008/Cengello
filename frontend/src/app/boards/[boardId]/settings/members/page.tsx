"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

import { BoardMembersManager } from "@/components/admin/BoardMembersManager";
import { BoardSettingsNav } from "@/components/admin/BoardSettingsNav";
import { AppShell } from "@/components/layout/AppShell";
import { boardsApi } from "@/lib/api/boards";

export default function BoardMembersSettingsPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const { data: board } = useQuery({ queryKey: ["boards", boardId], queryFn: () => boardsApi.get(boardId) });
  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <BoardSettingsNav boardId={boardId} />
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Board members</h2>
        {board && <BoardMembersManager boardId={boardId} ownerId={board.created_by} />}
      </main>
    </AppShell>
  );
}
