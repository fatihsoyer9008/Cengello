"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { cardsApi } from "@/lib/api/cards";
import { Markdown } from "@/lib/markdown";
import type { Card } from "@/types/card";

export function CardDescription({ card }: { card: Card }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(card.description ?? "");
  const [preview, setPreview] = useState(false);
  const queryClient = useQueryClient();

  const updateDescription = useMutation({
    mutationFn: () => cardsApi.update(card.id, { description: value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", card.id] });
      setEditing(false);
    },
  });

  return (
    <div>
      <p className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">Description</p>
      {!editing ? (
        <div onClick={() => setEditing(true)} className="cursor-text rounded-md bg-gray-50 p-3 hover:bg-gray-100 dark:bg-gray-900/60 dark:hover:bg-gray-700">
          {card.description ? <Markdown>{card.description}</Markdown> : <span className="text-sm text-gray-400 dark:text-gray-500">Add a description…</span>}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2 text-xs">
            <button onClick={() => setPreview(false)} className={!preview ? "font-semibold text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}>
              Write
            </button>
            <button onClick={() => setPreview(true)} className={preview ? "font-semibold text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}>
              Preview
            </button>
          </div>
          {preview ? (
            <div className="min-h-[120px] rounded-md border border-gray-200 p-3 dark:border-gray-700">
              <Markdown>{value || "*Nothing to preview*"}</Markdown>
            </div>
          ) : (
            <textarea
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={6}
              className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              placeholder="Write a description in Markdown…"
            />
          )}
          <div className="flex gap-2">
            <Button onClick={() => updateDescription.mutate()} disabled={updateDescription.isPending}>
              Save
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setValue(card.description ?? "");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
