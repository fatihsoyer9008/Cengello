"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { listsApi } from "@/lib/api/lists";

export function AddListForm({ boardId }: { boardId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const queryClient = useQueryClient();

  const createList = useMutation({
    mutationFn: () => listsApi.create({ name, board_id: boardId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", boardId, "lists"] });
      setName("");
      setOpen(false);
    },
  });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="h-fit w-72 shrink-0 rounded-lg bg-white/60 px-3 py-2.5 text-left text-sm text-gray-600 hover:bg-white"
      >
        + Add another list
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) createList.mutate();
      }}
      className="h-fit w-72 shrink-0 space-y-1.5 rounded-lg bg-gray-100 p-2.5"
    >
      <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="List name" />
      <div className="flex gap-2">
        <Button type="submit" disabled={createList.isPending || !name.trim()}>
          Add list
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
