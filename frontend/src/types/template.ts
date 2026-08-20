export type TemplateScope = "board" | "card";

export interface Template {
  id: string;
  name: string;
  description: string | null;
  scope: TemplateScope;
  is_public: boolean;
  workspace_id: string | null;
  snapshot: Record<string, unknown>;
  created_by: string;
}

export interface TemplateCaptureBoardRequest {
  name: string;
  description?: string | null;
  workspace_id: string;
  is_public?: boolean;
}

export interface TemplateCaptureCardRequest {
  name: string;
  description?: string | null;
  workspace_id: string;
  is_public?: boolean;
}

export interface TemplateApplyRequest {
  workspace_id?: string | null;
  list_id?: string | null;
  name?: string | null;
}

export interface TemplateApplyResult {
  board_id: string | null;
  card_id: string | null;
}
