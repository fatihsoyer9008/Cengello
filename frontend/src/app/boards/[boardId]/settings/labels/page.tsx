"use client";

import { useParams } from "next/navigation";

import { BoardSettingsNav } from "@/components/admin/BoardSettingsNav";
import { LabelsManager } from "@/components/admin/LabelsManager";
import { AppShell } from "@/components/layout/AppShell";

export default function LabelsSettingsPage() {
  const { boardId } = useParams<{ boardId: string }>();
  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <BoardSettingsNav boardId={boardId} />
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Labels</h2>
        <LabelsManager boardId={boardId} />
      </main>
    </AppShell>
  );
}
