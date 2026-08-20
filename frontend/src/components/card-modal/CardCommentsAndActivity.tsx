"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Smile } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { useCardActivity, useCardComments } from "@/hooks/useCardQueries";
import { formatActivityText, formatActivityTimestamp } from "@/lib/activity-format";
import { boardsApi } from "@/lib/api/boards";
import { commentsApi } from "@/lib/api/comments";
import { usersApi } from "@/lib/api/users";
import { useAuth } from "@/lib/auth/auth-context";
import { getUserColor } from "@/lib/board-theme";
import { Markdown } from "@/lib/markdown";
import type { Comment } from "@/types/comment";

function initials(fullName: string): string {
  return fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type FeedEntry =
  | { kind: "comment"; id: string; createdAt: string; comment: Comment }
  | { kind: "activity"; id: string; createdAt: string; actorId: string | null; text: string };

function CommentBlock({
  boardId,
  cardId,
  comment,
  authorName,
  colorClass,
}: {
  boardId: string;
  cardId: string;
  comment: Comment;
  authorName: string;
  colorClass: string;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(comment.body);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["cards", cardId, "comments"] });
    queryClient.invalidateQueries({ queryKey: ["cards", cardId, "activity"] });
    queryClient.invalidateQueries({ queryKey: ["boards", boardId, "cards"] });
  };

  const updateComment = useMutation({
    mutationFn: () => commentsApi.update(comment.id, { body }),
    onSuccess: () => {
      invalidate();
      setEditing(false);
    },
  });

  const deleteComment = useMutation({
    mutationFn: () => commentsApi.remove(comment.id),
    onSuccess: invalidate,
  });

  const isAuthor = user?.id === comment.author_id;

  return (
    <li className="flex gap-2.5">
      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${colorClass}`}>
        {initials(authorName)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-bold uppercase text-gray-800 dark:text-gray-100">{authorName}</span>{" "}
          <span className="text-xs font-medium text-gray-400 hover:underline dark:text-gray-500">
            {formatActivityTimestamp(comment.created_at)}
            {comment.is_edited && " (düzenlendi)"}
          </span>
        </p>

        {editing ? (
          <div className="mt-1.5 space-y-2">
            <textarea
              autoFocus
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-brand focus:outline-none dark:border-white/20 dark:bg-white/10 dark:text-gray-100"
            />
            <div className="flex gap-2">
              <Button onClick={() => updateComment.mutate()} disabled={updateComment.isPending || !body.trim()}>
                Kaydet
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>
                İptal
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-1.5 rounded-lg bg-gray-100 p-3 dark:bg-white/5">
              <Markdown>{comment.body}</Markdown>
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
              <button className="hover:text-gray-600 dark:hover:text-gray-300" title="Tepki ekle (yakında)">
                <Smile className="h-3.5 w-3.5" />
              </button>
              {isAuthor && (
                <>
                  <button onClick={() => setEditing(true)} className="hover:text-gray-600 dark:hover:text-gray-300">
                    Düzenle
                  </button>
                  <button
                    onClick={(e) => {
                      e.currentTarget.blur();
                      deleteComment.mutate();
                    }}
                    className="hover:text-red-600 dark:hover:text-red-400"
                  >
                    Sil
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </li>
  );
}

export function CardCommentsAndActivity({ boardId, cardId }: { boardId: string; cardId: string }) {
  const [showDetails, setShowDetails] = useState(false);
  const [body, setBody] = useState("");
  const queryClient = useQueryClient();

  const { data: comments } = useCardComments(cardId);
  const { data: activity } = useCardActivity(cardId, showDetails);
  const { data: lists } = useQuery({ queryKey: ["boards", boardId, "lists"], queryFn: () => boardsApi.lists(boardId) });
  const { data: members } = useQuery({ queryKey: ["boards", boardId, "members"], queryFn: () => boardsApi.members(boardId) });

  const memberIds = members?.map((m) => m.user_id) ?? [];
  const { data: users } = useQuery({
    queryKey: ["boards", boardId, "member-users", memberIds],
    queryFn: () => Promise.all(memberIds.map((id) => usersApi.get(id))),
    enabled: memberIds.length > 0,
  });

  const usersById = new Map((users ?? []).map((u) => [u.id, u]));
  const listsById = new Map((lists ?? []).map((l) => [l.id, l]));

  const createComment = useMutation({
    mutationFn: () => commentsApi.create({ body, card_id: cardId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", cardId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["cards", cardId, "activity"] });
      queryClient.invalidateQueries({ queryKey: ["boards", boardId, "cards"] });
      setBody("");
    },
  });

  const feed: FeedEntry[] = [
    ...(comments ?? []).map((c): FeedEntry => ({ kind: "comment", id: c.id, createdAt: c.created_at, comment: c })),
    ...(showDetails ? activity ?? [] : [])
      .filter((entry) => entry.action_type !== "comment.created")
      .map((entry): FeedEntry => ({ kind: "activity", id: entry.id, createdAt: entry.created_at, actorId: entry.actor_id, text: formatActivityText(entry, listsById) })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
          <MessageSquare className="h-4 w-4" />
          Yorumlar ve etkinlik
        </div>
        <button
          onClick={() => setShowDetails((v) => !v)}
          className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/20"
        >
          {showDetails ? "Detayları Gizle" : "Detayları Göster"}
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (body.trim()) createComment.mutate();
        }}
        className="mb-4"
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Yorum yaz…"
          className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-brand focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
        />
        {body.trim() && (
          <Button type="submit" disabled={createComment.isPending} className="mt-2">
            Yorum yap
          </Button>
        )}
      </form>

      <ul className="space-y-4">
        {feed.map((entry) =>
          entry.kind === "comment" ? (
            <CommentBlock
              key={entry.id}
              boardId={boardId}
              cardId={cardId}
              comment={entry.comment}
              authorName={usersById.get(entry.comment.author_id)?.full_name ?? "Bilinmeyen kullanıcı"}
              colorClass={getUserColor(entry.comment.author_id)}
            />
          ) : (
            <li key={entry.id} className="flex gap-2.5">
              {entry.actorId && usersById.get(entry.actorId) ? (
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${getUserColor(entry.actorId)}`}
                >
                  {initials(usersById.get(entry.actorId)!.full_name)}
                </span>
              ) : (
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-400 text-xs font-bold text-white dark:bg-gray-600">
                  ?
                </span>
              )}
              <p className="pt-1 text-sm text-gray-600 dark:text-gray-300">
                <span className="font-bold uppercase text-gray-800 dark:text-gray-100">
                  {(entry.actorId && usersById.get(entry.actorId)?.full_name) || "Bilinmeyen kullanıcı"}
                </span>{" "}
                {entry.text}
                <br />
                <span className="text-xs font-medium text-gray-400 hover:underline dark:text-gray-500">
                  {formatActivityTimestamp(entry.createdAt)}
                </span>
              </p>
            </li>
          )
        )}
        {feed.length === 0 && <li className="text-sm text-gray-400 dark:text-gray-500">Henüz yorum veya etkinlik yok.</li>}
      </ul>
    </div>
  );
}
