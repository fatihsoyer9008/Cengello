import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { boardsApi } from "@/lib/api/boards";
import type { Card } from "@/types/card";

export function useBoardData(boardId: string) {
  const listsQuery = useQuery({
    queryKey: ["boards", boardId, "lists"],
    queryFn: () => boardsApi.lists(boardId),
    enabled: !!boardId,
  });

  const cardsQuery = useQuery({
    queryKey: ["boards", boardId, "cards"],
    queryFn: () => boardsApi.cards(boardId, { is_archived: false }),
    enabled: !!boardId,
  });

  const cardsByList = useMemo(() => {
    const grouped: Record<string, Card[]> = {};
    for (const card of cardsQuery.data ?? []) {
      (grouped[card.list_id] ??= []).push(card);
    }
    for (const listId of Object.keys(grouped)) {
      grouped[listId].sort((a, b) => a.position - b.position);
    }
    return grouped;
  }, [cardsQuery.data]);

  const sortedLists = useMemo(
    () => [...(listsQuery.data ?? [])].sort((a, b) => a.position - b.position),
    [listsQuery.data]
  );

  return {
    lists: sortedLists,
    cardsByList,
    isLoading: listsQuery.isLoading || cardsQuery.isLoading,
    isError: listsQuery.isError || cardsQuery.isError,
  };
}
