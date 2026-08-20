"use client";

import { useMutation } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { boardsApi } from "@/lib/api/boards";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";

export default function JoinBoardPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { status } = useAuth();
  const attempted = useRef(false);

  const join = useMutation({
    mutationFn: () => boardsApi.join(token),
    onSuccess: (result) => router.replace(`/boards/${result.board_id}`),
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?next=${encodeURIComponent(`/join/${token}`)}`);
      return;
    }
    if (status === "authenticated" && !attempted.current) {
      attempted.current = true;
      join.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#1d2125]">
      <div className="max-w-sm px-4 text-center">
        {join.isError ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            {join.error instanceof ApiError ? String(join.error.detail) : "Davet bağlantısı geçersiz ya da süresi dolmuş."}
          </p>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">Panoya katılıyorsunuz…</p>
        )}
      </div>
    </main>
  );
}
