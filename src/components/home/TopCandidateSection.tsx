"use client";

import { StockCandidateCard, type StockCandidate } from "./StockCandidateCard";
import { useLanguage } from "@/components/LanguageProvider";
import { homeCopy } from "@/lib/copy/home";

// 오늘 추가 확인 후보 섹션 — 홈에서 가장 중요한 영역.
export function TopCandidateSection({ candidates }: { candidates: StockCandidate[] }) {
  const { locale } = useLanguage();
  const t = homeCopy[locale].topCandidate;
  return (
    <section id="today-candidates" className="scroll-mt-20">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{t.heading}</h2>
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{t.tag}</span>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 leading-relaxed">
        {t.intro}
      </p>

      {candidates.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {candidates.map((c) => (
            <StockCandidateCard key={c.ticker} c={c} />
          ))}
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
