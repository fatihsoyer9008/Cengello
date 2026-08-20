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
  { name: "Yeşil", value: "#1F845A" },
  { name: "Altın", value: "#946F00" },
  { name: "Turuncu", value: "#C25100" },
  { name: "Kırmızı", value: "#AE2E24" },
  { name: "Mor", value: "#6E5DC6" },
  { name: "Mavi", value: "#0C66E4" },
  { name: "Gök Mavisi", value: "#227D9B" },
  { name: "Zeytin Yeşili", value: "#4C6B1F" },
  { name: "Pembe", value: "#943D73" },
  { name: "Gri", value: "#626F86" },
];

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export interface BoardBackgroundOption {
  id: string;
  name: string;
  type: "image" | "gradient";
  /** Full-resolution value persisted to board.background and used for the real board canvas. */
  value: string;
  /** Lightweight variant used for the picker thumbnail so the grid stays fast to load. */
  thumb: string;
}

function unsplashThumb(baseUrl: string): string {
  return `${baseUrl}?w=300&q=70&fit=crop&auto=format`;
}

const BOARD_IMAGE_BASE = {
  lake: "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1",
  purple: "https://images.unsplash.com/photo-1557682250-33bd709cbe85",
  space: "https://images.unsplash.com/photo-1464802686167-b939a6910659",
  rain: "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee",
};

export const BOARD_BACKGROUND_OPTIONS: BoardBackgroundOption[] = [
  {
    id: "lake",
    name: "Doğa / Göl",
    type: "image",
    value: `${BOARD_IMAGE_BASE.lake}?w=1920&q=100`,
    thumb: unsplashThumb(BOARD_IMAGE_BASE.lake),
  },
  {
    id: "purple-abstract",
    name: "Soyut Mor/Pembe",
    type: "image",
    value: `${BOARD_IMAGE_BASE.purple}?w=1920&q=100`,
    thumb: unsplashThumb(BOARD_IMAGE_BASE.purple),
  },
  {
    id: "space",
    name: "Uzay / Yıldızlar",
    type: "image",
    value: `${BOARD_IMAGE_BASE.space}?w=1920&q=100`,
    thumb: unsplashThumb(BOARD_IMAGE_BASE.space),
  },
  {
    id: "rain",
    name: "Minimalist Yağmur",
    type: "image",
    value: `${BOARD_IMAGE_BASE.rain}?w=1920&q=100`,
    thumb: unsplashThumb(BOARD_IMAGE_BASE.rain),
  },
  {
    id: "blue-gradient",
    name: "Mavi gradyan",
    type: "gradient",
    value: "linear-gradient(135deg, #0C66E4 0%, #1E3A6E 100%)",
    thumb: "linear-gradient(135deg, #0C66E4 0%, #1E3A6E 100%)",
  },
  {
    id: "purple-gradient",
    name: "Mor gradyan",
    type: "gradient",
    value: "linear-gradient(135deg, #6E5DC6 0%, #2E1065 100%)",
    thumb: "linear-gradient(135deg, #6E5DC6 0%, #2E1065 100%)",
  },
];

export function getBoardStyle(board: { id: string; background?: string | null }): CSSProperties {
  const bg = board.background;
  if (bg) {
    if (bg.startsWith("http")) return { backgroundImage: `url(${bg})`, backgroundSize: "cover", backgroundPosition: "center" };
    if (bg.startsWith("linear-gradient") || bg.startsWith("radial-gradient")) return { backgroundImage: bg, backgroundSize: "cover" };
    return { backgroundColor: bg };
  }
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
