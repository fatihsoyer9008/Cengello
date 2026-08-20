const STORAGE_KEY = "cengello:recent-boards";
const MAX_RECENT = 8;

export function getRecentBoardIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function pushRecentBoard(boardId: string): void {
  if (typeof window === "undefined") return;
  const next = [boardId, ...getRecentBoardIds().filter((id) => id !== boardId)].slice(0, MAX_RECENT);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
