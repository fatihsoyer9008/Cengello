"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useCardChecklists } from "@/hooks/useCardQueries";
import { checklistsApi } from "@/lib/api/checklists";

function invalidate(queryClient: ReturnType<typeof useQueryClient>, cardId: string) {
  queryClient.invalidateQueries({ queryKey: ["cards", cardId, "checklists"] });
}

export function CardChecklists({ cardId }: { cardId: string }) {
  const { data: checklists } = useCardChecklists(cardId);
  const queryClient = useQueryClient();
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState("");

  const createChecklist = useMutation({
    mutationFn: () => checklistsApi.create({ title: newChecklistTitle, card_id: cardId }),
    onSuccess: () => {
      invalidate(queryClient, cardId);
      setNewChecklistTitle("");
    },
  });

  const deleteChecklist = useMutation({
    mutationFn: (id: string) => checklistsApi.remove(id),
    onSuccess: () => invalidate(queryClient, cardId),
  });

  const createItem = useMutation({
    mutationFn: (checklistId: string) => checklistsApi.createItem({ text: newItemText, checklist_id: checklistId }),
    onSuccess: () => {
      invalidate(queryClient, cardId);
      setNewItemText("");
      setAddingTo(null);
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

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-600">Checklists</p>
      {checklists?.map((checklist) => (
        <div key={checklist.id} className="rounded-md border border-gray-200 p-3">
          <div className="mb-1 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-800">{checklist.title}</h4>
            <button onClick={() => deleteChecklist.mutate(checklist.id)} className="text-xs text-gray-400 hover:text-red-600">
              Delete
            </button>
          </div>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {checklist.completed_count}/{checklist.total_count}
            </span>
            <ProgressBar value={checklist.total_count ? checklist.completed_count / checklist.total_count : 0} />
          </div>
          <ul className="space-y-1">
            {checklist.items.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={item.is_complete}
                  onChange={(e) => toggleItem.mutate({ itemId: item.id, isComplete: e.target.checked })}
                />
                <span className={item.is_complete ? "flex-1 text-gray-400 line-through" : "flex-1 text-gray-800"}>
                  {item.text}
                </span>
                <button onClick={() => deleteItem.mutate(item.id)} className="text-xs text-gray-300 hover:text-red-600">
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
              className="mt-2 flex gap-2"
            >
              <Input autoFocus value={newItemText} onChange={(e) => setNewItemText(e.target.value)} placeholder="Item text" />
              <Button type="submit">Add</Button>
              <Button type="button" variant="ghost" onClick={() => setAddingTo(null)}>
                Cancel
              </Button>
            </form>
          ) : (
            <button onClick={() => setAddingTo(checklist.id)} className="mt-2 text-xs text-gray-500 hover:text-gray-800">
              + Add item
            </button>
          )}
        </div>
      ))}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (newChecklistTitle.trim()) createChecklist.mutate();
        }}
        className="flex gap-2"
      >
        <Input
          value={newChecklistTitle}
          onChange={(e) => setNewChecklistTitle(e.target.value)}
          placeholder="New checklist title"
        />
        <Button type="submit">Add checklist</Button>
      </form>
    </div>
  );
}
