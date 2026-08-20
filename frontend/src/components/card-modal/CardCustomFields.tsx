"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Input } from "@/components/ui/Input";
import { useCardCustomFieldValues } from "@/hooks/useCardQueries";
import { boardsApi } from "@/lib/api/boards";
import { customFieldsApi } from "@/lib/api/customFields";

export function CardCustomFields({ boardId, cardId }: { boardId: string; cardId: string }) {
  const { data: fields } = useQuery({ queryKey: ["boards", boardId, "custom-fields"], queryFn: () => boardsApi.customFields(boardId) });
  const { data: values } = useCardCustomFieldValues(cardId);
  const queryClient = useQueryClient();

  const upsert = useMutation({
    mutationFn: ({ fieldId, value }: { fieldId: string; value: Record<string, unknown> | null }) =>
      customFieldsApi.upsertValue(cardId, fieldId, { value }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cards", cardId, "custom-field-values"] }),
  });

  if (!fields || fields.length === 0) return null;

  const valueByFieldId = new Map(values?.map((v) => [v.custom_field_id, v.value]));

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Custom fields</p>
      <div className="space-y-2">
        {fields.map((field) => {
          const current = valueByFieldId.get(field.id);
          return (
            <div key={field.id} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-sm text-gray-600 dark:text-gray-400">{field.name}</span>
              {field.field_type === "text" && (
                <Input
                  defaultValue={(current?.text as string) ?? ""}
                  onBlur={(e) => upsert.mutate({ fieldId: field.id, value: { text: e.target.value } })}
                />
              )}
              {field.field_type === "number" && (
                <Input
                  type="number"
                  defaultValue={(current?.number as number) ?? ""}
                  onBlur={(e) => upsert.mutate({ fieldId: field.id, value: { number: Number(e.target.value) } })}
                />
              )}
              {field.field_type === "date" && (
                <Input
                  type="date"
                  defaultValue={(current?.date as string) ?? ""}
                  onChange={(e) => upsert.mutate({ fieldId: field.id, value: { date: e.target.value } })}
                />
              )}
              {field.field_type === "checkbox" && (
                <input
                  type="checkbox"
                  checked={Boolean(current?.checked)}
                  onChange={(e) => upsert.mutate({ fieldId: field.id, value: { checked: e.target.checked } })}
                />
              )}
              {field.field_type === "dropdown" && (
                <select
                  className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  value={(current?.option_id as string) ?? ""}
                  onChange={(e) => upsert.mutate({ fieldId: field.id, value: { option_id: e.target.value } })}
                >
                  <option value="">—</option>
                  {(field.config.options ?? []).map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
