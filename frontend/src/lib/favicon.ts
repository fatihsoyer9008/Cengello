/** Builds a data-URI favicon: a rounded-square "C" monogram in the given accent color. */
export function buildFaviconDataUrl(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${color}"/><text x="32" y="45" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="700" fill="#ffffff" text-anchor="middle">C</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const DEFAULT_FAVICON_PATH = "/icon.svg";
