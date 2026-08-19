"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { CreateWorkspaceDialog } from "@/components/workspace/CreateWorkspaceDialog";
import { Button } from "@/components/ui/Button";
import { workspacesApi } from "@/lib/api/workspaces";

export default function WorkspacesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: workspaces, isLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: workspacesApi.list,
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Your workspaces</h1>
        <Button onClick={() => setCreateOpen(true)}>New workspace</Button>
      </div>

      {isLoading && <p className="text-gray-500">Loading…</p>}
      {!isLoading && workspaces?.length === 0 && (
        <p className="text-gray-500">No workspaces yet. Create one to get started.</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {workspaces?.map((ws) => (
          <Link
            key={ws.id}
            href={`/workspaces/${ws.id}/boards`}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow"
          >
            <h2 className="font-medium text-gray-900">{ws.name}</h2>
            {ws.description && <p className="mt-1 text-sm text-gray-500">{ws.description}</p>}
          </Link>
        ))}
      </div>

      <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </main>
  );
}
