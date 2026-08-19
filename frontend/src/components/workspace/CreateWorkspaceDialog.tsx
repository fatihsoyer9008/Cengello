"use client";

import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { ApiError } from "@/lib/api/client";
import { workspacesApi } from "@/lib/api/workspaces";

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base || "workspace"}-${Math.random().toString(36).slice(2, 7)}`;
}

export function CreateWorkspaceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => workspacesApi.create({ name, slug: slugify(name) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setName("");
      onOpenChange(false);
    },
    onError: (err) => setError(err instanceof ApiError ? String(err.detail) : "Failed to create workspace"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Create workspace">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          mutation.mutate();
        }}
        className="space-y-4"
      >
        {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Name</label>
          <Input required value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating…" : "Create"}
        </Button>
      </form>
    </Dialog>
  );
}
