"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AddCardForm } from "@/components/board/AddCardForm";
import { CardTile } from "@/components/board/CardTile";
import { Input } from "@/components/ui/Input";
import { listsApi } from "@/lib/api/lists";
import type { Card } from "@/types/card";
import type { BoardList } from "@/types/list";

export function ListColumn({ boardId, list, cards }: { boardId: string; list: BoardList; cards: Card[] }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(list.name);
  const queryClient = useQueryClient();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id,
    data: { type: "list" },
  });
  const { setNodeRef: setDroppableRef } = useDroppable({ id: `list-drop-${list.id}`, data: { type: "list-drop", listId: list.id } });

  const renameList = useMutation({
    mutationFn: () => listsApi.update(list.id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", boardId, "lists"] });
      setEditing(false);
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const cardIds = cards.map((c) => c.id);

  return (
    <div ref={setNodeRef} style={style} className="flex h-fit w-72 shrink-0 flex-col rounded-lg bg-gray-100">
      <div {...attributes} {...listeners} className="cursor-grab px-2.5 pt-2.5">
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) renameList.mutate();
            }}
          >
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => name.trim() && renameList.mutate()}
              className="text-sm font-medium"
            />
          </form>
        ) : (
          <h3 onClick={() => setEditing(true)} className="mb-1 px-1 text-sm font-semibold text-gray-800">
            {list.name}
          </h3>
        )}
      </div>

      <div ref={setDroppableRef} className="flex-1 space-y-2 px-2.5 pb-2 pt-1">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <CardTile key={card.id} card={card} />
          ))}
        </SortableContext>
      </div>

      <div className="px-2.5 pb-2.5">
        <AddCardForm boardId={boardId} listId={list.id} />
      </div>
    </div>
  );
}
