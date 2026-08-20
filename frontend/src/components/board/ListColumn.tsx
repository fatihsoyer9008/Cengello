"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AddCardForm } from "@/components/board/AddCardForm";
import { CardTile } from "@/components/board/CardTile";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { Input } from "@/components/ui/Input";
import { listsApi } from "@/lib/api/lists";
import type { CardSummary } from "@/types/card";
import type { BoardList } from "@/types/list";

export function ListColumn({ boardId, list, cards }: { boardId: string; list: BoardList; cards: CardSummary[] }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(list.name);
  const queryClient = useQueryClient();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id,
    data: { type: "list" },
  });
  const { setNodeRef: setDroppableRef } = useDroppable({ id: `list-drop-${list.id}`, data: { type: "list-drop", listId: list.id } });

  const invalidateLists = () => queryClient.invalidateQueries({ queryKey: ["boards", boardId, "lists"] });

  const renameList = useMutation({
    mutationFn: () => listsApi.update(list.id, { name }),
    onSuccess: () => {
      invalidateLists();
      setEditing(false);
    },
  });

  const archiveList = useMutation({
    mutationFn: () => listsApi.update(list.id, { is_archived: true }),
    onSuccess: invalidateLists,
  });

  const deleteList = useMutation({
    mutationFn: () => listsApi.remove(list.id),
    onSuccess: invalidateLists,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const cardIds = cards.map((c) => c.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex h-fit w-72 shrink-0 flex-col rounded-xl bg-[#F4F5F7] shadow-sm"
    >
      <div {...attributes} {...listeners} className="flex cursor-grab items-center justify-between px-3 pt-3">
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) renameList.mutate();
            }}
            className="flex-1"
          >
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => name.trim() && renameList.mutate()}
              className="text-sm font-semibold"
            />
          </form>
        ) : (
          <h3 onClick={() => setEditing(true)} className="flex-1 px-1 text-sm font-bold text-gray-800">
            {list.name}
          </h3>
        )}
        <DropdownMenu
          trigger={
            <button className="rounded px-1.5 py-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700" aria-label="List menu">
              •••
            </button>
          }
          items={[
            { label: "Rename list", onSelect: () => setEditing(true) },
            { label: "Archive list", onSelect: () => archiveList.mutate() },
            { label: "Delete list", onSelect: () => deleteList.mutate(), destructive: true },
          ]}
        />
      </div>

      <div ref={setDroppableRef} className="flex-1 space-y-2 px-2.5 pb-2 pt-2">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <CardTile key={card.id} boardId={boardId} card={card} />
          ))}
        </SortableContext>
      </div>

      <div className="px-2.5 pb-2.5">
        <AddCardForm boardId={boardId} listId={list.id} />
      </div>
    </div>
  );
}
