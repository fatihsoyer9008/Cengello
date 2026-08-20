"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlignJustify } from "lucide-react";
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
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
          <AlignJustify className="h-4 w-4" />
          Açıklama
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/20"
          >
            Düzenle
          </button>
        )}
      </div>
      {!editing ? (
        <div
          onClick={() => setEditing(true)}
          className="min-h-[48px] cursor-text rounded-md bg-gray-100 p-3 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10"
        >
          {card.description ? <Markdown>{card.description}</Markdown> : <span className="text-sm text-gray-400 dark:text-gray-500">Açıklama ekle…</span>}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-3 text-xs">
            <button onClick={() => setPreview(false)} className={!preview ? "font-semibold text-brand" : "text-gray-500 dark:text-gray-400"}>
              Yaz
            </button>
            <button onClick={() => setPreview(true)} className={preview ? "font-semibold text-brand" : "text-gray-500 dark:text-gray-400"}>
              Önizleme
            </button>
          </div>
          {preview ? (
            <div className="min-h-[120px] rounded-md border border-gray-200 p-3 dark:border-white/10">
              <Markdown>{value || "*Önizlenecek içerik yok*"}</Markdown>
            </div>
          ) : (
            <textarea
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={6}
              className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-brand focus:outline-none dark:border-white/20 dark:bg-white/10 dark:text-gray-100"
              placeholder="Markdown ile bir açıklama yaz…"
            />
          )}
          <div className="flex gap-2">
            <Button onClick={() => updateDescription.mutate()} disabled={updateDescription.isPending}>
              Kaydet
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setValue(card.description ?? "");
              }}
            >
              İptal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
