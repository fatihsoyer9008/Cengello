"use client";

import { useParams } from "next/navigation";

import { AutomationRuleEditor } from "@/components/admin/AutomationRuleEditor";
import { BoardSettingsNav } from "@/components/admin/BoardSettingsNav";
import { AppShell } from "@/components/layout/AppShell";

export default function AutomationSettingsPage() {
  const { boardId } = useParams<{ boardId: string }>();
  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <BoardSettingsNav boardId={boardId} />
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Automation rules</h2>
        <AutomationRuleEditor boardId={boardId} />
      </main>
    </AppShell>
  );
}
