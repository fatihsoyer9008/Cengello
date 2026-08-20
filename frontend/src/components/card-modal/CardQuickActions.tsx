"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Paperclip, Plus, SquareCheckBig, Tag } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Popover } from "@/components/ui/Popover";
import { useCardLabels, useCardMembers } from "@/hooks/useCardQueries";
import { attachmentsApi } from "@/lib/api/attachments";
import { boardsApi } from "@/lib/api/boards";
import { cardsApi } from "@/lib/api/cards";
import { checklistsApi } from "@/lib/api/checklists";
import { usersApi } from "@/lib/api/users";
import type { Card } from "@/types/card";

function invalidateCard(queryClient: ReturnType<typeof useQueryClient>, boardId: string, cardId: string, extra: string) {
  queryClient.invalidateQueries({ queryKey: ["cards", cardId, extra] });
  queryClient.invalidateQueries({ queryKey: ["boards", boardId, "cards"] });
}

const pillClass =
  "inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-white/20 dark:text-gray-200 dark:hover:bg-white/10";

export function CardQuickActions({ boardId, card }: { boardId: string; card: Card }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: boardLabels } = useQuery({ queryKey: ["boards", boardId, "labels"], queryFn: () => boardsApi.labels(boardId) });
  const { data: boardMembers } = useQuery({ queryKey: ["boards", boardId, "members"], queryFn: () => boardsApi.members(boardId) });
  const { data: cardLabels } = useCardLabels(card.id);
  const { data: cardMembers } = useCardMembers(card.id);

  const boardMemberIds = boardMembers?.map((m) => m.user_id) ?? [];
  const { data: boardUsers } = useQuery({
    queryKey: ["boards", boardId, "member-users", boardMemberIds],
    queryFn: async () => Promise.all(boardMemberIds.map((id) => usersApi.get(id))),
    enabled: boardMemberIds.length > 0,
  });

  const toggleLabel = useMutation({
    mutationFn: ({ labelId, active }: { labelId: string; active: boolean }) =>
      active ? cardsApi.removeLabel(card.id, labelId) : cardsApi.addLabel(card.id, labelId),
    onSuccess: () => invalidateCard(queryClient, boardId, card.id, "labels"),
  });

  const toggleMember = useMutation({
    mutationFn: ({ userId, active }: { userId: string; active: boolean }) =>
      active ? cardsApi.unassignMember(card.id, userId) : cardsApi.assignMember(card.id, userId),
    onSuccess: () => invalidateCard(queryClient, boardId, card.id, "members"),
  });

  const setDueDate = useMutation({
    mutationFn: (dueDate: string | null) => cardsApi.update(card.id, { due_date: dueDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", card.id] });
      queryClient.invalidateQueries({ queryKey: ["boards", boardId, "cards"] });
    },
  });

  const [checklistTitle, setChecklistTitle] = useState("");
  const createChecklist = useMutation({
    mutationFn: () => checklistsApi.create({ title: checklistTitle || undefined, card_id: card.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", card.id, "checklists"] });
      setChecklistTitle("");
    },
  });

  const uploadAttachment = useMutation({
    mutationFn: (file: File) => attachmentsApi.upload(card.id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", card.id, "attachments"] });
      queryClient.invalidateQueries({ queryKey: ["boards", boardId, "cards"] });
    },
  });

  const cardLabelIds = new Set(cardLabels?.map((l) => l.id));
  const cardMemberIds = new Set(cardMembers?.map((m) => m.id));

  return (
    <div className="flex flex-wrap gap-2">
      <Popover trigger={<button className={pillClass}><Plus className="h-3.5 w-3.5" />Ekle</button>}>
        <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Üye ekle</p>
        <div className="max-h-52 space-y-1 overflow-y-auto">
          {boardUsers?.map((u) => (
            <label key={u.id} className="flex items-center gap-2 rounded px-1 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-white/10">
              <input
                type="checkbox"
                checked={cardMemberIds.has(u.id)}
                onChange={() => toggleMember.mutate({ userId: u.id, active: cardMemberIds.has(u.id) })}
              />
              <span className="text-gray-700 dark:text-gray-200">{u.full_name}</span>
            </label>
          ))}
        </div>
      </Popover>

      <Popover trigger={<button className={pillClass}><Tag className="h-3.5 w-3.5" />Etiketler</button>}>
        <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Etiketler</p>
        <div className="max-h-52 space-y-1 overflow-y-auto">
          {boardLabels?.map((l) => (
            <label key={l.id} className="flex items-center gap-2 rounded px-1 py-1.5 hover:bg-gray-50 dark:hover:bg-white/10">
              <input
                type="checkbox"
                checked={cardLabelIds.has(l.id)}
                onChange={() => toggleLabel.mutate({ labelId: l.id, active: cardLabelIds.has(l.id) })}
              />
              <span className="rounded px-2 py-0.5 text-xs text-white" style={{ backgroundColor: l.color }}>
                {l.name || l.color}
              </span>
            </label>
          ))}
          {boardLabels?.length === 0 && <p className="text-xs text-gray-400 dark:text-gray-500">Bu panoda etiket yok.</p>}
        </div>
      </Popover>

      <Popover trigger={<button className={pillClass}><Clock className="h-3.5 w-3.5" />Tarihler</button>}>
        <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Bitiş tarihi</p>
        <input
          type="datetime-local"
          className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-white/20 dark:bg-white/10 dark:text-gray-100"
          value={card.due_date ? card.due_date.slice(0, 16) : ""}
          onChange={(e) => setDueDate.mutate(e.target.value ? new Date(e.target.value).toISOString() : null)}
        />
        {card.due_date && (
          <button
            onClick={() => setDueDate.mutate(null)}
            className="mt-2 text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
          >
            Tarihi kaldır
          </button>
        )}
      </Popover>

      <Popover trigger={<button className={pillClass}><SquareCheckBig className="h-3.5 w-3.5" />Kontrol listesi</button>}>
        <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Kontrol listesi ekle</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createChecklist.mutate();
          }}
          className="space-y-2"
        >
          <input
            autoFocus
            value={checklistTitle}
            onChange={(e) => setChecklistTitle(e.target.value)}
            placeholder="Kontrol listesi"
            className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-white/20 dark:bg-white/10 dark:text-gray-100"
          />
          <Button type="submit" disabled={createChecklist.isPending} className="w-full">
            Ekle
          </Button>
        </form>
      </Popover>

      <button className={pillClass} onClick={() => fileInputRef.current?.click()} disabled={uploadAttachment.isPending}>
        <Paperclip className="h-3.5 w-3.5" />
        {uploadAttachment.isPending ? "Yükleniyor…" : "Eklenti"}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadAttachment.mutate(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
