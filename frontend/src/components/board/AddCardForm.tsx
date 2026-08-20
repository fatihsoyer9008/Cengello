"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { cardsApi } from "@/lib/api/cards";

export function AddCardForm({ boardId, listId }: { boardId: string; listId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const queryClient = useQueryClient();

  const createCard = useMutation({
    mutationFn: () => cardsApi.create({ title, list_id: listId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", boardId, "cards"] });
      setTitle("");
      setOpen(false);
    },
  });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-md px-2 py-1.5 text-left text-sm text-white/80 hover:bg-black/10 hover:text-white"
      >
        + Kart ekle
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (title.trim()) createCard.mutate();
      }}
      className="space-y-1.5"
    >
      <textarea
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Kart başlığı"
        rows={2}
        className="w-full resize-none rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-white/10 dark:bg-white/10 dark:text-gray-100"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (title.trim()) createCard.mutate();
          }
          if (e.key === "Escape") setOpen(false);
        }}
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={createCard.isPending || !title.trim()}>
          Ekle
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          İptal
        </Button>
      </div>
    </form>
  );
}
