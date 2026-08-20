"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/lib/auth/auth-context";

export default function Home() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/workspaces");
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-gray-500 dark:text-gray-400">Loading…</p>
    </main>
  );
}
