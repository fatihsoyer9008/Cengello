"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { slug: "labels", label: "Labels" },
  { slug: "custom-fields", label: "Custom fields" },
  { slug: "members", label: "Members" },
  { slug: "automation", label: "Automation" },
  { slug: "templates", label: "Templates" },
];

export function BoardSettingsNav({ boardId }: { boardId: string }) {
  const pathname = usePathname();
  return (
    <div className="mb-4 flex items-center gap-4 border-b border-gray-200 dark:border-gray-700">
      <Link href={`/boards/${boardId}`} className="pb-2 text-sm text-gray-500 hover:underline dark:text-gray-400">
        ← Board
      </Link>
      {TABS.map((tab) => {
        const href = `/boards/${boardId}/settings/${tab.slug}`;
        const active = pathname === href;
        return (
          <Link
            key={tab.slug}
            href={href}
            className={`border-b-2 pb-2 text-sm font-medium ${
              active
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
