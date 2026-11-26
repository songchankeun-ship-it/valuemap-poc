"use client";

import Link from "next/link";
import { GitCompare } from "lucide-react";
import { StockCandidateCard, type StockCandidate } from "./StockCandidateCard";
import { useLanguage } from "@/components/LanguageProvider";
import { homeCopy } from "@/lib/copy/home";

export function TopCandidateSection({
  candidates,
  compareHref,
}: {
  candidates: StockCandidate[];
  compareHref?: string;
}) {
  const { locale } = useLanguage();
  const t = homeCopy[locale].topCandidate;
  return (
    <section id="today-candidates" className="scroll-mt-28">
      <header className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1 pb-2">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-[var(--foreground)]">{t.heading}</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted)]">{t.researchScope}</p>
        </div>
        {compareHref && (
          <Link href={compareHref} prefetch={false} className="research-link inline-flex min-h-11 items-center gap-1.5 text-xs">
            <GitCompare className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t.compareToday}
          </Link>
        )}
      </header>
      {candidates.length > 0 ? (
        <div className="border-t border-[var(--research-line)] bg-[var(--surface)]">
          {candidates.map((c, index) => (
            <StockCandidateCard key={c.ticker} c={c} featured={index === 0} row />
          ))}
        </div>
      ) : (
        <p className="border-y border-[var(--research-line)] p-4 text-sm text-[var(--muted)]">{t.empty}</p>
      )}
      <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">{t.footer}</p>
    </section>
  );
}
