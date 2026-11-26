"use client";

import { StockCandidateCard, type StockCandidate } from "@/components/home/StockCandidateCard";
import { useLanguage } from "@/components/LanguageProvider";
import { todayCopy } from "@/lib/copy/today";

export function TodayTopSection({ candidates }: { candidates: StockCandidate[] }) {
  const { locale } = useLanguage();
  const t = todayCopy[locale];
  return (
    <section id="today-top3" className="scroll-mt-20">
      <div className="research-band-heading">
        <h2>{t.top3Title}</h2>
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{t.top3Caption}</span>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 leading-relaxed">
        {t.top3Desc}
      </p>

      {candidates.length > 0 ? (
        <div className="research-today-shortlist">
          {candidates.map((c) => (
            <StockCandidateCard key={c.ticker} c={c} row />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          {t.top3Empty}
        </div>
      )}
    </section>
  );
}
