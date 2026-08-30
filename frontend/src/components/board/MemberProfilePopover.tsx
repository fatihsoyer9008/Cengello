"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { Popover } from "@/components/ui/Popover";
import { boardsApi } from "@/lib/api/boards";
import { describeActivity } from "@/lib/activity-labels";
import { getUserColor } from "@/lib/board-theme";
import type { BoardMember, BoardRole } from "@/types/board";
import type { User } from "@/types/user";

const ROLE_LABELS: Record<BoardRole, string> = { admin: "Yönetici", member: "Üye", viewer: "İzleyici" };

function initials(fullName: string): string {
  return fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function MemberProfilePopover({
  boardId,
  member,
  user,
  ownerId,
  trigger,
}: {
  boardId: string;
  member: BoardMember;
  user: User | undefined;
  ownerId: string;
  trigger: ReactNode;
}) {
  const queryClient = useQueryClient();
  const [showActivity, setShowActivity] = useState(false);
  const isOwner = member.user_id === ownerId;

  const invalidateMembers = () => queryClient.invalidateQueries({ queryKey: ["boards", boardId, "members"] });

  const updateRole = useMutation({
    mutationFn: (role: BoardRole) => boardsApi.updateMember(boardId, member.id, { role }),
    onSuccess: invalidateMembers,
  });

  const removeMember = useMutation({
    mutationFn: () => boardsApi.removeMember(boardId, member.id),
    onSuccess: invalidateMembers,
  });

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ["boards", boardId, "activity", "actor", member.user_id],
    queryFn: () => boardsApi.activity(boardId, { actorId: member.user_id, limit: 20 }),
    enabled: showActivity,
  });

  return (
    <Popover trigger={trigger}>
      <div className="flex items-center gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold text-white ${getUserColor(member.user_id)}`}
        >
          {user ? initials(user.full_name) : "?"}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.full_name ?? "Bilinmeyen kullanıcı"}</p>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
        </div>
      </div>

      <div className="mt-3 border-t border-gray-200 pt-3 dark:border-white/10">
        {isOwner ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">Pano sahibi</p>
        ) : (
          <>
            <label className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400">Rol</label>
            <select
              value={member.role}
              onChange={(e) => updateRole.mutate(e.target.value as BoardRole)}
              className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              {(Object.keys(ROLE_LABELS) as BoardRole[]).map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowActivity((s) => !s)}
        className="mt-3 w-full rounded px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
      >
        Üyenin pano hareketlerini gör
      </button>
      {showActivity && (
        <div className="mt-1 max-h-48 space-y-1.5 overflow-y-auto rounded bg-gray-50 p-2 text-xs text-gray-600 dark:bg-white/5 dark:text-gray-300">
          {activityLoading ? (
            <p>Yükleniyor…</p>
          ) : !activity || activity.length === 0 ? (
            <p>Henüz bir hareket yok.</p>
          ) : (
            activity.map((entry) => (
              <p key={entry.id}>
                {describeActivity(entry)} <span className="text-gray-400 dark:text-gray-500">· {new Date(entry.created_at).toLocaleString("tr-TR")}</span>
              </p>
            ))
          )}
        </div>
      )}

      {!isOwner && (
        <button
          type="button"
          onClick={() => removeMember.mutate()}
          className="mt-3 w-full rounded px-2 py-1.5 text-left text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-white/10"
        >
          Panodan çıkar
        </button>
      )}
    </Popover>
  );
}
