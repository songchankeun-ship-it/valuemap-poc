"use client";

import Link from "next/link";
import { GitCompare } from "lucide-react";
import { StockCandidateCard, type StockCandidate } from "./StockCandidateCard";
import { useLanguage } from "@/components/LanguageProvider";
import { homeCopy } from "@/lib/copy/home";

export function TopCandidateSection({
  candidates,
  compareHref,
  strongCount,
}: {
  candidates: StockCandidate[];
  compareHref?: string;
  /** 종합 80+ 후보 수(시장 스냅샷과 동일 기준) — 대표 카드 수와의 관계 문구용. */
  strongCount: number;
}) {
  const { locale } = useLanguage();
  const t = homeCopy[locale].topCandidate;
  return (
    <section id="today-candidates" className="scroll-mt-20">
      <div className="mb-2">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex text-[10px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded px-1.5 py-0.5 whitespace-nowrap tabular-nums">
              1 · {t.stepEyebrow}
            </span>
            <h2 className="mt-1.5 text-[19px] md:text-2xl font-black text-zinc-950 dark:text-zinc-50">
              {t.heading}
            </h2>
            {candidates.length > 0 ? (
              <p className="mt-1 text-[12px] md:text-[13px] text-zinc-500 dark:text-zinc-400 leading-snug">
                {t.poolRelation(strongCount, candidates.length)}
              </p>
            ) : null}
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 text-right">
              {t.tag}
            </span>
            {compareHref ? (
              <Link
                prefetch={false}
                href={compareHref}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/30 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:border-blue-400 dark:hover:border-blue-700 transition"
              >
                <GitCompare className="h-3.5 w-3.5" aria-hidden="true" />
                {t.compareToday}
              </Link>
            ) : null}
          </div>
        </div>
        <p className="hidden sm:block mt-1 text-xs md:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {t.intro}
        </p>
        {compareHref ? (
          <Link
            prefetch={false}
            href={compareHref}
            className="sm:hidden mt-2 inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-md border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/30 px-3 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:border-blue-400 dark:hover:border-blue-700 transition"
          >
            <GitCompare className="h-3.5 w-3.5" aria-hidden="true" />
            {t.compareToday}
          </Link>
        ) : null}
      </div>

      {candidates.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 items-stretch">
          {candidates.map((c, index) => (
            <StockCandidateCard key={c.ticker} c={c} featured={index === 0} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          {t.empty}
        </div>
      )}

      {candidates.length > 0 ? (
        <div className="mt-4 border-y border-zinc-200 dark:border-zinc-800 py-3">
          <div className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 mb-2">{t.guide.heading}</div>
          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-zinc-200 sm:dark:divide-zinc-800">
            {t.guide.steps.map((step, index) => (
              <li key={step.title} className="flex items-start gap-2 sm:px-3 first:pl-0 last:pr-0">
                <span className="inline-flex items-center justify-center w-5 h-5 text-blue-700 dark:text-blue-300 text-[11px] font-bold shrink-0 tabular-nums">{index + 1}</span>
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-100">{step.title}</div>
                  <div className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">{step.body}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed">
        {t.footer}
      </p>
    </section>
  );
}
