import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { boardsApi } from "@/lib/api/boards";
import { usersApi } from "@/lib/api/users";

export function useBoardLookups(boardId: string) {
  const { data: labels } = useQuery({ queryKey: ["boards", boardId, "labels"], queryFn: () => boardsApi.labels(boardId) });
  const { data: members } = useQuery({ queryKey: ["boards", boardId, "members"], queryFn: () => boardsApi.members(boardId) });

  const memberIds = useMemo(() => members?.map((m) => m.user_id) ?? [], [members]);
  const { data: users } = useQuery({
    queryKey: ["boards", boardId, "member-users", memberIds],
    queryFn: () => Promise.all(memberIds.map((id) => usersApi.get(id))),
    enabled: memberIds.length > 0,
  });

  const labelsById = useMemo(() => new Map((labels ?? []).map((l) => [l.id, l])), [labels]);
  const usersById = useMemo(() => new Map((users ?? []).map((u) => [u.id, u])), [users]);

  return { labels: labels ?? [], labelsById, users: users ?? [], usersById };
}
