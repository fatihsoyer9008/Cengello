"use client";

import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { boardsApi } from "@/lib/api/boards";
import { ApiError } from "@/lib/api/client";

export function CreateBoardDialog({
  open,
  onOpenChange,
  workspaceId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  const createBoard = useMutation({
    mutationFn: () => boardsApi.create({ name, workspace_id: workspaceId }),
    onSuccess: (board) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "boards"] });
      setName("");
      onOpenChange(false);
      router.push(`/boards/${board.id}`);
    },
    onError: (err) => setError(err instanceof ApiError ? String(err.detail) : "Failed to create board"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Create board">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          createBoard.mutate();
        }}
        className="space-y-4"
      >
        {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Name</label>
          <Input required value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <Button type="submit" className="w-full" disabled={createBoard.isPending}>
          {createBoard.isPending ? "Creating…" : "Create"}
        </Button>
      </form>
    </Dialog>
  );
}
