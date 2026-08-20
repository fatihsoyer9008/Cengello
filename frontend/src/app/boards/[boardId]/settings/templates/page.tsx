"use client";

import { useParams } from "next/navigation";

import { BoardSettingsNav } from "@/components/admin/BoardSettingsNav";
import { TemplatesPanel } from "@/components/admin/TemplatesPanel";
import { AppShell } from "@/components/layout/AppShell";

export default function TemplatesSettingsPage() {
  const { boardId } = useParams<{ boardId: string }>();
  return (
    <AppShell boardId={boardId} title="Board settings">
      <main className="mx-auto max-w-3xl px-4 py-6">
        <BoardSettingsNav boardId={boardId} />
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Templates</h2>
        <TemplatesPanel boardId={boardId} />
      </main>
    </AppShell>
  );
}
