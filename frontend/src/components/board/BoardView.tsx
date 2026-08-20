"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { useState } from "react";

import { AddListForm } from "@/components/board/AddListForm";
import { ListColumn } from "@/components/board/ListColumn";
import { useBoardData } from "@/hooks/useBoardData";
import { useMoveCard } from "@/hooks/useMoveCard";
import { useMoveList } from "@/hooks/useMoveList";
import type { CardSummary } from "@/types/card";

interface DragMeta {
  type: "card" | "list";
  listId?: string;
}

export function BoardView({ boardId }: { boardId: string }) {
  const { lists, cardsByList, isLoading, isError } = useBoardData(boardId);
  const moveCard = useMoveCard(boardId);
  const moveList = useMoveList(boardId);
  const [activeCard, setActiveCard] = useState<CardSummary | null>(null);
  const [activeListName, setActiveListName] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragStart(event: DragStartEvent) {
    const meta = event.active.data.current as DragMeta | undefined;
    if (meta?.type === "card") {
      const card = Object.values(cardsByList)
        .flat()
        .find((c) => c.id === event.active.id);
      setActiveCard(card ?? null);
    } else if (meta?.type === "list") {
      const list = lists.find((l) => l.id === event.active.id);
      setActiveListName(list?.name ?? null);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    setActiveListName(null);
    const { active, over } = event;
    if (!over) return;

    const activeMeta = active.data.current as DragMeta | undefined;

    if (activeMeta?.type === "list") {
      if (active.id === over.id) return;
      const oldIndex = lists.findIndex((l) => l.id === active.id);
      const newIndex = lists.findIndex((l) => l.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(lists, oldIndex, newIndex);
      const activeIndex = reordered.findIndex((l) => l.id === active.id);
      const beforeId = activeIndex > 0 ? reordered[activeIndex - 1].id : null;
      const afterId = activeIndex < reordered.length - 1 ? reordered[activeIndex + 1].id : null;
      moveList.mutate({ listId: active.id as string, beforeId, afterId });
      return;
    }

    if (activeMeta?.type === "card") {
      const overMeta = over.data.current as DragMeta | undefined;
      const sourceListId = activeMeta.listId as string;
      const targetListId = overMeta?.listId ?? sourceListId;

      const targetCards = (cardsByList[targetListId] ?? []).filter((c) => c.id !== active.id);
      let insertIndex = targetCards.length;
      if (overMeta?.type === "card") {
        const overIndex = targetCards.findIndex((c) => c.id === over.id);
        if (overIndex !== -1) insertIndex = overIndex;
      }

      const beforeId = insertIndex > 0 ? targetCards[insertIndex - 1].id : null;
      const afterId = insertIndex < targetCards.length ? targetCards[insertIndex].id : null;

      moveCard.mutate({ cardId: active.id as string, listId: targetListId, beforeId, afterId });
    }
  }

  if (isLoading) return <p className="px-4 py-8 text-gray-500">Loading board…</p>;
  if (isError) return <p className="px-4 py-8 text-red-600">Failed to load this board.</p>;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-full items-start gap-3 overflow-x-auto px-4 pb-4">
        <SortableContext items={lists.map((l) => l.id)} strategy={horizontalListSortingStrategy}>
          {lists.map((list) => (
            <ListColumn key={list.id} boardId={boardId} list={list} cards={cardsByList[list.id] ?? []} />
          ))}
        </SortableContext>
        <AddListForm boardId={boardId} />
      </div>

      <DragOverlay>
        {activeCard && (
          <div className="w-72 rounded-md border border-gray-300 bg-white p-2.5 text-sm shadow-lg">{activeCard.title}</div>
        )}
        {activeListName && (
          <div className="w-72 rounded-lg bg-gray-200 px-2.5 py-2 text-sm font-semibold text-gray-800 shadow-lg">
            {activeListName}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
