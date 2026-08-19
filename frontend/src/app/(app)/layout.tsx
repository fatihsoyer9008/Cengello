"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { TopNav } from "@/components/layout/TopNav";
import { useAuth } from "@/lib/auth/auth-context";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <TopNav />
      {children}
    </div>
  );
}
