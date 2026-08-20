"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as RadixPopover from "@radix-ui/react-popover";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useState } from "react";

import { AddCardForm } from "@/components/board/AddCardForm";
import { CardTile } from "@/components/board/CardTile";
import { Popover } from "@/components/ui/Popover";
import { Input } from "@/components/ui/Input";
import { LIST_COLOR_PALETTE, getListColor } from "@/lib/board-theme";
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

  const setColor = useMutation({
    mutationFn: (color: string) => listsApi.update(list.id, { color }),
    onSuccess: invalidateLists,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const cardIds = cards.map((c) => c.id);
  const listColor = getListColor(list);
  const menuItemClass =
    "w-full rounded px-2.5 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10";

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, backgroundColor: listColor }}
      className="flex h-fit w-72 shrink-0 flex-col overflow-hidden rounded-xl shadow-sm"
    >
      <div {...attributes} {...listeners} className="flex cursor-grab items-center gap-2 px-3 py-2.5">
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
          <h3 onClick={() => setEditing(true)} className="flex-1 truncate text-sm font-bold text-white drop-shadow-sm">
            {list.name}
          </h3>
        )}
        <span className="shrink-0 rounded-full bg-black/25 px-2 py-0.5 text-xs font-bold text-white">{cards.length}</span>
        <Popover
          trigger={
            <button
              className="shrink-0 rounded px-1.5 py-1 text-white/80 hover:bg-black/20 hover:text-white"
              aria-label="List menu">
              •••
            </button>
          }
        >
          <div className="space-y-0.5">
            <RadixPopover.Close asChild>
              <button className={menuItemClass} onClick={() => setEditing(true)}>
                Listeyi yeniden adlandır
              </button>
            </RadixPopover.Close>
            <RadixPopover.Close asChild>
              <button className={menuItemClass} onClick={() => archiveList.mutate()}>
                Listeyi arşivle
              </button>
            </RadixPopover.Close>
            <RadixPopover.Close asChild>
              <button
                className={`${menuItemClass} text-red-600 dark:text-red-400`}
                onClick={() => deleteList.mutate()}
              >
                Listeyi sil
              </button>
            </RadixPopover.Close>
          </div>

          <div className="mt-3 border-t border-gray-200 pt-3 dark:border-white/10">
            <p className="mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Liste rengini değiştir</p>
            <div className="grid grid-cols-5 gap-1.5">
              {LIST_COLOR_PALETTE.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor.mutate(c.value)}
                  className="flex h-8 w-8 items-center justify-center rounded-md transition hover:opacity-80"
                  style={{ backgroundColor: c.value }}
                  aria-label={c.name}
                  title={c.name}
                >
                  {listColor === c.value && <Check className="h-4 w-4 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </Popover>
      </div>

      <div ref={setDroppableRef} className="flex-1 space-y-2 px-2.5 pb-2 pt-1">
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
