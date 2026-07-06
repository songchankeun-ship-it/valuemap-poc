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
  return (
    <div className="rounded-xl border border-blue-100 dark:border-blue-950 bg-white dark:bg-zinc-900 p-4 md:p-5 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">{t.title}</div>
      <div className="mt-1 text-lg md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 leading-snug break-keep">
        {suspect ? <span className="text-amber-600 dark:text-amber-400">{t.suspectPrefix}</span> : null}
        {type}
      </div>
      <p className="mt-1.5 text-xs md:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{summary}</p>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <div className="rounded-lg border border-emerald-100 dark:border-emerald-950 bg-emerald-50/60 dark:bg-emerald-950/20 px-3 py-2.5">
          <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5">{t.goodPoints}</div>
          <ul className="space-y-1">
            {goodItems.map((item) => (
              <li key={item} className="flex items-start gap-1.5 text-xs leading-snug text-emerald-800 dark:text-emerald-200">
                <span aria-hidden="true" className="shrink-0">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-amber-100 dark:border-amber-950 bg-amber-50/70 dark:bg-amber-950/20 px-3 py-2.5">
          <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 mb-1.5">{t.checkPoints}</div>
          <ul className="space-y-1">
            {checkItems.map((item) => (
              <li key={item} className="flex items-start gap-1.5 text-xs leading-snug text-amber-800 dark:text-amber-300">
                <span aria-hidden="true" className="shrink-0">!</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-1.5 text-[11px] md:text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-2">
        <span aria-hidden="true" className="shrink-0">⚠</span>
        <span className="leading-snug"><strong className="font-semibold">{t.firstCheck}</strong> — {riskNote}</span>
      </div>
    </div>
  );
}
