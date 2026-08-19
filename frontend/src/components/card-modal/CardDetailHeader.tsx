"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { cardsApi } from "@/lib/api/cards";
import type { Card } from "@/types/card";

export function CardDetailHeader({ boardId, card }: { boardId: string; card: Card }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(card.title);
  const queryClient = useQueryClient();

  const updateTitle = useMutation({
    mutationFn: () => cardsApi.update(card.id, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", card.id] });
      queryClient.invalidateQueries({ queryKey: ["boards", boardId, "cards"] });
      setEditing(false);
    },
  });

  return (
    <div>
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim()) updateTitle.mutate();
          }}
        >
          <textarea
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title.trim() && title !== card.title && updateTitle.mutate()}
            rows={2}
            className="w-full resize-none rounded-md border border-gray-300 px-2 py-1.5 text-lg font-semibold focus:border-blue-500 focus:outline-none"
          />
        </form>
      ) : (
        <h2
          onClick={() => setEditing(true)}
          className="cursor-text rounded px-1 -mx-1 text-lg font-semibold text-gray-900 hover:bg-gray-50"
        >
          {card.title}
        </h2>
      )}
    </div>
  );
}
