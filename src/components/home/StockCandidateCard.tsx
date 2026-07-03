"use client";

import Link from "next/link";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { MetricChip } from "@/components/ui/MetricChip";
import { MetricBar } from "@/components/ui/MetricBar";
import { useLanguage } from "@/components/LanguageProvider";
import { homeCopy, type StrongMetric, type RiskKind } from "@/lib/copy/home";

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
  /** 4지표 점수 — 막대 시각화용. */
  m: { momentum: number; flow: number; value: number; vol: number };
  /** 주의 문구 종류 — 문장은 로케일별 렌더(서버는 원시 점수로 분기만). */
  riskKind: RiskKind;
  highReturn: boolean;
}

// 오늘 추가 확인 후보 카드 — 종합점수를 카드의 핵심(게이지)으로, 위계는
// 종목명 → 업종 → 가격 → 점수 → 4지표 막대 → 강점/주의 → CTA 순으로 또렷하게.
export function StockCandidateCard({ c }: { c: StockCandidate }) {
  const { locale } = useLanguage();
  const t = homeCopy[locale];
  const labels = t.metricLabels;
  return (
    <div className="flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-blue-400 dark:hover:border-blue-700 hover:shadow-md transition">
      {/* 상단 — 종목 정보 + 종합점수 게이지(핵심) */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-600 text-white text-[11px] font-bold shrink-0 tabular-nums"
              title={t.topCandidate.rankBadgeAria(c.rank)}
              aria-label={t.topCandidate.rankBadgeAria(c.rank)}
            >{c.rank}</span>
            <span className="text-[16px] font-bold text-zinc-900 dark:text-zinc-100 truncate">{c.name}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 flex-wrap">
            <span className="truncate">{c.sector}</span>
            <span>·</span>
            <span className="font-mono tabular-nums">{c.ticker}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-[13px]">
            <span className="tabular-nums font-semibold text-zinc-800 dark:text-zinc-200">{c.priceLabel}</span>
            <span className={"tabular-nums font-medium text-[12px] " + (c.changePct >= 0 ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400")}>
              {c.changePct >= 0 ? "▲" : "▼"}{Math.abs(c.changePct).toFixed(2)}%
            </span>
            {c.r3m !== null ? (
              <span className={"text-[10px] px-1.5 py-0.5 rounded font-medium tabular-nums " + (c.highReturn ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400")}>
                3M {c.r3m >= 0 ? "+" : ""}{Math.round(c.r3m)}%
              </span>
            ) : null}
          </div>
        </div>
        <ScoreGauge score={c.score} size={84} showLabel showOutOf={false} />
      </div>

      {/* 4지표 막대 */}
      <div className="mt-3.5 space-y-1.5 rounded-lg bg-slate-50/60 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-800/80 p-2.5">
        <MetricBar label={labels.momentum} value={c.m.momentum} />
        <MetricBar label={labels.flow} value={c.m.flow} />
        <MetricBar label={labels.value} value={c.m.value} />
        <MetricBar label={labels.vol} value={c.m.vol} />
      </div>

      {/* 강점 — 강한 지표 2개 (체크 마커로 스캔 용이) */}
      <div className="mt-3 flex items-start gap-1.5">
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold shrink-0 mt-0.5" aria-hidden="true">✓</span>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">{t.topCandidate.strength}</div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {c.metrics.map((m) => (
              <MetricChip key={m.key} label={labels[m.key]} value={String(m.value)} tone="strong" />
            ))}
          </div>
        </div>
      </div>

      {/* 주의 — 확인 필요 문구 (경고 마커로 강점과 명확 분리) */}
      <div className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 px-3 py-2.5">
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-[10px] font-bold shrink-0 mt-px" aria-hidden="true">!</span>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 mb-0.5">{t.topCandidate.caution}</div>
          <p className="text-[11px] leading-snug text-amber-800/90 dark:text-amber-300/80">{t.topCandidate.risk[c.riskKind]}</p>
        </div>
      </div>

      <Link
        prefetch={false}
        href={"/stock/" + c.ticker}
        className="mt-3.5 text-center px-3 py-2 min-h-[44px] inline-flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 hover:border-blue-400 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      >
        {t.topCandidate.viewStock}
      </Link>
    </div>
  );
}
