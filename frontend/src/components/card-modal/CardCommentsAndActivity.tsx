"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { useCardActivity, useCardComments } from "@/hooks/useCardQueries";
import { commentsApi } from "@/lib/api/comments";
import { Markdown } from "@/lib/markdown";

function CommentsPanel({ cardId }: { cardId: string }) {
  const { data: comments } = useCardComments(cardId);
  const [body, setBody] = useState("");
  const queryClient = useQueryClient();

  const createComment = useMutation({
    mutationFn: () => commentsApi.create({ body, card_id: cardId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", cardId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["cards", cardId, "activity"] });
      setBody("");
    },
  });

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (body.trim()) createComment.mutate();
        }}
        className="space-y-2"
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Write a comment…"
          className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <Button type="submit" disabled={createComment.isPending || !body.trim()}>
          Comment
        </Button>
      </form>
      <ul className="space-y-3">
        {comments?.map((comment) => (
          <li key={comment.id} className="rounded-md bg-gray-50 p-2.5">
            <Markdown>{comment.body}</Markdown>
            <p className="mt-1 text-xs text-gray-400">
              {new Date(comment.created_at).toLocaleString()}
              {comment.is_edited && " (edited)"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActivityPanel({ cardId, enabled }: { cardId: string; enabled: boolean }) {
  const { data: activity } = useCardActivity(cardId, enabled);
  return (
    <ul className="space-y-2">
      {activity?.map((entry) => (
        <li key={entry.id} className="text-xs text-gray-500">
          <span className="font-medium text-gray-700">{entry.action_type}</span>
          {entry.automation_rule_id && <span className="ml-1 text-purple-600">(automation)</span>}
          <span className="ml-2">{new Date(entry.created_at).toLocaleString()}</span>
        </li>
      ))}
      {activity?.length === 0 && <li className="text-xs text-gray-400">No activity yet.</li>}
    </ul>
  );
}

export function CardCommentsAndActivity({ cardId }: { cardId: string }) {
  const [tab, setTab] = useState("comments");

  return (
    <Tabs
      value={tab}
      onValueChange={setTab}
      defaultValue="comments"
      items={[
        { value: "comments", label: "Comments", content: <CommentsPanel cardId={cardId} /> },
        { value: "activity", label: "Activity", content: <ActivityPanel cardId={cardId} enabled={tab === "activity"} /> },
      ]}
    />
  );
}
