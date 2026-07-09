"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { conclusionSummaryCardCopy } from "@/lib/copy/stockDetail";

/**
 * 현재 결론 카드 — 종목 유형 + 한 줄 결론 + 좋은 점/확인할 점.
 * 상세 첫 화면의 주 판단 영역이므로 점수 배지보다 먼저 배치한다. 설계서 §6.3 / §15.
 */
export function ConclusionSummaryCard({
  type,
  summary,
  riskNote,
  suspect,
  strengths,
  warnings,
}: {
  type: string;
  summary: string;
  riskNote: string;
  suspect: boolean;
  strengths: string[];
  warnings: string[];
}) {
  const { locale } = useLanguage();
  const t = conclusionSummaryCardCopy[locale];
  const goodItems = strengths.length > 0 ? strengths : [t.strengthEmpty];
  const checkItems = warnings.length > 0 ? warnings : [t.warningEmpty];
  const visibleGoodItems = goodItems.slice(0, 1);
  const visibleCheckItems = checkItems.slice(0, 1);
  const extraGoodCount = Math.max(0, strengths.length - visibleGoodItems.length);
  const extraCheckCount = Math.max(0, warnings.length - visibleCheckItems.length);
  return (
    <div className="rounded-xl border border-blue-100 dark:border-blue-950 bg-white/95 dark:bg-zinc-950/70 p-3.5 md:p-5 shadow-sm">
      <div className="text-[11px] font-semibold uppercase text-blue-700 dark:text-blue-400">{t.title}</div>
      <div className="mt-1 text-xl md:text-3xl font-black text-zinc-950 dark:text-zinc-50 leading-tight break-keep">
        {suspect ? <span className="text-amber-600 dark:text-amber-400">{t.suspectPrefix}</span> : null}
        {type}
      </div>
      <p className="mt-1.5 text-xs md:text-[15px] text-zinc-700 dark:text-zinc-300 leading-relaxed">{summary}</p>

      <div className="mt-3 grid grid-cols-2 gap-1.5 md:gap-2">
        <div className="min-w-0 rounded-lg border border-emerald-100 dark:border-emerald-950 bg-emerald-50/60 dark:bg-emerald-950/20 px-2.5 py-2.5 md:px-3 md:py-3">
          <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">{t.goodPoints}</div>
          <ul className="space-y-1">
            {visibleGoodItems.map((item) => (
              <li key={item} className="flex items-start gap-1.5 text-[11px] md:text-xs leading-snug text-emerald-800 dark:text-emerald-200">
                <span aria-hidden="true" className="shrink-0">✓</span>
                <span>{item}</span>
              </li>
            ))}
            {extraGoodCount > 0 ? (
              <li className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80">{t.moreSignals(extraGoodCount)}</li>
            ) : null}
          </ul>
        </div>

        <div className="min-w-0 rounded-lg border border-amber-100 dark:border-amber-950 bg-amber-50/70 dark:bg-amber-950/20 px-2.5 py-2.5 md:px-3 md:py-3">
          <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 mb-1">{t.checkPoints}</div>
          <ul className="space-y-1">
            {visibleCheckItems.map((item) => (
              <li key={item} className="flex items-start gap-1.5 text-[11px] md:text-xs leading-snug text-amber-800 dark:text-amber-300">
                <span aria-hidden="true" className="shrink-0">!</span>
                <span>{item}</span>
              </li>
            ))}
            {extraCheckCount > 0 ? (
              <li className="text-[10px] text-amber-700/80 dark:text-amber-300/80">{t.moreSignals(extraCheckCount)}</li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-1.5 text-[11px] md:text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-2">
        <span aria-hidden="true" className="shrink-0">⚠</span>
        <span className="leading-snug"><strong className="font-semibold">{t.firstCheck}</strong> — {riskNote}</span>
      </div>
    </div>
  );
}
