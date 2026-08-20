"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError } from "@/lib/api/client";
import { workspacesApi } from "@/lib/api/workspaces";
import { usersApi } from "@/lib/api/users";
import type { WorkspaceRole } from "@/types/workspace";

export default function WorkspaceMembersPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: members } = useQuery({
    queryKey: ["workspaces", workspaceId, "members"],
    queryFn: () => workspacesApi.members(workspaceId),
  });

  const userIds = members?.map((m) => m.user_id) ?? [];
  const { data: userDetails } = useQuery({
    queryKey: ["workspaces", workspaceId, "member-users", userIds],
    queryFn: async () => {
      const results = await Promise.all(userIds.map((id) => usersApi.get(id)));
      return Object.fromEntries(results.map((u) => [u.id, u]));
    },
    enabled: userIds.length > 0,
  });

  const addMember = useMutation({
    mutationFn: () => workspacesApi.addMember(workspaceId, { email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "members"] });
      setEmail("");
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiError ? String(err.detail) : "Failed to add member"),
  });

  const updateRole = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: WorkspaceRole }) =>
      workspacesApi.updateMember(workspaceId, memberId, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "members"] }),
  });

  const removeMember = useMutation({
    mutationFn: (memberId: string) => workspacesApi.removeMember(workspaceId, memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "members"] }),
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href={`/workspaces/${workspaceId}/boards`} className="text-sm text-gray-500 hover:underline dark:text-gray-400">
        ← Boards
      </Link>
      <h1 className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">Workspace members</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          addMember.mutate();
        }}
        className="mt-4 flex gap-2"
      >
        <Input type="email" placeholder="Invite by email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit" disabled={addMember.isPending}>
          Invite
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <ul className="mt-6 divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800">
        {members?.map((member) => (
          <li key={member.id} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-gray-800 dark:text-gray-200">{userDetails?.[member.user_id]?.email ?? member.user_id}</span>
            <div className="flex items-center gap-2">
              <select
                className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                value={member.role}
                onChange={(e) => updateRole.mutate({ memberId: member.id, role: e.target.value as WorkspaceRole })}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
              <Button variant="danger" onClick={() => removeMember.mutate(member.id)}>
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
