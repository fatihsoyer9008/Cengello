"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Eye, EyeOff, Image as ImageIcon, MoreHorizontal, X } from "lucide-react";
import { useState } from "react";

import { Popover } from "@/components/ui/Popover";
import { useCardAttachments } from "@/hooks/useCardQueries";
import { attachmentsApi } from "@/lib/api/attachments";
import { boardsApi } from "@/lib/api/boards";
import { cardsApi } from "@/lib/api/cards";
import { getListColor } from "@/lib/board-theme";
import type { Card, CardSummary } from "@/types/card";

function estimateAppendPosition(cards: CardSummary[] | undefined, listId: string): { beforeId: string | null; afterId: string | null } {
  const siblings = (cards ?? []).filter((c) => c.list_id === listId).sort((a, b) => a.position - b.position);
  const last = siblings[siblings.length - 1];
  return { beforeId: last ? last.id : null, afterId: null };
}

export function CardModalTopBar({ boardId, card, onClose }: { boardId: string; card: Card; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [watching, setWatching] = useState(false);
  const fileInputId = `cover-upload-${card.id}`;

  const { data: lists } = useQuery({ queryKey: ["boards", boardId, "lists"], queryFn: () => boardsApi.lists(boardId) });
  const { data: boardCards } = useQuery({
    queryKey: ["boards", boardId, "cards"],
    queryFn: () => boardsApi.cardsSummary(boardId, { is_archived: false }),
  });
  const { data: attachments } = useCardAttachments(card.id);

  const currentList = lists?.find((l) => l.id === card.list_id);

  const invalidateCard = () => {
    queryClient.invalidateQueries({ queryKey: ["cards", card.id] });
    queryClient.invalidateQueries({ queryKey: ["boards", boardId, "cards"] });
  };

  const moveToList = useMutation({
    mutationFn: (listId: string) => {
      const { beforeId, afterId } = estimateAppendPosition(boardCards, listId);
      return cardsApi.move(card.id, { list_id: listId, before_id: beforeId, after_id: afterId });
    },
    onSuccess: invalidateCard,
  });

  const uploadCover = useMutation({
    mutationFn: async (file: File) => {
      const attachment = await attachmentsApi.upload(card.id, file);
      return cardsApi.setCover(card.id, { attachment_id: attachment.id });
    },
    onSuccess: () => {
      invalidateCard();
      queryClient.invalidateQueries({ queryKey: ["cards", card.id, "attachments"] });
    },
  });

  const setCover = useMutation({
    mutationFn: (attachmentId: string | null) => cardsApi.setCover(card.id, { attachment_id: attachmentId }),
    onSuccess: invalidateCard,
  });

  const archiveCard = useMutation({
    mutationFn: () => cardsApi.update(card.id, { is_archived: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", boardId, "cards"] });
      onClose();
    },
  });

  const deleteCard = useMutation({
    mutationFn: () => cardsApi.remove(card.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", boardId, "cards"] });
      onClose();
    },
  });

  const iconButtonClass = "rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-100";

  return (
    <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-white/10 dark:bg-black/20">
      <Popover
        trigger={
          <button
            className="flex min-w-0 max-w-[70%] items-center gap-1.5 truncate rounded-md px-3 py-1.5 text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: currentList ? getListColor(currentList) : "#626F86" }}
          >
            <span className="truncate">{currentList?.name ?? "Liste"}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          </button>
        }
      >
        <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Listeye taşı</p>
        <div className="max-h-56 space-y-0.5 overflow-y-auto">
          {lists?.map((l) => (
            <button
              key={l.id}
              onClick={() => moveToList.mutate(l.id)}
              className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-white/10 ${
                l.id === card.list_id ? "font-semibold text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-300"
              }`}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: getListColor(l) }} />
              <span className="truncate">{l.name}</span>
            </button>
          ))}
        </div>
      </Popover>

      <div className="flex-1" />

      <Popover
        trigger={
          <button className={iconButtonClass} aria-label="Kapak">
            <ImageIcon className="h-[18px] w-[18px]" />
          </button>
        }
      >
        <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Kapak</p>
        {attachments && attachments.length > 0 && (
          <div className="mb-2 max-h-40 space-y-1 overflow-y-auto">
            {attachments.map((att) => (
              <button
                key={att.id}
                onClick={() => setCover.mutate(card.cover_attachment_id === att.id ? null : att.id)}
                className={`flex w-full items-center justify-between truncate rounded px-2 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-white/10 ${
                  card.cover_attachment_id === att.id ? "font-semibold text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-300"
                }`}
              >
                <span className="truncate">{att.filename}</span>
              </button>
            ))}
          </div>
        )}
        <label htmlFor={fileInputId} className="block w-full cursor-pointer rounded-md bg-gray-100 px-3 py-1.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/20">
          {uploadCover.isPending ? "Yükleniyor…" : "Dosya yükle ve kapak yap"}
        </label>
        <input
          id={fileInputId}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadCover.mutate(file);
            e.target.value = "";
          }}
        />
      </Popover>

      <button
        className={iconButtonClass}
        aria-label="İzle"
        title={watching ? "İzlemeyi bırak" : "Bu kartı izle"}
        onClick={() => setWatching((w) => !w)}
      >
        {watching ? <Eye className="h-[18px] w-[18px] text-brand" /> : <EyeOff className="h-[18px] w-[18px]" />}
      </button>

      <Popover
        trigger={
          <button className={iconButtonClass} aria-label="Diğer">
            <MoreHorizontal className="h-[18px] w-[18px]" />
          </button>
        }
      >
        <div className="space-y-0.5">
          <button
            onClick={() => archiveCard.mutate()}
            className="w-full rounded px-2.5 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
          >
            Kartı arşivle
          </button>
          <button
            onClick={() => deleteCard.mutate()}
            className="w-full rounded px-2.5 py-1.5 text-left text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-white/10"
          >
            Kartı sil
          </button>
        </div>
      </Popover>

      <RadixDialog.Close asChild>
        <button className={iconButtonClass} aria-label="Kapat">
          <X className="h-[18px] w-[18px]" />
        </button>
      </RadixDialog.Close>
    </div>
  );
}
