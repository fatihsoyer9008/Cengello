"use client";

import { useEffect } from "react";

import { buildFaviconDataUrl, DEFAULT_FAVICON_PATH } from "@/lib/favicon";

/** Swaps the browser tab's favicon to match the current board's accent color while mounted. */
export function BoardFavicon({ color }: { color: string }) {
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link) link.href = buildFaviconDataUrl(color);
  }, [color]);

  // Separate effect (empty deps) so its cleanup runs only once, when the board view is actually
  // left -- not on every color change while still on a board.
  useEffect(() => {
    return () => {
      const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (link) link.href = DEFAULT_FAVICON_PATH;
    };
  }, []);

  return null;
}
