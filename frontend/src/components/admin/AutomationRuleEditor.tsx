"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { automationRulesApi } from "@/lib/api/automationRules";
import { boardsApi } from "@/lib/api/boards";
import { ApiError } from "@/lib/api/client";
import { usersApi } from "@/lib/api/users";
import { ACTION_TYPES, TRIGGER_TYPES } from "@/types/automation";

interface DraftAction {
  action_type: string;
  action_config: Record<string, unknown>;
}

function TriggerConfigFields({
  triggerType,
  config,
  onChange,
  listOptions,
  labelOptions,
}: {
  triggerType: string;
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  listOptions: { id: string; name: string }[];
  labelOptions: { id: string; name: string; color: string }[];
}) {
  if (triggerType === "card_moved_to_list") {
    return (
      <select
        className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        value={(config.to_list_id as string) ?? ""}
        onChange={(e) => onChange({ ...config, to_list_id: e.target.value })}
      >
        <option value="">Select target list…</option>
        {listOptions.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
    );
  }
  if (triggerType === "card_created_in_list") {
    return (
      <select
        className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        value={(config.list_id as string) ?? ""}
        onChange={(e) => onChange({ ...config, list_id: e.target.value })}
      >
        <option value="">Select list…</option>
        {listOptions.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
    );
  }
  if (triggerType === "label_added") {
    return (
      <select
        className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        value={(config.label_id as string) ?? ""}
        onChange={(e) => onChange({ ...config, label_id: e.target.value })}
      >
        <option value="">Select label…</option>
        {labelOptions.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name || l.color}
          </option>
        ))}
      </select>
    );
  }
  if (triggerType === "checklist_completed") {
    return (
      <Input
        placeholder="Checklist title (optional, matches any if blank)"
        value={(config.checklist_title as string) ?? ""}
        onChange={(e) => onChange({ ...config, checklist_title: e.target.value })}
      />
    );
  }
  if (triggerType === "due_date_approaching") {
    return (
      <Input
        type="number"
        placeholder="Hours before due date"
        value={(config.hours_before as number) ?? ""}
        onChange={(e) => onChange({ ...config, hours_before: Number(e.target.value) })}
      />
    );
  }
  return null;
}

function ActionConfigFields({
  action,
  onChange,
  listOptions,
  labelOptions,
  userOptions,
}: {
  action: DraftAction;
  onChange: (config: Record<string, unknown>) => void;
  listOptions: { id: string; name: string }[];
  labelOptions: { id: string; name: string; color: string }[];
  userOptions: { id: string; email: string }[];
}) {
  const config = action.action_config;
  if (action.action_type === "add_label" || action.action_type === "remove_label") {
    return (
      <select
        className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        value={(config.label_id as string) ?? ""}
        onChange={(e) => onChange({ ...config, label_id: e.target.value })}
      >
        <option value="">Select label…</option>
        {labelOptions.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name || l.color}
          </option>
        ))}
      </select>
    );
  }
  if (action.action_type === "move_card_to_list") {
    return (
      <select
        className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        value={(config.list_id as string) ?? ""}
        onChange={(e) => onChange({ ...config, list_id: e.target.value, position: "bottom" })}
      >
        <option value="">Select list…</option>
        {listOptions.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
    );
  }
  if (action.action_type === "assign_member") {
    return (
      <select
        className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        value={(config.user_id as string) ?? ""}
        onChange={(e) => onChange({ ...config, user_id: e.target.value })}
      >
        <option value="">Select member…</option>
        {userOptions.map((u) => (
          <option key={u.id} value={u.id}>
            {u.email}
          </option>
        ))}
      </select>
    );
  }
  if (action.action_type === "post_comment") {
    return (
      <Input
        placeholder="Comment body"
        value={(config.body as string) ?? ""}
        onChange={(e) => onChange({ ...config, body: e.target.value })}
      />
    );
  }
  return <span className="text-xs text-gray-400 dark:text-gray-500">No configuration needed.</span>;
}

export function AutomationRuleEditor({ boardId }: { boardId: string }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState<string>(TRIGGER_TYPES[0]);
  const [triggerConfig, setTriggerConfig] = useState<Record<string, unknown>>({});
  const [actions, setActions] = useState<DraftAction[]>([{ action_type: ACTION_TYPES[0], action_config: {} }]);
  const [error, setError] = useState<string | null>(null);

  const { data: rules } = useQuery({
    queryKey: ["boards", boardId, "automation-rules"],
    queryFn: () => boardsApi.automationRules(boardId),
  });
  const { data: lists } = useQuery({ queryKey: ["boards", boardId, "lists"], queryFn: () => boardsApi.lists(boardId) });
  const { data: labels } = useQuery({ queryKey: ["boards", boardId, "labels"], queryFn: () => boardsApi.labels(boardId) });
  const { data: boardMembers } = useQuery({ queryKey: ["boards", boardId, "members"], queryFn: () => boardsApi.members(boardId) });
  const memberIds = boardMembers?.map((m) => m.user_id) ?? [];
  const { data: userOptions } = useQuery({
    queryKey: ["boards", boardId, "member-users", memberIds],
    queryFn: () => Promise.all(memberIds.map((id) => usersApi.get(id))),
    enabled: memberIds.length > 0,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["boards", boardId, "automation-rules"] });

  const createRule = useMutation({
    mutationFn: () =>
      automationRulesApi.create({
        name,
        board_id: boardId,
        trigger_type: triggerType,
        trigger_config: triggerConfig,
        is_enabled: true,
        actions: actions.map((a, index) => ({ ...a, position: index })),
      }),
    onSuccess: () => {
      invalidate();
      setName("");
      setTriggerConfig({});
      setActions([{ action_type: ACTION_TYPES[0], action_config: {} }]);
    },
    onError: (err) => setError(err instanceof ApiError ? String(err.detail) : "Failed to create rule"),
  });

  const toggleEnabled = useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      automationRulesApi.update(id, { is_enabled: isEnabled }),
    onSuccess: invalidate,
  });

  const removeRule = useMutation({
    mutationFn: (id: string) => automationRulesApi.remove(id),
    onSuccess: invalidate,
  });

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          createRule.mutate();
        }}
        className="space-y-3 rounded-md border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Rule name</label>
          <Input required value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">When…</label>
          <div className="flex items-center gap-2">
            <select
              className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              value={triggerType}
              onChange={(e) => {
                setTriggerType(e.target.value);
                setTriggerConfig({});
              }}
            >
              {TRIGGER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <TriggerConfigFields
              triggerType={triggerType}
              config={triggerConfig}
              onChange={setTriggerConfig}
              listOptions={lists ?? []}
              labelOptions={labels ?? []}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Then…</label>
          {actions.map((action, index) => (
            <div key={index} className="flex items-center gap-2">
              <select
                className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                value={action.action_type}
                onChange={(e) => {
                  const next = [...actions];
                  next[index] = { action_type: e.target.value, action_config: {} };
                  setActions(next);
                }}
              >
                {ACTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <ActionConfigFields
                action={action}
                onChange={(config) => {
                  const next = [...actions];
                  next[index] = { ...action, action_config: config };
                  setActions(next);
                }}
                listOptions={lists ?? []}
                labelOptions={labels ?? []}
                userOptions={userOptions ?? []}
              />
              {actions.length > 1 && (
                <button
                  type="button"
                  onClick={() => setActions(actions.filter((_, i) => i !== index))}
                  className="text-xs text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setActions([...actions, { action_type: ACTION_TYPES[0], action_config: {} }])}
            className="text-xs text-blue-600 hover:underline dark:text-blue-400"
          >
            + Add another action
          </button>
        </div>

        <Button type="submit" disabled={createRule.isPending}>
          Create rule
        </Button>
      </form>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800">
        {rules?.map((rule) => (
          <li key={rule.id} className="flex items-center justify-between px-3 py-2">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{rule.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {rule.trigger_type} → {rule.actions.map((a) => a.action_type).join(", ")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={rule.is_enabled}
                  onChange={(e) => toggleEnabled.mutate({ id: rule.id, isEnabled: e.target.checked })}
                />
                Enabled
              </label>
              <Button variant="danger" onClick={() => removeRule.mutate(rule.id)}>
                Delete
              </Button>
            </div>
          </li>
        ))}
        {rules?.length === 0 && <li className="px-3 py-3 text-sm text-gray-400 dark:text-gray-500">No automation rules yet.</li>}
      </ul>
    </div>
  );
}
