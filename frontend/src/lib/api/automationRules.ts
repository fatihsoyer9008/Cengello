import { apiFetch } from "@/lib/api/client";
import type { AutomationAction, AutomationActionCreate, AutomationRule, AutomationRuleCreate, AutomationRuleUpdate } from "@/types/automation";

export const automationRulesApi = {
  create: (data: AutomationRuleCreate) =>
    apiFetch<AutomationRule>("/automation-rules", { method: "POST", body: JSON.stringify(data) }),
  get: (id: string) => apiFetch<AutomationRule>(`/automation-rules/${id}`),
  update: (id: string, data: AutomationRuleUpdate) =>
    apiFetch<AutomationRule>(`/automation-rules/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  replaceActions: (id: string, actions: AutomationActionCreate[]) =>
    apiFetch<AutomationRule>(`/automation-rules/${id}/actions`, { method: "PUT", body: JSON.stringify(actions) }),
  remove: (id: string) => apiFetch<void>(`/automation-rules/${id}`, { method: "DELETE" }),
};

export type { AutomationAction };
