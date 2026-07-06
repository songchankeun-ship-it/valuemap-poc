"use client";

import { StockCandidateCard, type StockCandidate } from "./StockCandidateCard";
import { useLanguage } from "@/components/LanguageProvider";
import { homeCopy } from "@/lib/copy/home";

export function TopCandidateSection({ candidates }: { candidates: StockCandidate[] }) {
  const { locale } = useLanguage();
  const t = homeCopy[locale].topCandidate;
  const [featured, ...rest] = candidates;

  return (
    <section id="today-candidates" className="scroll-mt-20">
      <div className="mb-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-4 md:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex text-[10px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded px-1.5 py-0.5 whitespace-nowrap tabular-nums">
              2 / {t.stepEyebrow}
            </span>
            <h2 className="mt-2 text-xl md:text-2xl font-black text-zinc-950 dark:text-zinc-50">
              {t.heading}
            </h2>
            <p className="mt-1 text-xs md:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {t.intro}
            </p>
          </div>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 text-right shrink-0">
            {t.tag}
          </span>
        </div>
        <p className="mt-3 border-t border-zinc-100 dark:border-zinc-800 pt-3 text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
          {t.rankCriteria}
        </p>
      </div>

      {candidates.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] gap-3 items-start">
          {featured ? <StockCandidateCard key={featured.ticker} c={featured} featured /> : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            {rest.map((c) => (
              <StockCandidateCard key={c.ticker} c={c} />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          {t.empty}
        </div>
      )}

      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed">
        {t.footer}
      </p>
    </section>
  );
}
