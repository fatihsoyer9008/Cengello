import type { ActivityLogEntry } from "@/types/activity";

const ACTION_LABELS: Record<string, string> = {
  "card.created": "bir kart oluşturdu",
  "card.moved": "bir kartı taşıdı",
  "card.label_added": "bir karta etiket ekledi",
  "card.member_assigned": "bir karta üye atadı",
  "list.created": "bir liste oluşturdu",
  "list.moved": "bir listeyi taşıdı",
  "checklist.completed": "bir kontrol listesini tamamladı",
  "comment.created": "bir yorum yaptı",
  "attachment.added": "bir dosya ekledi",
};

export function describeActivity(entry: ActivityLogEntry): string {
  return ACTION_LABELS[entry.action_type] ?? entry.action_type;
}
