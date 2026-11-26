"use client";

import type { ReactNode } from "react";
import { ArrowRight, Check, CornerDownRight } from "lucide-react";
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
  nextHref,
  suspect,
  strengths,
  warnings,
  scoreSlot,
}: {
  type: string;
  summary: string;
  riskNote: string;
  nextHref: "#summary" | "#financials" | "#disclosures";
  suspect: boolean;
  strengths: string[];
  warnings: string[];
  scoreSlot: ReactNode;
}) {
  const { locale } = useLanguage();
  const t = conclusionSummaryCardCopy[locale];
  return (
    <div className="research-stock-grid">
      <div className="research-stock-next">
        <div className="research-section-label flex items-center gap-2">
          <CornerDownRight size={16} aria-hidden="true" />
          {t.firstCheck}
        </div>
        <h2>{riskNote}</h2>
        <a href={nextHref} className="research-button">
          {t.openNext}
          <ArrowRight size={15} aria-hidden="true" />
        </a>
      </div>

      {scoreSlot}

      <div className="research-stock-summary">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t.title}</span>
          <h2 className="font-bold">
            {suspect ? <span className="text-amber-700 dark:text-amber-300">{t.suspectPrefix}</span> : null}
            {type}
          </h2>
        </div>
        <p className="research-stock-summary-copy">{summary}</p>
        <dl className="research-stock-signals">
          <div>
            <dt><Check size={14} aria-hidden="true" />{t.goodPoints}</dt>
            <dd>{strengths[0] ?? t.strengthEmpty}</dd>
            {strengths.length > 1 ? <dd className="research-signal-more">{t.moreSignals(strengths.length - 1)}</dd> : null}
          </div>
          <div data-tone="check">
            <dt><CornerDownRight size={14} aria-hidden="true" />{t.checkPoints}</dt>
            <dd>{warnings[0] ?? t.warningEmpty}</dd>
            {warnings.length > 1 ? <dd className="research-signal-more">{t.moreSignals(warnings.length - 1)}</dd> : null}
          </div>
        </dl>
      </div>
    </div>
  );
}
