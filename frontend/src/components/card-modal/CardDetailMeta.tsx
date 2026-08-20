"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Popover } from "@/components/ui/Popover";
import { useCardLabels, useCardMembers } from "@/hooks/useCardQueries";
import { boardsApi } from "@/lib/api/boards";
import { cardsApi } from "@/lib/api/cards";
import { usersApi } from "@/lib/api/users";
import { getUserColor } from "@/lib/board-theme";
import { DUE_STATE_CLASSES, formatDueDate, getDueState } from "@/lib/due-date";
import type { Card } from "@/types/card";

function invalidateCard(queryClient: ReturnType<typeof useQueryClient>, boardId: string, cardId: string, extra: string) {
  queryClient.invalidateQueries({ queryKey: ["cards", cardId, extra] });
  queryClient.invalidateQueries({ queryKey: ["boards", boardId, "cards"] });
}

function initials(fullName: string): string {
  return fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function CardDetailMeta({ boardId, card }: { boardId: string; card: Card }) {
  const queryClient = useQueryClient();

  const { data: boardMembers } = useQuery({ queryKey: ["boards", boardId, "members"], queryFn: () => boardsApi.members(boardId) });
  const { data: cardLabels } = useCardLabels(card.id);
  const { data: cardMembers } = useCardMembers(card.id);

  const boardMemberIds = boardMembers?.map((m) => m.user_id) ?? [];
  const { data: boardUsers } = useQuery({
    queryKey: ["boards", boardId, "member-users", boardMemberIds],
    queryFn: async () => Promise.all(boardMemberIds.map((id) => usersApi.get(id))),
    enabled: boardMemberIds.length > 0,
  });

  const toggleMember = useMutation({
    mutationFn: ({ userId, active }: { userId: string; active: boolean }) =>
      active ? cardsApi.unassignMember(card.id, userId) : cardsApi.assignMember(card.id, userId),
    onSuccess: () => invalidateCard(queryClient, boardId, card.id, "members"),
  });

  const toggleDueComplete = useMutation({
    mutationFn: () => cardsApi.update(card.id, { due_completed: !card.due_completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", card.id] });
      queryClient.invalidateQueries({ queryKey: ["boards", boardId, "cards"] });
    },
  });

  const dueState = getDueState(card.due_date, card.due_completed);
  const cardMemberIds = new Set(cardMembers?.map((m) => m.id));

  return (
    <div className="flex flex-wrap gap-6 text-sm">
      <div>
        <p className="mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Üyeler</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {cardMembers?.map((m) => (
            <span
              key={m.id}
              title={m.email}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${getUserColor(m.id)}`}
            >
              {initials(m.full_name)}
            </span>
          ))}
          <Popover
            trigger={
              <button className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-gray-400 text-gray-500 hover:bg-gray-100 dark:border-white/30 dark:text-gray-400 dark:hover:bg-white/10">
                +
              </button>
            }
          >
            <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Pano üyeleri</p>
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
        </div>
      </div>

      {cardLabels && cardLabels.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Etiketler</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {cardLabels.map((l) => (
              <span key={l.id} className="rounded px-2.5 py-1 text-xs font-medium text-white" style={{ backgroundColor: l.color }}>
                {l.name || "   "}
              </span>
            ))}
          </div>
        </div>
      )}

      {card.due_date && (
        <div>
          <p className="mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Bitiş tarihi</p>
          <button
            onClick={() => toggleDueComplete.mutate()}
            className={`rounded border px-2.5 py-1.5 text-xs font-medium ${DUE_STATE_CLASSES[dueState]}`}
          >
            {card.due_completed ? "Tamamlandı" : formatDueDate(card.due_date)}
          </button>
        </div>
      )}
    </div>
  );
}
