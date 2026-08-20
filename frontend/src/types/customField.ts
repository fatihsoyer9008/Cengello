export type CustomFieldType = "text" | "number" | "dropdown" | "checkbox" | "date";

export interface DropdownOption {
  id: string;
  label: string;
  color?: string;
}

export interface CustomField {
  id: string;
  name: string;
  field_type: CustomFieldType;
  config: { options?: DropdownOption[] } & Record<string, unknown>;
  board_id: string;
  position: number;
}

export interface CustomFieldCreate {
  name: string;
  field_type: CustomFieldType;
  config?: Record<string, unknown>;
  board_id: string;
}

export interface CustomFieldUpdate {
  name?: string;
  config?: Record<string, unknown>;
  position?: number;
}

export interface CustomFieldValue {
  id: string;
  custom_field_id: string;
  card_id: string;
  value: Record<string, unknown> | null;
}

export interface CustomFieldValueUpsert {
  value: Record<string, unknown> | null;
}
