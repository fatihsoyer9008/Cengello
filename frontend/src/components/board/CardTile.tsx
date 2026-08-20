"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter, usePathname } from "next/navigation";

import { useBoardLookups } from "@/hooks/useBoardLookups";
import { DUE_STATE_CLASSES, formatDueDate, getDueState } from "@/lib/due-date";
import type { CardSummary } from "@/types/card";

function initials(fullName: string): string {
  return fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function CardTile({ boardId, card }: { boardId: string; card: CardSummary }) {
  const router = useRouter();
  const pathname = usePathname();
  const { labelsById, usersById } = useBoardLookups(boardId);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: "card", listId: card.list_id },
  });

  const dueState = getDueState(card.due_date, card.due_completed);
  const cardLabels = card.label_ids.map((id) => labelsById.get(id)).filter(Boolean);
  const assignees = card.assignee_ids.map((id) => usersById.get(id)).filter(Boolean);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => router.push(`${pathname}?card=${card.id}`)}
      className="cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
    >
      {cardLabels.length > 0 && (
        <div className="flex h-1.5 w-full">
          {cardLabels.map((label) => (
            <span key={label!.id} className="h-full flex-1" style={{ backgroundColor: label!.color }} />
          ))}
        </div>
      )}

      <div className="space-y-2 p-2.5">
        <p className="text-sm leading-snug text-gray-900 dark:text-gray-100">{card.title}</p>

        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          {dueState !== "none" && (
            <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 ${DUE_STATE_CLASSES[dueState]}`}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
              {formatDueDate(card.due_date as string)}
            </span>
          )}

          {card.checklist_total > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 dark:bg-gray-700 dark:text-gray-300">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              {card.checklist_completed}/{card.checklist_total}
            </span>
          )}

          {card.comment_count > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 dark:bg-gray-700 dark:text-gray-300">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {card.comment_count}
            </span>
          )}
        </div>

        {assignees.length > 0 && (
          <div className="flex -space-x-1.5">
            {assignees.map((user) => (
              <span
                key={user!.id}
                title={user!.full_name}
                className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-blue-500 text-[10px] font-semibold text-white dark:border-gray-900"
              >
                {initials(user!.full_name)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
