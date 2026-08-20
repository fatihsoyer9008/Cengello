import type { ActivityLogEntry } from "@/types/activity";
import type { BoardList } from "@/types/list";

function listName(id: unknown, listsById: Map<string, BoardList>): string {
  return (typeof id === "string" && listsById.get(id)?.name) || "bir liste";
}

export function formatActivityText(entry: ActivityLogEntry, listsById: Map<string, BoardList>): string {
  switch (entry.action_type) {
    case "card.created":
      return `bu kartı ${listName(entry.payload.list_id, listsById)} listesine ekledi`;
    case "card.moved":
      return `bu kartı ${listName(entry.payload.from_list_id, listsById)} listesinden ${listName(entry.payload.to_list_id, listsById)} listesine taşıdı`;
    case "card.member_assigned":
      return "bu karta bir üye atadı";
    case "card.label_added":
      return "bu karta bir etiket ekledi";
    case "checklist.completed":
      return "bir kontrol listesini tamamladı";
    case "attachment.added":
      return "bir dosya ekledi";
    case "comment.created":
      return "yorum yaptı";
    default:
      if (entry.action_type.startsWith("automation.")) return "otomasyon bu kartı güncelledi";
      return entry.action_type;
  }
}

export function formatActivityTimestamp(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
