"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle } from "lucide-react";
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

  const toggleComplete = useMutation({
    mutationFn: () => cardsApi.update(card.id, { due_completed: !card.due_completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", card.id] });
      queryClient.invalidateQueries({ queryKey: ["boards", boardId, "cards"] });
    },
  });

  return (
    <div className="flex items-start gap-2.5">
      <button
        onClick={() => toggleComplete.mutate()}
        className="mt-1 shrink-0"
        aria-label={card.due_completed ? "Tamamlanmadı olarak işaretle" : "Tamamlandı olarak işaretle"}
      >
        {card.due_completed ? (
          <CheckCircle2 className="h-6 w-6 fill-green-500 text-white dark:text-[#22272b]" />
        ) : (
          <Circle className="h-6 w-6 text-gray-300 hover:text-gray-400 dark:text-gray-600 dark:hover:text-gray-400" />
        )}
      </button>

      {editing ? (
        <form
          className="flex-1"
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
            className="w-full resize-none rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xl font-bold text-gray-900 focus:border-brand focus:outline-none dark:border-white/20 dark:bg-white/10 dark:text-gray-100"
          />
        </form>
      ) : (
        <h1
          onClick={() => setEditing(true)}
          className="-mx-1 flex-1 cursor-text rounded px-1 text-xl font-bold text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-white/5"
        >
          {card.title}
        </h1>
      )}
    </div>
  );
}
