"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { boardsApi } from "@/lib/api/boards";
import { ApiError } from "@/lib/api/client";
import { customFieldsApi } from "@/lib/api/customFields";
import type { CustomFieldType, DropdownOption } from "@/types/customField";

const FIELD_TYPES: CustomFieldType[] = ["text", "number", "dropdown", "checkbox", "date"];

export function CustomFieldsManager({ boardId }: { boardId: string }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [fieldType, setFieldType] = useState<CustomFieldType>("text");
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [optionLabel, setOptionLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: fields } = useQuery({
    queryKey: ["boards", boardId, "custom-fields"],
    queryFn: () => boardsApi.customFields(boardId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["boards", boardId, "custom-fields"] });

  const createField = useMutation({
    mutationFn: () =>
      customFieldsApi.create({
        name,
        field_type: fieldType,
        board_id: boardId,
        config: fieldType === "dropdown" ? { options } : {},
      }),
    onSuccess: () => {
      invalidate();
      setName("");
      setOptions([]);
    },
    onError: (err) => setError(err instanceof ApiError ? String(err.detail) : "Failed to create field"),
  });

  const removeField = useMutation({
    mutationFn: (id: string) => customFieldsApi.remove(id),
    onSuccess: invalidate,
  });

  function addOption() {
    if (!optionLabel.trim()) return;
    setOptions([...options, { id: crypto.randomUUID(), label: optionLabel.trim() }]);
    setOptionLabel("");
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          createField.mutate();
        }}
        className="space-y-3 rounded-md border border-gray-200 bg-white p-3"
      >
        <div className="flex flex-wrap gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Name</label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Type</label>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value as CustomFieldType)}
            >
              {FIELD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {fieldType === "dropdown" && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">Options</label>
            <div className="flex flex-wrap gap-1.5">
              {options.map((opt) => (
                <span key={opt.id} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                  {opt.label}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={optionLabel}
                onChange={(e) => setOptionLabel(e.target.value)}
                placeholder="Add option"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addOption();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={addOption}>
                Add
              </Button>
            </div>
          </div>
        )}

        <Button type="submit" disabled={createField.isPending}>
          Add custom field
        </Button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 bg-white">
        {fields?.map((field) => (
          <li key={field.id} className="flex items-center justify-between px-3 py-2">
            <div>
              <span className="font-medium text-gray-800">{field.name}</span>
              <span className="ml-2 text-xs text-gray-400">{field.field_type}</span>
            </div>
            <Button variant="danger" onClick={() => removeField.mutate(field.id)}>
              Delete
            </Button>
          </li>
        ))}
        {fields?.length === 0 && <li className="px-3 py-3 text-sm text-gray-400">No custom fields yet.</li>}
      </ul>
    </div>
  );
}
