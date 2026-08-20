"use client";

import type { ReactNode } from "react";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export function AppShell({
  workspaceId,
  boardId,
  title,
  children,
}: {
  workspaceId?: string;
  boardId?: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar workspaceId={workspaceId} boardId={boardId} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={title} />
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
