"use client";

import * as RadixDialog from "@radix-ui/react-dialog";

import { CardAttachments } from "@/components/card-modal/CardAttachments";
import { CardChecklists } from "@/components/card-modal/CardChecklists";
import { CardCommentsAndActivity } from "@/components/card-modal/CardCommentsAndActivity";
import { CardCustomFields } from "@/components/card-modal/CardCustomFields";
import { CardDescription } from "@/components/card-modal/CardDescription";
import { CardDetailHeader } from "@/components/card-modal/CardDetailHeader";
import { CardDetailMeta } from "@/components/card-modal/CardDetailMeta";
import { useCard } from "@/hooks/useCardQueries";

export function CardDetailModal({ boardId, cardId, onClose }: { boardId: string; cardId: string; onClose: () => void }) {
  const { data: card, isLoading } = useCard(cardId);

  return (
    <RadixDialog.Root open onOpenChange={(open) => !open && onClose()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <RadixDialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-white p-6 shadow-xl focus:outline-none">
          <RadixDialog.Close asChild>
            <button
              aria-label="Close"
              className="absolute right-4 top-4 rounded p-1 text-lg leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              ×
            </button>
          </RadixDialog.Close>

          {isLoading || !card ? (
            <p className="py-10 text-center text-gray-500">Loading card…</p>
          ) : (
            <div className="space-y-6 pr-6">
              <RadixDialog.Title asChild>
                <CardDetailHeader boardId={boardId} card={card} />
              </RadixDialog.Title>
              <RadixDialog.Description className="sr-only">Card details</RadixDialog.Description>
              <CardDetailMeta boardId={boardId} card={card} />
              <CardDescription card={card} />
              <CardChecklists cardId={card.id} />
              <CardCustomFields boardId={boardId} cardId={card.id} />
              <CardAttachments boardId={boardId} card={card} />
              <CardCommentsAndActivity cardId={card.id} />
            </div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
