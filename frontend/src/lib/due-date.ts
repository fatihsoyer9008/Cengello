export type DueState = "none" | "upcoming" | "due-soon" | "overdue" | "complete";

const DUE_SOON_WINDOW_MS = 24 * 60 * 60 * 1000;

export function getDueState(dueDate: string | null, dueCompleted: boolean): DueState {
  if (!dueDate) return "none";
  if (dueCompleted) return "complete";
  const diffMs = new Date(dueDate).getTime() - Date.now();
  if (diffMs < 0) return "overdue";
  if (diffMs <= DUE_SOON_WINDOW_MS) return "due-soon";
  return "upcoming";
}

export const DUE_STATE_CLASSES: Record<DueState, string> = {
  none: "",
  complete: "bg-green-100 text-green-800 border-green-300",
  overdue: "bg-red-100 text-red-800 border-red-300",
  "due-soon": "bg-amber-100 text-amber-800 border-amber-300",
  upcoming: "bg-gray-100 text-gray-700 border-gray-300",
};

export function formatDueDate(dueDate: string): string {
  return new Date(dueDate).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
