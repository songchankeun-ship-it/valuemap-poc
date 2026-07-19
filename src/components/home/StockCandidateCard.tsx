"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleAlert } from "lucide-react";
import { AddToCompareButton } from "@/components/AddToCompareButton";
import { AddToWatchlistButton } from "@/components/AddToWatchlistButton";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { MetricChip } from "@/components/ui/MetricChip";
import { useLanguage } from "@/components/LanguageProvider";
import { homeCopy, type StrongMetric, type RiskKind, type MetricKey } from "@/lib/copy/home";

export interface StockCandidate {
  rank: number;
  name: string;
  ticker: string;
  sector: string;
  priceLabel: string;
  changePct: number;
  r3m: number | null;
  score: number;
  /** 강점 라벨(강한 지표 2개) — key+값만, 라벨은 로케일별 렌더. */
  metrics: StrongMetric[];
  /** "왜 후보인지" 근거 — 가장 강한 지표의 전체 풀 상대순위(없으면 null → noReason 폴백). */
  lead: { key: MetricKey; rank: number; topPct: number } | null;
  /** 4지표 점수 — 막대 시각화용. */
  m: { momentum: number; flow: number; value: number; vol: number };
  /** 주의 문구 종류 — 문장은 로케일별 렌더(서버는 원시 점수로 분기만). */
  riskKind: RiskKind;
  highReturn: boolean;
}

// 오늘 추가 확인 후보 카드 — 홈에서는 "점수 → 강점 → 먼저 확인할 것"만 남기고,
// 가격/4지표 상세는 종목 상세에서 보게 해 첫 화면의 판단 밀도를 낮춘다.
export function StockCandidateCard({ c, featured = false }: { c: StockCandidate; featured?: boolean }) {
  const { locale } = useLanguage();
  const t = homeCopy[locale];
  const labels = t.metricLabels;
  // 카드별 근거 한 줄 — 강한 지표의 상대순위로 종목마다 다르게. 근거 데이터가 없으면 정직한 폴백.
  const reason = c.lead
    ? t.topCandidate.reason(labels[c.lead.key], c.lead.rank, c.lead.topPct)
    : t.topCandidate.noReason;
  const changeTone = c.changePct >= 0 ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400";
  const changeLabel = `${c.changePct >= 0 ? "▲" : "▼"}${Math.abs(c.changePct).toFixed(2)}%`;
  const cardClass = "ui-interactive-card flex h-full flex-col rounded-lg border bg-white p-4 dark:bg-zinc-900 " +
    (featured
      ? "border-zinc-300 dark:border-zinc-700"
      : "border-zinc-200 dark:border-zinc-800") +
    " hover:border-blue-400 dark:hover:border-blue-700";
  const nameClass = "text-[16px] font-bold text-zinc-900 dark:text-zinc-100 truncate";
  const gaugeSize = 68;
  return (
    <div className={cardClass}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-600 text-white text-[11px] font-bold shrink-0 tabular-nums"
              title={t.topCandidate.rankBadgeAria(c.rank)}
              aria-label={t.topCandidate.rankBadgeAria(c.rank)}
            >{c.rank}</span>
            <span className={nameClass}>{c.name}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 flex-wrap">
            <span className="truncate">{c.sector}</span>
            <span>·</span>
            <span className="font-mono tabular-nums">{c.ticker}</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[12px]">
            <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{c.priceLabel}</span>
            <span className={"font-semibold tabular-nums " + changeTone}>{changeLabel}</span>
          </div>
        </div>
        <ScoreGauge score={c.score} size={gaugeSize} showLabel />
      </div>

      <p className="mt-2 text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300">
        {reason}
        {c.lead ? null : (
          <Link
            prefetch={false}
            href={"/stock/" + c.ticker}
            className="ml-1.5 inline-flex items-center gap-0.5 font-semibold text-blue-700 dark:text-blue-400 hover:underline"
          >
            {t.topCandidate.viewStock}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
      </p>

      <div className="mt-2.5 flex items-start gap-1.5">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={2} aria-hidden="true" />
        <div className="min-w-0">
          <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">{t.topCandidate.strength}</div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {c.metrics.slice(0, 1).map((m) => (
              <MetricChip key={m.key} label={labels[m.key]} value={String(m.value)} tone="strong" />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex items-start gap-1.5 border-t border-zinc-200 py-2.5 dark:border-zinc-800">
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" strokeWidth={2} aria-hidden="true" />
        <div className="min-w-0">
          <div className="mb-0.5 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">{t.topCandidate.firstCheck}</div>
          <p className="text-[11px] leading-snug text-zinc-600 dark:text-zinc-400">{t.topCandidate.risk[c.riskKind]}</p>
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-2 divide-x divide-zinc-200 border-y border-zinc-200 py-2 dark:divide-zinc-800 dark:border-zinc-800">
        {t.topCandidate.checkpoints.map((checkpoint, index) => (
          <div key={checkpoint} className="px-2.5 text-[11px] leading-snug text-zinc-600 first:pl-0 last:pr-0 dark:text-zinc-300">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">{index + 1}. </span>
            {checkpoint}
          </div>
        ))}
      </div>

      {/* CTA — 상세 보기 · 비교 · 담기(가이드 순서: 근거 확인 → 비교 → 담기). 좁은 화면에서도 한 줄, 각 ≥44px. */}
      <div className="mt-auto pt-3 flex items-stretch gap-2">
        <Link
          prefetch={false}
          href={"/stock/" + c.ticker}
          data-analytics-event="home_candidate_open"
          data-analytics-ticker={c.ticker}
          data-analytics-rank={String(c.rank)}
          data-analytics-slot={featured ? "featured" : "list"}
          className="ui-primary-action flex-1 min-w-0 text-center px-3 py-2.5 min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          <span className="truncate">{t.topCandidate.viewStock}</span>
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
        <AddToCompareButton ticker={c.ticker} name={c.name} compact label={t.topCandidate.ctaCompare} />
        <AddToWatchlistButton ticker={c.ticker} name={c.name} compact label={t.topCandidate.ctaSave} />
      </div>
    </div>
  );
}
