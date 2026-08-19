"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter, usePathname } from "next/navigation";

import { DUE_STATE_CLASSES, formatDueDate, getDueState } from "@/lib/due-date";
import type { Card } from "@/types/card";

export function CardTile({ card }: { card: Card }) {
  const router = useRouter();
  const pathname = usePathname();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: "card", listId: card.list_id },
  });

  const dueState = getDueState(card.due_date, card.due_completed);

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
      className="cursor-pointer rounded-md border border-gray-200 bg-white p-2.5 text-sm shadow-sm hover:border-blue-300 hover:shadow"
    >
      <p className="text-gray-900">{card.title}</p>
      {dueState !== "none" && (
        <span className={`mt-1.5 inline-block rounded border px-1.5 py-0.5 text-xs ${DUE_STATE_CLASSES[dueState]}`}>
          {formatDueDate(card.due_date as string)}
        </span>
      )}
    </div>
  );
}
