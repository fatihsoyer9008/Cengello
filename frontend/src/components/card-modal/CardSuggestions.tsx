"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { cardsApi } from "@/lib/api/cards";

export function CardSuggestions({ cardId }: { cardId: string }) {
  const suggestions = useMutation({ mutationFn: () => cardsApi.suggestions(cardId) });

  return (
    <section className="rounded-lg border border-purple-200 bg-purple-50/50 p-4 dark:border-purple-400/20 dark:bg-purple-400/5" aria-label="Gemini önerileri" aria-busy={suggestions.isPending}>
      <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100"><Sparkles size={18} className="text-purple-500" />Gemini önerileri</h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Bu kart için uygulanabilir adımlar üretin. Kaydedilmiş başlık ve açıklama Google Gemini ile paylaşılır.</p>
      <button type="button" disabled={suggestions.isPending} onClick={() => suggestions.mutate()} className="mt-3 inline-flex items-center gap-2 rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:cursor-wait disabled:opacity-60">
        {suggestions.isPending && <Loader2 size={16} className="animate-spin" />}
        {suggestions.isPending ? "Öneriler hazırlanıyor…" : suggestions.data ? "Yeniden öneri al" : "Öneri al"}
      </button>
      {suggestions.error && <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">{suggestions.error instanceof Error ? suggestions.error.message : "Öneriler alınamadı. Tekrar deneyin."}</p>}
      {suggestions.data && !suggestions.isPending && !suggestions.error && (
        <div className="mt-4 space-y-3 text-sm text-gray-800 dark:text-gray-200" aria-live="polite">
          <p>{suggestions.data.summary}</p>
          <h4 className="font-semibold">Önerilen adımlar</h4>
          <ol className="list-decimal space-y-2 pl-5">{suggestions.data.steps.map((step, index) => <li key={index} className="break-words">{step}</li>)}</ol>
          {suggestions.data.considerations.length > 0 && <>
            <h4 className="font-semibold">Dikkat edilecekler</h4>
            <ul className="list-disc space-y-2 pl-5">{suggestions.data.considerations.map((item, index) => <li key={index} className="break-words">{item}</li>)}</ul>
          </>}
          <p className="text-xs text-gray-500 dark:text-gray-400">Yapay zekâ önerilerini uygulamadan önce kontrol edin. Kartınız otomatik değiştirilmez.</p>
        </div>
      )}
    </section>
  );
}
