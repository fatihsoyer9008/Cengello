"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Popover } from "@/components/ui/Popover";
import { useCardLabels, useCardMembers } from "@/hooks/useCardQueries";
import { boardsApi } from "@/lib/api/boards";
import { cardsApi } from "@/lib/api/cards";
import { usersApi } from "@/lib/api/users";
import { DUE_STATE_CLASSES, formatDueDate, getDueState } from "@/lib/due-date";
import type { Card } from "@/types/card";

function invalidateCard(queryClient: ReturnType<typeof useQueryClient>, boardId: string, cardId: string, extra: string) {
  queryClient.invalidateQueries({ queryKey: ["cards", cardId, extra] });
  queryClient.invalidateQueries({ queryKey: ["boards", boardId, "cards"] });
}

export function CardDetailMeta({ boardId, card }: { boardId: string; card: Card }) {
  const queryClient = useQueryClient();

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

  const toggleDueComplete = useMutation({
    mutationFn: () => cardsApi.update(card.id, { due_completed: !card.due_completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", card.id] });
      queryClient.invalidateQueries({ queryKey: ["boards", boardId, "cards"] });
    },
  });

  const dueState = getDueState(card.due_date, card.due_completed);
  const cardLabelIds = new Set(cardLabels?.map((l) => l.id));
  const cardMemberIds = new Set(cardMembers?.map((m) => m.id));

  return (
    <div className="flex flex-wrap gap-4 text-sm">
      <div>
        <p className="mb-1 font-medium text-gray-600 dark:text-gray-400">Members</p>
        <div className="flex flex-wrap items-center gap-1">
          {cardMembers?.map((m) => (
            <span key={m.id} title={m.email} className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
              {m.full_name.slice(0, 2).toUpperCase()}
            </span>
          ))}
          <Popover
            trigger={
              <button className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-gray-400 text-gray-500 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700">
                +
              </button>
            }
          >
            <p className="mb-2 font-medium text-gray-700 dark:text-gray-300">Board members</p>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {boardUsers?.map((u) => (
                <label key={u.id} className="flex items-center gap-2 rounded px-1 py-1 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="checkbox"
                    checked={cardMemberIds.has(u.id)}
                    onChange={() => toggleMember.mutate({ userId: u.id, active: cardMemberIds.has(u.id) })}
                  />
                  <span>{u.full_name}</span>
                </label>
              ))}
            </div>
          </Popover>
        </div>
      </div>

      <div>
        <p className="mb-1 font-medium text-gray-600 dark:text-gray-400">Labels</p>
        <div className="flex flex-wrap items-center gap-1">
          {cardLabels?.map((l) => (
            <span key={l.id} className="rounded px-2 py-1 text-xs text-white" style={{ backgroundColor: l.color }}>
              {l.name || "   "}
            </span>
          ))}
          <Popover
            trigger={
              <button className="flex h-7 w-7 items-center justify-center rounded border border-dashed border-gray-400 text-gray-500 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700">
                +
              </button>
            }
          >
            <p className="mb-2 font-medium text-gray-700 dark:text-gray-300">Board labels</p>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {boardLabels?.map((l) => (
                <label key={l.id} className="flex items-center gap-2 rounded px-1 py-1 hover:bg-gray-50 dark:hover:bg-gray-700">
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
            </div>
          </Popover>
        </div>
      </div>

      <div>
        <p className="mb-1 font-medium text-gray-600 dark:text-gray-400">Due date</p>
        <div className="flex items-center gap-2">
          <input
            type="datetime-local"
            className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            value={card.due_date ? card.due_date.slice(0, 16) : ""}
            onChange={(e) => setDueDate.mutate(e.target.value ? new Date(e.target.value).toISOString() : null)}
          />
          {card.due_date && (
            <button
              onClick={() => toggleDueComplete.mutate()}
              className={`rounded border px-2 py-1 text-xs ${DUE_STATE_CLASSES[dueState]}`}
            >
              {card.due_completed ? "Completed" : dueState === "none" ? "" : formatDueDate(card.due_date)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
