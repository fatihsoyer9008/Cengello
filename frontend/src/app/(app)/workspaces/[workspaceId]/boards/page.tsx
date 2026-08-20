"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { CreateBoardDialog } from "@/components/workspace/CreateBoardDialog";
import { Button } from "@/components/ui/Button";
import { workspacesApi } from "@/lib/api/workspaces";

export default function BoardsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: workspace } = useQuery({
    queryKey: ["workspaces", workspaceId],
    queryFn: () => workspacesApi.get(workspaceId),
  });
  const { data: boards, isLoading } = useQuery({
    queryKey: ["workspaces", workspaceId, "boards"],
    queryFn: () => workspacesApi.boards(workspaceId),
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-1 flex items-center justify-between">
        <div>
          <Link href="/workspaces" className="text-sm text-gray-500 hover:underline dark:text-gray-400">
            ← Workspaces
          </Link>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{workspace?.name ?? "Boards"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/workspaces/${workspaceId}/members`}>
            <Button variant="secondary">Members</Button>
          </Link>
          <Button onClick={() => setCreateOpen(true)}>New board</Button>
        </div>
      </div>

      {isLoading && <p className="mt-6 text-gray-500 dark:text-gray-400">Loading…</p>}
      {!isLoading && boards?.length === 0 && <p className="mt-6 text-gray-500 dark:text-gray-400">No boards yet.</p>}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {boards?.map((board) => (
          <Link
            key={board.id}
            href={`/boards/${board.id}`}
            className="flex h-24 items-end rounded-lg p-4 text-white shadow-sm transition hover:shadow-md"
            style={{ backgroundColor: board.background || "#4b5563" }}
          >
            <span className="font-medium drop-shadow">{board.name}</span>
          </Link>
        ))}
      </div>

      <CreateBoardDialog open={createOpen} onOpenChange={setCreateOpen} workspaceId={workspaceId} />
    </main>
  );
}
