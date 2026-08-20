"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { boardsApi } from "@/lib/api/boards";
import { ApiError } from "@/lib/api/client";
import { templatesApi } from "@/lib/api/templates";

export function TemplatesPanel({ boardId }: { boardId: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: board } = useQuery({ queryKey: ["boards", boardId], queryFn: () => boardsApi.get(boardId) });
  const workspaceId = board?.workspace_id;

  const { data: templates } = useQuery({
    queryKey: ["templates", { workspaceId, scope: "board" }],
    queryFn: () => templatesApi.list(workspaceId, "board"),
    enabled: !!workspaceId,
  });

  const captureTemplate = useMutation({
    mutationFn: () => boardsApi.captureTemplate(boardId, { name, workspace_id: workspaceId as string }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates", { workspaceId, scope: "board" }] });
      setName("");
    },
    onError: (err) => setError(err instanceof ApiError ? String(err.detail) : "Failed to save template"),
  });

  const applyTemplate = useMutation({
    mutationFn: (templateId: string) => templatesApi.apply(templateId, { workspace_id: workspaceId }),
    onSuccess: (result) => {
      if (result.board_id) router.push(`/boards/${result.board_id}`);
    },
  });

  const removeTemplate = useMutation({
    mutationFn: (id: string) => templatesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["templates", { workspaceId, scope: "board" }] }),
  });

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          captureTemplate.mutate();
        }}
        className="flex gap-2 rounded-md border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
      >
        <Input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Template name"
        />
        <Button type="submit" disabled={captureTemplate.isPending || !workspaceId}>
          Save this board as template
        </Button>
      </form>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800">
        {templates?.map((template) => (
          <li key={template.id} className="flex items-center justify-between px-3 py-2">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{template.name}</span>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => applyTemplate.mutate(template.id)} disabled={applyTemplate.isPending}>
                Create board from this
              </Button>
              <Button variant="danger" onClick={() => removeTemplate.mutate(template.id)}>
                Delete
              </Button>
            </div>
          </li>
        ))}
        {templates?.length === 0 && <li className="px-3 py-3 text-sm text-gray-400 dark:text-gray-500">No board templates yet.</li>}
      </ul>
    </div>
  );
}
