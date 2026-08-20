"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { boardsApi } from "@/lib/api/boards";
import { ApiError } from "@/lib/api/client";
import { labelsApi } from "@/lib/api/labels";

const PRESET_COLORS = ["#61bd4f", "#f2d600", "#ff9f1a", "#eb5a46", "#c377e0", "#0079bf", "#00c2e0", "#51e898", "#ff78cb", "#344563"];

export function LabelsManager({ boardId }: { boardId: string }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  const { data: labels } = useQuery({ queryKey: ["boards", boardId, "labels"], queryFn: () => boardsApi.labels(boardId) });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["boards", boardId, "labels"] });

  const createLabel = useMutation({
    mutationFn: () => labelsApi.create({ name, color, board_id: boardId }),
    onSuccess: () => {
      invalidate();
      setName("");
    },
    onError: (err) => setError(err instanceof ApiError ? String(err.detail) : "Failed to create label"),
  });

  const updateLabel = useMutation({
    mutationFn: ({ id, name: n, color: c }: { id: string; name: string; color: string }) =>
      labelsApi.update(id, { name: n, color: c }),
    onSuccess: invalidate,
  });

  const removeLabel = useMutation({
    mutationFn: (id: string) => labelsApi.remove(id),
    onSuccess: invalidate,
  });

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          createLabel.mutate();
        }}
        className="flex flex-wrap items-end gap-3 rounded-md border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Color</label>
          <div className="flex gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-7 w-7 rounded ${color === c ? "ring-2 ring-offset-1 ring-gray-800 dark:ring-offset-gray-800" : ""}`}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>
        <Button type="submit" disabled={createLabel.isPending}>
          Add label
        </Button>
      </form>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800">
        {labels?.map((label) => (
          <li key={label.id} className="flex items-center justify-between gap-3 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="h-6 w-10 rounded" style={{ backgroundColor: label.color }} />
              <Input
                defaultValue={label.name}
                className="w-40"
                onBlur={(e) => {
                  if (e.target.value !== label.name) {
                    updateLabel.mutate({ id: label.id, name: e.target.value, color: label.color });
                  }
                }}
              />
            </div>
            <Button variant="danger" onClick={() => removeLabel.mutate(label.id)}>
              Delete
            </Button>
          </li>
        ))}
        {labels?.length === 0 && <li className="px-3 py-3 text-sm text-gray-400 dark:text-gray-500">No labels yet.</li>}
      </ul>
    </div>
  );
}
