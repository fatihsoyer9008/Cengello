"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import { Button } from "@/components/ui/Button";
import { useCardAttachments } from "@/hooks/useCardQueries";
import { attachmentsApi } from "@/lib/api/attachments";
import { cardsApi } from "@/lib/api/cards";
import type { Card } from "@/types/card";

export function CardAttachments({ boardId, card }: { boardId: string; card: Card }) {
  const { data: attachments } = useCardAttachments(card.id);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["cards", card.id, "attachments"] });
    queryClient.invalidateQueries({ queryKey: ["cards", card.id] });
    queryClient.invalidateQueries({ queryKey: ["boards", boardId, "cards"] });
  };

  const upload = useMutation({
    mutationFn: (file: File) => attachmentsApi.upload(card.id, file),
    onSuccess: invalidate,
  });

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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Attachments</p>
        <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={upload.isPending}>
          {upload.isPending ? "Uploading…" : "Upload"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload.mutate(file);
            e.target.value = "";
          }}
        />
      </div>
      <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
        {attachments?.map((att) => (
          <li key={att.id} className="flex items-center justify-between px-3 py-2 text-sm">
            <button onClick={() => handleDownload(att.id, att.filename)} className="truncate text-left text-blue-600 hover:underline dark:text-blue-400">
              {att.filename}
            </button>
            <div className="flex shrink-0 items-center gap-2 text-xs">
              {card.cover_attachment_id === att.id ? (
                <button onClick={() => setCover.mutate(null)} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                  Remove cover
                </button>
              ) : (
                <button onClick={() => setCover.mutate(att.id)} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                  Set as cover
                </button>
              )}
              <button onClick={() => remove.mutate(att.id)} className="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400">
                Delete
              </button>
            </div>
          </li>
        ))}
        {attachments?.length === 0 && <li className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">No attachments yet.</li>}
      </ul>
    </div>
  );
}
