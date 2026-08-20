"use client";

import * as RadixDialog from "@radix-ui/react-dialog";

import { CardAttachments } from "@/components/card-modal/CardAttachments";
import { CardChecklists } from "@/components/card-modal/CardChecklists";
import { CardCommentsAndActivity } from "@/components/card-modal/CardCommentsAndActivity";
import { CardCustomFields } from "@/components/card-modal/CardCustomFields";
import { CardDescription } from "@/components/card-modal/CardDescription";
import { CardDetailHeader } from "@/components/card-modal/CardDetailHeader";
import { CardDetailMeta } from "@/components/card-modal/CardDetailMeta";
import { CardModalTopBar } from "@/components/card-modal/CardModalTopBar";
import { CardQuickActions } from "@/components/card-modal/CardQuickActions";
import { useCard } from "@/hooks/useCardQueries";

export function CardDetailModal({ boardId, cardId, onClose }: { boardId: string; cardId: string; onClose: () => void }) {
  const { data: card, isLoading } = useCard(cardId);

  return (
    <RadixDialog.Root open onOpenChange={(open) => !open && onClose()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <RadixDialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg bg-white shadow-xl focus:outline-none dark:bg-[#22272b]">
          {isLoading || !card ? (
            <p className="py-10 text-center text-gray-500 dark:text-gray-400">Kart yükleniyor…</p>
          ) : (
            <>
              <CardModalTopBar boardId={boardId} card={card} onClose={onClose} />

              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 px-5 py-5 md:grid-cols-[65fr_1px_35fr]">
                  <div className="min-w-0 space-y-6">
                    <RadixDialog.Title asChild>
                      <CardDetailHeader boardId={boardId} card={card} />
                    </RadixDialog.Title>
                    <RadixDialog.Description className="sr-only">Kart detayları</RadixDialog.Description>

                    <CardQuickActions boardId={boardId} card={card} />
                    <CardDetailMeta boardId={boardId} card={card} />
                    <CardDescription card={card} />
                    <CardChecklists cardId={card.id} />
                    <CardCustomFields boardId={boardId} cardId={card.id} />
                    <CardAttachments boardId={boardId} card={card} />
                  </div>

                  <div className="hidden bg-gray-200 dark:bg-white/10 md:block" />

                  <div className="min-w-0">
                    <CardCommentsAndActivity boardId={boardId} cardId={card.id} />
                  </div>
                </div>
              </div>
            </>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
