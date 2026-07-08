"use client";

import Link from "next/link";
import { GitCompare } from "lucide-react";
import { StockCandidateCard, type StockCandidate } from "./StockCandidateCard";
import { useLanguage } from "@/components/LanguageProvider";
import { homeCopy } from "@/lib/copy/home";

export function TopCandidateSection({ candidates, compareHref }: { candidates: StockCandidate[]; compareHref?: string }) {
  const { locale } = useLanguage();
  const t = homeCopy[locale].topCandidate;
  const [featured, ...rest] = candidates;

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
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 text-right">
              {t.tag}
            </span>
            {compareHref ? (
              <Link
                prefetch={false}
                href={compareHref}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/30 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:border-blue-400 dark:hover:border-blue-700 transition"
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
            className="sm:hidden mt-2 inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/30 px-3 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:border-blue-400 dark:hover:border-blue-700 transition"
          >
            <GitCompare className="h-3.5 w-3.5" aria-hidden="true" />
            {t.compareToday}
          </Link>
        ) : null}
      </div>

      {candidates.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)] gap-3 items-start">
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

      {candidates.length > 0 ? (
        <div className="mt-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 px-3 py-3">
          <div className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 mb-2">{t.guide.heading}</div>
          <ol className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {t.guide.steps.map((step, index) => (
              <li key={step.title} className="flex items-start gap-2 rounded-lg bg-white dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 px-2.5 py-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold shrink-0 tabular-nums">{index + 1}</span>
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
