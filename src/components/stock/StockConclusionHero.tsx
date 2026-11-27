"use client";

import { type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { conclusionHeroCopy } from "@/lib/copy/stockDetail";
import type { ValuationBasis } from "@/lib/financialEvidence";
import { StockHeader } from "./StockHeader";
import { PriorityScoreCard, type PrioritySignal } from "./PriorityScoreCard";
import { ConclusionSummaryCard } from "./ConclusionSummaryCard";
import { StockDetailActionButtons } from "./StockDetailActionButtons";

export interface HeroRiskAlert {
  level: "high" | "warn";
  label: string;
  text: string;
}

/**
 * 종목 상세 첫 화면: 종가 → 다음 확인 항목 → 점수·순위.
 */
export function StockConclusionHero({
  sector,
  name,
  ticker,
  asOfLabel,
  priceLagAsOf,
  priceSlot,
  actionsSlot,
  score,
  overallRank,
  overallTieCount,
  poolN,
  sectorRank,
  sectorTieCount,
  sectorCount,
  completeness,
  metricsVersion,
  valuationBasis,
  suspect,
  conclusion,
  strengths,
  warnings,
  riskAlert,
  leadStrength,
  leadCheck,
}: {
  sector: string;
  name: string;
  ticker: string;
  asOfLabel?: string | null;
  priceLagAsOf?: string | null;
  priceSlot: ReactNode;
  actionsSlot: ReactNode;
  score: number;
  overallRank: number;
  overallTieCount?: number;
  poolN: number;
  sectorRank: number;
  sectorTieCount?: number;
  sectorCount: number;
  completeness: number;
  metricsVersion?: string | null;
  valuationBasis: ValuationBasis;
  suspect: boolean;
  conclusion: {
    type: string;
    summary: string;
    riskNote: string;
    nextHref: "#summary" | "#financials" | "#disclosures";
  };
  strengths: string[];
  warnings: string[];
  riskAlert: HeroRiskAlert | null;
  leadStrength: PrioritySignal;
  leadCheck: PrioritySignal;
}) {
  const { locale } = useLanguage();
  const t = conclusionHeroCopy[locale];
  return (
    <section className="research-stock-overview">
      <StockHeader
        sector={sector}
        name={name}
        ticker={ticker}
        asOfLabel={asOfLabel}
        priceLagAsOf={priceLagAsOf}
        priceSlot={priceSlot}
        actionsSlot={actionsSlot}
      />

      {suspect ? (
        <div className="flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{t.suspectBanner}</span>
        </div>
      ) : null}

      {riskAlert ? (
        <div className={"flex items-start gap-2 rounded-lg border px-3 py-2 text-xs " + (riskAlert.level === "high" ? "border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300" : "border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300")}>
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span><strong className="font-semibold">{riskAlert.label}</strong> — {riskAlert.text}</span>
        </div>
      ) : null}

      <ConclusionSummaryCard
        type={conclusion.type}
        summary={conclusion.summary}
        riskNote={conclusion.riskNote}
        nextHref={conclusion.nextHref}
        suspect={suspect}
        strengths={strengths}
        warnings={warnings}
        scoreSlot={
          <PriorityScoreCard
            score={score}
            overallRank={overallRank}
            overallTieCount={overallTieCount}
            poolN={poolN}
            sectorRank={sectorRank}
            sectorTieCount={sectorTieCount}
            sectorCount={sectorCount}
            sector={sector}
            completeness={completeness}
            metricsVersion={metricsVersion}
            valuationBasis={valuationBasis}
            suspect={suspect}
            leadStrength={leadStrength}
            leadCheck={leadCheck}
          />
        }
      />

      <StockDetailActionButtons />

      <div className="research-stock-disclaimer">
        <p>{t.disclaimerMain}</p>
        <p>{t.disclaimerSub}</p>
      </div>
    </section>
  );
}
