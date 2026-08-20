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
        className="h-fit w-72 shrink-0 rounded-xl bg-white/50 px-3 py-2.5 text-left text-sm font-medium text-gray-600 hover:bg-white dark:bg-white/10 dark:text-gray-100 dark:hover:bg-white/20"
      >
        + Yeni liste ekle
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) createList.mutate();
      }}
      className="h-fit w-72 shrink-0 space-y-1.5 rounded-xl bg-[#F4F5F7] p-2.5 shadow-sm dark:bg-black/25"
    >
      <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Liste adı" />
      <div className="flex gap-2">
        <Button type="submit" disabled={createList.isPending || !name.trim()}>
          Listeyi ekle
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          İptal
        </Button>
      </div>
    </form>
  );
}
