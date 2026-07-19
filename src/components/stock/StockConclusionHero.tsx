"use client";

import { type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { conclusionHeroCopy } from "@/lib/copy/stockDetail";
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
 * 종목 상세 상단 결론 카드 영역(설계서 §4·§14).
 * 모바일 순서: 종목명/현재가 → 현재 결론/좋은 점/확인할 점 → 점수·순위 → 다음 확인 버튼 → 고지.
 * 위험 경고(급등/과열)는 점수 카드와 분리해 별도 바로 노출.
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
  suspect: boolean;
  conclusion: { type: string; summary: string; riskNote: string };
  strengths: string[];
  warnings: string[];
  riskAlert: HeroRiskAlert | null;
  leadStrength: PrioritySignal;
  leadCheck: PrioritySignal;
}) {
  const { locale } = useLanguage();
  const t = conclusionHeroCopy[locale];
  return (
    <section className="-mx-3 md:-mx-4 space-y-3 border-y border-zinc-200 bg-white/70 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950/50 md:px-4 md:py-4">
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

      <div className="grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="order-1">
          <ConclusionSummaryCard
            type={conclusion.type}
            summary={conclusion.summary}
            riskNote={conclusion.riskNote}
            suspect={suspect}
            strengths={strengths}
            warnings={warnings}
          />
        </div>
        <div className="order-2">
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
            suspect={suspect}
            leadStrength={leadStrength}
            leadCheck={leadCheck}
          />
        </div>
        <div className="order-3 rounded-lg border border-zinc-200 bg-white/85 px-2.5 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/50 md:px-3 lg:col-span-2">
          <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2">{t.nextToCheck}</div>
          <StockDetailActionButtons />
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 px-3 py-2">
        <p className="text-[11px] text-zinc-600 dark:text-zinc-300 font-medium">{t.disclaimerMain}</p>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-snug">{t.disclaimerSub}</p>
      </div>
    </section>
  );
}
