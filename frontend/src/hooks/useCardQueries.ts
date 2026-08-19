import { useQuery } from "@tanstack/react-query";

import { attachmentsApi } from "@/lib/api/attachments";
import { cardsApi } from "@/lib/api/cards";
import { checklistsApi } from "@/lib/api/checklists";
import { commentsApi } from "@/lib/api/comments";
import { customFieldsApi } from "@/lib/api/customFields";

export function useCard(cardId: string) {
  return useQuery({ queryKey: ["cards", cardId], queryFn: () => cardsApi.get(cardId), enabled: !!cardId });
}

export function useCardChecklists(cardId: string) {
  return useQuery({
    queryKey: ["cards", cardId, "checklists"],
    queryFn: () => checklistsApi.listForCard(cardId),
    enabled: !!cardId,
  });
}

export function useCardLabels(cardId: string) {
  return useQuery({ queryKey: ["cards", cardId, "labels"], queryFn: () => cardsApi.labels(cardId), enabled: !!cardId });
}

export function useCardMembers(cardId: string) {
  return useQuery({ queryKey: ["cards", cardId, "members"], queryFn: () => cardsApi.members(cardId), enabled: !!cardId });
}

export function useCardCustomFieldValues(cardId: string) {
  return useQuery({
    queryKey: ["cards", cardId, "custom-field-values"],
    queryFn: () => customFieldsApi.valuesForCard(cardId),
    enabled: !!cardId,
  });
}

export function useCardAttachments(cardId: string) {
  return useQuery({
    queryKey: ["cards", cardId, "attachments"],
    queryFn: () => attachmentsApi.listForCard(cardId),
    enabled: !!cardId,
  });
}

export function useCardComments(cardId: string) {
  return useQuery({
    queryKey: ["cards", cardId, "comments"],
    queryFn: () => commentsApi.listForCard(cardId),
    enabled: !!cardId,
  });
}

export function useCardActivity(cardId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["cards", cardId, "activity"],
    queryFn: () => cardsApi.activity(cardId),
    enabled: enabled && !!cardId,
  });
}
