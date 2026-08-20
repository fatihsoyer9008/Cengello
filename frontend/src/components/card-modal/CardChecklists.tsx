"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SquareCheckBig } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useCardChecklists } from "@/hooks/useCardQueries";
import { checklistsApi } from "@/lib/api/checklists";

function invalidate(queryClient: ReturnType<typeof useQueryClient>, cardId: string) {
  queryClient.invalidateQueries({ queryKey: ["cards", cardId, "checklists"] });
}

const pillButtonClass =
  "rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/20";

export function CardChecklists({ cardId }: { cardId: string }) {
  const { data: checklists } = useCardChecklists(cardId);
  const queryClient = useQueryClient();
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState("");
  const [hideCompleted, setHideCompleted] = useState<Record<string, boolean>>({});
  const itemInputRef = useRef<HTMLInputElement>(null);

  const deleteChecklist = useMutation({
    mutationFn: (id: string) => checklistsApi.remove(id),
    onSuccess: () => invalidate(queryClient, cardId),
  });

  const createItem = useMutation({
    mutationFn: (checklistId: string) => checklistsApi.createItem({ text: newItemText, checklist_id: checklistId }),
    onSuccess: () => {
      invalidate(queryClient, cardId);
      setNewItemText("");
      // Stay in "adding" mode so the user can keep typing the next item without re-clicking.
      itemInputRef.current?.focus();
    },
  });

  // Pasting multi-line text (e.g. a copied to-do list) creates one item per non-empty line
  // instead of dumping the whole blob into a single item.
  const bulkCreateItems = useMutation({
    mutationFn: async ({ checklistId, lines }: { checklistId: string; lines: string[] }) => {
      for (const line of lines) {
        await checklistsApi.createItem({ text: line, checklist_id: checklistId });
      }
    },
    onSuccess: () => {
      invalidate(queryClient, cardId);
      setNewItemText("");
      itemInputRef.current?.focus();
    },
  });

  const toggleItem = useMutation({
    mutationFn: ({ itemId, isComplete }: { itemId: string; isComplete: boolean }) =>
      checklistsApi.updateItem(itemId, { is_complete: isComplete }),
    onSuccess: () => invalidate(queryClient, cardId),
  });

  const deleteItem = useMutation({
    mutationFn: (itemId: string) => checklistsApi.removeItem(itemId),
    onSuccess: () => invalidate(queryClient, cardId),
  });

  if (!checklists || checklists.length === 0) return null;

  return (
    <div className="space-y-5">
      {checklists.map((checklist) => {
        const hiding = hideCompleted[checklist.id] ?? false;
        const visibleItems = hiding ? checklist.items.filter((item) => !item.is_complete) : checklist.items;

        return (
          <div key={checklist.id}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                <SquareCheckBig className="h-4 w-4" />
                {checklist.title}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHideCompleted((prev) => ({ ...prev, [checklist.id]: !hiding }))}
                  className={pillButtonClass}
                >
                  {hiding ? "İşaretlenen öğeleri göster" : "İşaretlenen öğeleri gizle"}
                </button>
                <button
                  onClick={(e) => {
                    e.currentTarget.blur();
                    deleteChecklist.mutate(checklist.id);
                  }}
                  className={pillButtonClass}
                >
                  Sil
                </button>
              </div>
            </div>

            <div className="mb-2 flex items-center gap-2">
              <span className="w-9 shrink-0 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                {checklist.total_count ? Math.round((checklist.completed_count / checklist.total_count) * 100) : 0}%
              </span>
              <ProgressBar value={checklist.total_count ? checklist.completed_count / checklist.total_count : 0} />
            </div>

            <ul className="space-y-1">
              {visibleItems.map((item) => (
                <li key={item.id} className="group flex items-center gap-2.5 rounded px-1 py-1 text-sm hover:bg-gray-50 dark:hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={item.is_complete}
                    onChange={(e) => toggleItem.mutate({ itemId: item.id, isComplete: e.target.checked })}
                    className="h-4 w-4 shrink-0 accent-blue-500"
                  />
                  <span
                    className={
                      item.is_complete
                        ? "flex-1 text-gray-400 line-through dark:text-gray-500"
                        : "flex-1 text-gray-800 dark:text-gray-200"
                    }
                  >
                    {item.text}
                  </span>
                  <button
                    onClick={(e) => {
                      e.currentTarget.blur();
                      deleteItem.mutate(item.id);
                    }}
                    className="shrink-0 text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-600 dark:text-gray-600 dark:hover:text-red-400"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>

            {addingTo === checklist.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newItemText.trim()) createItem.mutate(checklist.id);
                }}
                className="mt-1.5 flex gap-2 pl-1"
              >
                <Input
                  ref={itemInputRef}
                  autoFocus
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="Öğe metni (birden çok satır yapıştırabilirsin)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (newItemText.trim()) createItem.mutate(checklist.id);
                    }
                    if (e.key === "Escape") setAddingTo(null);
                  }}
                  onPaste={(e) => {
                    const text = e.clipboardData.getData("text");
                    if (!text.includes("\n")) return;
                    e.preventDefault();
                    const lines = text
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean);
                    if (lines.length > 0) bulkCreateItems.mutate({ checklistId: checklist.id, lines });
                  }}
                />
                <Button type="submit">Ekle</Button>
                <Button type="button" variant="ghost" onClick={() => setAddingTo(null)}>
                  İptal
                </Button>
              </form>
            ) : (
              <button
                onClick={() => setAddingTo(checklist.id)}
                className="mt-1.5 rounded px-1 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
              >
                + Öğe ekle
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
