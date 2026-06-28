"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { conclusionSummaryCardCopy } from "@/lib/copy/stockDetail";

/**
 * 현재 결론 카드 — 종목 유형 + 한 줄 결론 + 주의점.
 * 강점과 주의를 함께 설명하되 향후 가격 방향을 단정하지 않음. 설계서 §6.3 / §15.
 */
export function ConclusionSummaryCard({
  type,
  summary,
  riskNote,
  suspect,
}: {
  type: string;
  summary: string;
  riskNote: string;
  suspect: boolean;
}) {
  const { locale } = useLanguage();
  const t = conclusionSummaryCardCopy[locale];
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 md:p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t.title}</div>
      <div className="mt-1 text-base md:text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
        {suspect ? <span className="text-amber-600 dark:text-amber-400">{t.suspectPrefix}</span> : null}
        {type}
      </div>
      <p className="mt-1.5 text-xs md:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{summary}</p>
      <div className="mt-2 flex items-start gap-1.5 text-[11px] md:text-xs text-amber-800 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-md px-2.5 py-1.5">
        <span aria-hidden="true" className="shrink-0">⚠</span>
        <span className="leading-snug">{riskNote}</span>
      </div>
    </div>
  );
}
