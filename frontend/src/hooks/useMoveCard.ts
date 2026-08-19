import { useMutation, useQueryClient } from "@tanstack/react-query";

import { cardsApi } from "@/lib/api/cards";
import type { Card } from "@/types/card";

interface MoveCardArgs {
  cardId: string;
  listId: string;
  beforeId: string | null;
  afterId: string | null;
}

function estimatePosition(cards: Card[], beforeId: string | null, afterId: string | null): number {
  const before = beforeId ? cards.find((c) => c.id === beforeId) : undefined;
  const after = afterId ? cards.find((c) => c.id === afterId) : undefined;
  if (before && after) return (before.position + after.position) / 2;
  if (before) return before.position + 1;
  if (after) return after.position - 1;
  return 0;
}

export function useMoveCard(boardId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["boards", boardId, "cards"];

  return useMutation({
    mutationFn: ({ cardId, listId, beforeId, afterId }: MoveCardArgs) =>
      cardsApi.move(cardId, { list_id: listId, before_id: beforeId, after_id: afterId }),

    onMutate: async ({ cardId, listId, beforeId, afterId }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Card[]>(queryKey);
      if (previous) {
        const siblings = previous.filter((c) => c.list_id === listId && c.id !== cardId);
        const newPosition = estimatePosition(siblings, beforeId, afterId);
        const next = previous.map((c) => (c.id === cardId ? { ...c, list_id: listId, position: newPosition } : c));
        queryClient.setQueryData<Card[]>(queryKey, next);
      }
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },

    onSuccess: (result) => {
      if (result.rebalanced) {
        queryClient.invalidateQueries({ queryKey });
        return;
      }
      const current = queryClient.getQueryData<Card[]>(queryKey);
      if (current) {
        queryClient.setQueryData<Card[]>(
          queryKey,
          current.map((c) => (c.id === result.card.id ? result.card : c))
        );
      }
    },
  });
}
