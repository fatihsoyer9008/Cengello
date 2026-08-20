"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError } from "@/lib/api/client";
import { boardsApi } from "@/lib/api/boards";
import { workspacesApi } from "@/lib/api/workspaces";
import { BOARD_BACKGROUND_OPTIONS, getBoardStyle } from "@/lib/board-theme";
import type { BoardVisibility } from "@/types/board";

const VISIBILITY_OPTIONS: { value: BoardVisibility; label: string }[] = [
  { value: "private", label: "Gizli" },
  { value: "workspace", label: "Çalışma Alanı" },
  { value: "public", label: "Herkese Açık" },
];

const fieldClass =
  "w-full rounded-md border border-white/15 bg-[#22272b] px-2.5 py-1.5 text-sm text-gray-100 focus:border-brand focus:outline-none";

export function CreateBoardDialog({
  open,
  onOpenChange,
  workspaceId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}) {
  const [name, setName] = useState("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(workspaceId);
  const [visibility, setVisibility] = useState<BoardVisibility>("workspace");
  const [background, setBackground] = useState<string>(BOARD_BACKGROUND_OPTIONS[0].value);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: workspaces } = useQuery({ queryKey: ["workspaces"], queryFn: workspacesApi.list, enabled: open });
  const activeWorkspaceId = selectedWorkspaceId || workspaceId;

  const createBoard = useMutation({
    mutationFn: () => boardsApi.create({ name, workspace_id: activeWorkspaceId, background, visibility }),
    onSuccess: (board) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", board.workspace_id, "boards"] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setName("");
      setError(null);
      onOpenChange(false);
      router.push(`/boards/${board.id}`);
    },
    onError: (err) => setError(err instanceof ApiError ? String(err.detail) : "Pano oluşturulamadı"),
  });

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <RadixDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-xs -translate-x-1/2 -translate-y-1/2 rounded-xl bg-[#282e33] p-4 shadow-2xl focus:outline-none">
          <div className="relative mb-3 flex items-center justify-center">
            <RadixDialog.Title className="text-sm font-semibold text-gray-100">Pano oluştur</RadixDialog.Title>
            <RadixDialog.Close asChild>
              <button
                className="absolute right-0 rounded p-1 text-gray-400 hover:bg-white/10 hover:text-white"
                aria-label="Kapat"
              >
                <X className="h-4 w-4" />
              </button>
            </RadixDialog.Close>
          </div>

          <div
            className="mb-4 flex h-24 items-center justify-center gap-1.5 rounded-md p-3"
            style={getBoardStyle({ id: "preview", background })}
          >
            <div className="h-14 w-8 rounded bg-white/30" />
            <div className="h-14 w-8 rounded bg-white/30" />
            <div className="h-14 w-8 rounded bg-white/30" />
          </div>

          <div className="mb-4">
            <p className="mb-1.5 text-xs font-semibold text-gray-300">Arka plan</p>
            <div className="grid grid-cols-3 gap-1.5">
              {BOARD_BACKGROUND_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setBackground(opt.value)}
                  aria-label={opt.name}
                  title={opt.name}
                  className={`relative h-12 overflow-hidden rounded transition ${
                    background === opt.value ? "ring-2 ring-brand ring-offset-2 ring-offset-[#282e33]" : "hover:opacity-80"
                  }`}
                  style={
                    opt.type === "image"
                      ? { backgroundImage: `url(${opt.value})`, backgroundSize: "cover", backgroundPosition: "center" }
                      : { backgroundImage: opt.value }
                  }
                >
                  {background === opt.value && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                      <Check className="h-4 w-4 text-white drop-shadow" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              if (name.trim()) createBoard.mutate();
            }}
            className="space-y-3"
          >
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-300">
                Pano Başlığı <span className="text-red-500">*</span>
              </label>
              <input
                autoFocus
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-300">Çalışma Alanı</label>
              <select
                value={activeWorkspaceId}
                onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                className={fieldClass}
              >
                {workspaces?.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-300">Görünürlük</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as BoardVisibility)}
                className={fieldClass}
              >
                {VISIBILITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={!name.trim() || createBoard.isPending}
              className="w-full rounded-md bg-brand py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-gray-500"
            >
              {createBoard.isPending ? "Oluşturuluyor…" : "Oluştur"}
            </button>
          </form>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
