import { useMutation, useQueryClient } from "@tanstack/react-query";

import { listsApi } from "@/lib/api/lists";
import type { BoardList } from "@/types/list";

interface MoveListArgs {
  listId: string;
  beforeId: string | null;
  afterId: string | null;
}

function estimatePosition(lists: BoardList[], beforeId: string | null, afterId: string | null): number {
  const before = beforeId ? lists.find((l) => l.id === beforeId) : undefined;
  const after = afterId ? lists.find((l) => l.id === afterId) : undefined;
  if (before && after) return (before.position + after.position) / 2;
  if (before) return before.position + 1;
  if (after) return after.position - 1;
  return 0;
}

export function useMoveList(boardId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["boards", boardId, "lists"];

  return useMutation({
    mutationFn: ({ listId, beforeId, afterId }: MoveListArgs) =>
      listsApi.move(listId, { before_id: beforeId, after_id: afterId }),

    onMutate: async ({ listId, beforeId, afterId }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BoardList[]>(queryKey);
      if (previous) {
        const siblings = previous.filter((l) => l.id !== listId);
        const newPosition = estimatePosition(siblings, beforeId, afterId);
        const next = previous.map((l) => (l.id === listId ? { ...l, position: newPosition } : l));
        queryClient.setQueryData<BoardList[]>(queryKey, next);
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
      const current = queryClient.getQueryData<BoardList[]>(queryKey);
      if (current) {
        queryClient.setQueryData<BoardList[]>(
          queryKey,
          current.map((l) => (l.id === result.list.id ? result.list : l))
        );
      }
    },
  });
}
