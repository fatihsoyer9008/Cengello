"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";

import { useAuth } from "@/lib/auth/auth-context";

function AuthRedirectGuard() {
  const { status } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (status !== "authenticated") return;
    const next = searchParams.get("next");
    router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/workspaces");
  }, [status, router, searchParams]);

  return null;
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-gray-100">Cengello</h1>
        <Suspense fallback={null}>
          <AuthRedirectGuard />
        </Suspense>
        {children}
      </div>
    </main>
  );
}
