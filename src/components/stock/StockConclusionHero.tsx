import { type ReactNode } from "react";
import { StockHeader } from "./StockHeader";
import { PriorityScoreCard } from "./PriorityScoreCard";
import { ConclusionSummaryCard } from "./ConclusionSummaryCard";
import { StrengthWarningPanel } from "./StrengthWarningPanel";
import { StockDetailActionButtons } from "./StockDetailActionButtons";

export interface HeroRiskAlert {
  level: "high" | "warn";
  label: string;
  text: string;
}

/**
 * 종목 상세 상단 결론 카드 영역(설계서 §4·§14).
 * 모바일 순서: 종목명/현재가 → 탐색 우선도 → 현재 결론 → 강점/주의 → 다음 확인 버튼 → 고지.
 * 위험 경고(급등/과열)는 점수 카드와 분리해 별도 바로 노출.
 */
export function StockConclusionHero({
  sector,
  name,
  ticker,
  asOfLabel,
  priceSlot,
  actionsSlot,
  score,
  overallRank,
  poolN,
  sectorRank,
  sectorCount,
  completeness,
  metricsVersion,
  suspect,
  conclusion,
  strengths,
  warnings,
  riskAlert,
}: {
  sector: string;
  name: string;
  ticker: string;
  asOfLabel?: string | null;
  priceSlot: ReactNode;
  actionsSlot: ReactNode;
  score: number;
  overallRank: number;
  poolN: number;
  sectorRank: number;
  sectorCount: number;
  completeness: number;
  metricsVersion?: string | null;
  suspect: boolean;
  conclusion: { type: string; summary: string; riskNote: string };
  strengths: string[];
  warnings: string[];
  riskAlert: HeroRiskAlert | null;
}) {
  return (
    <section className="space-y-3">
      <StockHeader
        sector={sector}
        name={name}
        ticker={ticker}
        asOfLabel={asOfLabel}
        priceSlot={priceSlot}
        actionsSlot={actionsSlot}
      />

      {suspect ? (
        <div className="flex items-start gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg px-3 py-2">
          <span aria-hidden="true">⚠</span>
          <span>가격 데이터 검증 중 — 아래 점수는 임시 계산값이며, 공식 후보·순위에서 제외됩니다.</span>
        </div>
      ) : null}

      {riskAlert ? (
        <div className={"flex items-start gap-2 rounded-lg border px-3 py-2 text-xs " + (riskAlert.level === "high" ? "border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300" : "border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300")}>
          <span aria-hidden="true" className="shrink-0">🔺</span>
          <span><strong className="font-semibold">{riskAlert.label}</strong> — {riskAlert.text}</span>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-[minmax(0,17rem)_1fr]">
        <PriorityScoreCard
          score={score}
          overallRank={overallRank}
          poolN={poolN}
          sectorRank={sectorRank}
          sectorCount={sectorCount}
          sector={sector}
          completeness={completeness}
          metricsVersion={metricsVersion}
          suspect={suspect}
        />
        <ConclusionSummaryCard type={conclusion.type} summary={conclusion.summary} riskNote={conclusion.riskNote} suspect={suspect} />
      </div>

      <StrengthWarningPanel strengths={strengths} warnings={warnings} />

      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1.5">다음으로 확인할 것</div>
        <StockDetailActionButtons />
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 px-3 py-2 space-y-0.5">
        <p className="text-[11px] text-zinc-600 dark:text-zinc-300 font-medium">매수·매도 추천이 아닌 탐색 우선순위입니다.</p>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">점수는 탐색 우선순위용 실험 지표이며, 향후 수익률을 의미하지 않습니다.</p>
      </div>
    </section>
  );
}
