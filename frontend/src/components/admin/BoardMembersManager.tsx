"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { boardsApi } from "@/lib/api/boards";
import { ApiError } from "@/lib/api/client";
import { usersApi } from "@/lib/api/users";
import type { BoardRole } from "@/types/board";

export function BoardMembersManager({ boardId, ownerId }: { boardId: string; ownerId: string }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: members } = useQuery({ queryKey: ["boards", boardId, "members"], queryFn: () => boardsApi.members(boardId) });

  const userIds = members?.map((m) => m.user_id) ?? [];
  const { data: userDetails } = useQuery({
    queryKey: ["boards", boardId, "member-users-map", userIds],
    queryFn: async () => Object.fromEntries((await Promise.all(userIds.map((id) => usersApi.get(id)))).map((u) => [u.id, u])),
    enabled: userIds.length > 0,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["boards", boardId, "members"] });

  const addMember = useMutation({
    mutationFn: () => boardsApi.addMember(boardId, { email }),
    onSuccess: () => {
      invalidate();
      setEmail("");
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiError ? String(err.detail) : "Failed to add member"),
  });

  const updateRole = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: BoardRole }) => boardsApi.updateMember(boardId, memberId, { role }),
    onSuccess: invalidate,
  });

  const removeMember = useMutation({
    mutationFn: (memberId: string) => boardsApi.removeMember(boardId, memberId),
    onSuccess: invalidate,
  });

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addMember.mutate();
        }}
        className="flex gap-2"
      >
        <Input type="email" placeholder="Invite by email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit" disabled={addMember.isPending}>
          Invite
        </Button>
      </form>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800">
        {members?.map((member) => (
          <li key={member.id} className="flex items-center justify-between px-3 py-2">
            <span className="text-sm text-gray-800 dark:text-gray-200">{userDetails?.[member.user_id]?.email ?? member.user_id}</span>
            {member.user_id === ownerId ? (
              <span className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
                Owner
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  value={member.role}
                  onChange={(e) => updateRole.mutate({ memberId: member.id, role: e.target.value as BoardRole })}
                >
                  <option value="viewer">Viewer</option>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <Button variant="danger" onClick={() => removeMember.mutate(member.id)}>
                  Remove
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
