"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Paperclip } from "lucide-react";

import { useCardAttachments } from "@/hooks/useCardQueries";
import { attachmentsApi } from "@/lib/api/attachments";
import { cardsApi } from "@/lib/api/cards";
import type { Card } from "@/types/card";

export function CardAttachments({ boardId, card }: { boardId: string; card: Card }) {
  const { data: attachments } = useCardAttachments(card.id);
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["cards", card.id, "attachments"] });
    queryClient.invalidateQueries({ queryKey: ["cards", card.id] });
    queryClient.invalidateQueries({ queryKey: ["boards", boardId, "cards"] });
  };

  const remove = useMutation({
    mutationFn: (id: string) => attachmentsApi.remove(id),
    onSuccess: invalidate,
  });

  const setCover = useMutation({
    mutationFn: (attachmentId: string | null) => cardsApi.setCover(card.id, { attachment_id: attachmentId }),
    onSuccess: invalidate,
  });

  async function handleDownload(id: string, filename: string) {
    const res = await attachmentsApi.fetchDownload(id);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!attachments || attachments.length === 0) return null;

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
        <Paperclip className="h-4 w-4" />
        Eklentiler
      </div>
      <ul className="divide-y divide-gray-200 rounded-md border border-gray-200 dark:divide-white/10 dark:border-white/10">
        {attachments.map((att) => (
          <li key={att.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
            <button
              onClick={() => handleDownload(att.id, att.filename)}
              className="truncate text-left text-brand hover:underline dark:text-blue-400"
            >
              {att.filename}
            </button>
            <div className="flex shrink-0 items-center gap-2 text-xs">
              {card.cover_attachment_id === att.id ? (
                <button onClick={() => setCover.mutate(null)} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                  Kapağı kaldır
                </button>
              ) : (
                <button onClick={() => setCover.mutate(att.id)} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                  Kapak yap
                </button>
              )}
              <button
                onClick={(e) => {
                  e.currentTarget.blur();
                  remove.mutate(att.id);
                }}
                className="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
              >
                Sil
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
