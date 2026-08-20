import type { CSSProperties } from "react";

const BOARD_GRADIENTS = [
  "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
  "linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #0ea5e9 100%)",
  "linear-gradient(135deg, #059669 0%, #34d399 100%)",
  "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
  "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
  "linear-gradient(135deg, #db2777 0%, #f472b6 100%)",
];

const WORKSPACE_COLORS = ["bg-emerald-600", "bg-blue-600", "bg-purple-600", "bg-orange-600", "bg-pink-600", "bg-cyan-600"];

const USER_COLORS = [
  "bg-amber-500",
  "bg-purple-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-rose-500",
];

export const LIST_COLOR_PALETTE: { name: string; value: string }[] = [
  { name: "Altın", value: "#B08D2B" },
  { name: "Yeşil", value: "#3E7B4F" },
  { name: "Lacivert", value: "#1E3A6E" },
  { name: "Mavi", value: "#2E5FA3" },
  { name: "Mor", value: "#6D4AA0" },
  { name: "Pembe", value: "#B0417E" },
];

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function getBoardStyle(board: { id: string; background?: string | null }): CSSProperties {
  if (board.background) return { backgroundColor: board.background };
  return { backgroundImage: BOARD_GRADIENTS[hash(board.id) % BOARD_GRADIENTS.length] };
}

export function getWorkspaceColor(workspaceId: string): string {
  return WORKSPACE_COLORS[hash(workspaceId) % WORKSPACE_COLORS.length];
}

export function getUserColor(userId: string): string {
  return USER_COLORS[hash(userId) % USER_COLORS.length];
}

export function getListColor(list: { id: string; color?: string | null }): string {
  return list.color || LIST_COLOR_PALETTE[hash(list.id) % LIST_COLOR_PALETTE.length].value;
}
