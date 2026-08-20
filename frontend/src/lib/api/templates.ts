import { apiFetch } from "@/lib/api/client";
import type { Template, TemplateApplyRequest, TemplateApplyResult, TemplateScope } from "@/types/template";

export const templatesApi = {
  list: (workspaceId?: string, scope?: TemplateScope) => {
    const params = new URLSearchParams();
    if (workspaceId) params.set("workspace_id", workspaceId);
    if (scope) params.set("scope", scope);
    const qs = params.toString();
    return apiFetch<Template[]>(`/templates${qs ? `?${qs}` : ""}`);
  },
  get: (id: string) => apiFetch<Template>(`/templates/${id}`),
  remove: (id: string) => apiFetch<void>(`/templates/${id}`, { method: "DELETE" }),
  apply: (id: string, data: TemplateApplyRequest) =>
    apiFetch<TemplateApplyResult>(`/templates/${id}/apply`, { method: "POST", body: JSON.stringify(data) }),
};
