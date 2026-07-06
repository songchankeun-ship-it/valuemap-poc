"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, FileText, Search, Sparkles, TrendingUp, type LucideIcon } from "lucide-react";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { MetricChip } from "@/components/ui/MetricChip";
import { homeHeroCopy } from "@/lib/i18n";
import { homeCopy } from "@/lib/copy/home";
import { useLanguage } from "@/components/LanguageProvider";
import type { StockCandidate } from "./StockCandidateCard";

interface HomeHeroProps {
  dataAsOf: string;
  dataStale: boolean;
  totalCount: number;
  strongCount: number;
  volumeSpikeCount: number;
  signalCount: number;
  /** 미리보기 카드에 띄울 상위 후보(최대 3). */
  previewCandidates: StockCandidate[];
}

// 홈 히어로 — 첫 화면에서 '점수 기반 한국 주식 탐색 대시보드'임을 즉시 전달한다.
// 딥블루 패널(좌측 카피+CTA) 위에 흰 대시보드 미리보기 '화면'을 올려 대비를 키우고,
// 점수(ScoreGauge)를 우측 화면의 주인공으로 둔다. 마케팅 장식은 피하고 금융 SaaS 톤 유지.
export function HomeHero({
  dataAsOf,
  dataStale,
  totalCount,
  strongCount,
  volumeSpikeCount,
  signalCount,
  previewCandidates,
}: HomeHeroProps) {
  const { locale } = useLanguage();
  const copy = homeHeroCopy[locale];
  const metricLabels = homeCopy[locale].metricLabels;
  const lead = previewCandidates[0];
  const rest = previewCandidates.slice(1, 3);

  return (
    <section className="relative -mx-3 md:-mx-4 overflow-hidden border-y border-zinc-200 dark:border-zinc-800 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_32%),linear-gradient(135deg,#ffffff_0%,#f8fafc_48%,#eef6ff_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.14),transparent_32%),linear-gradient(135deg,#0b0f14_0%,#111827_54%,#0f172a_100%)] px-3 py-5 md:px-4 md:py-7">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(22rem,1.05fr)] gap-5 lg:gap-6 items-stretch">
        {/* 좌측 — 카피 + CTA (딥블루 위 화이트 텍스트) */}
        <div className="flex min-h-[28rem] flex-col justify-between rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/50 px-5 py-5 md:px-7 md:py-7 shadow-sm">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              {copy.badge}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
              <span className={"w-1.5 h-1.5 rounded-full " + (dataStale ? "bg-orange-400" : "bg-emerald-400")} />
              <span className="tabular-nums">{copy.dataPrefix} {dataAsOf} {copy.marketClose}</span>
              {dataStale ? <span className="font-medium text-orange-600 dark:text-orange-300">· {copy.delayed}</span> : <span className="text-emerald-600 dark:text-emerald-300">· {copy.normal}</span>}
            </span>
          </div>
          <h1 className="max-w-2xl text-[30px] leading-[1.04] md:text-[46px] md:leading-[1.02] font-black text-zinc-950 dark:text-white">
            {copy.titleBefore}{" "}
            <span className="text-blue-700 dark:text-sky-300">{copy.titleAccent}</span> {copy.titleAfter}
          </h1>
          <p className="text-[13px] md:text-[15px] text-zinc-600 dark:text-zinc-300 mt-4 max-w-xl leading-relaxed">
            {copy.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 mt-6">
            <a href="#today-candidates" className="text-center px-5 py-3 min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition shadow-md shadow-zinc-900/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
              <Search className="h-4 w-4" aria-hidden="true" />
              <span>{copy.primaryCta}</span>
            </a>
            <Link prefetch={false} href="/guide/metrics" className="text-center px-5 py-3 min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-semibold hover:border-blue-400 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
              <span>{copy.secondaryCta}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-4">
            {copy.note}{" "}
            <Link prefetch={false} href="/stocks" className="text-zinc-950 dark:text-white font-semibold hover:underline">{copy.stockSearch}</Link>
          </p>
        </div>

        {/* 우측 — 대시보드 미리보기 '화면' (딥블루 위 흰 카드, 강한 대비) */}
        <div className="flex min-h-[28rem] flex-col rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 p-4 md:p-5 shadow-xl shadow-zinc-950/20">
          <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-white/10 dark:border-zinc-200">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[12px] font-semibold">{copy.previewTitle}</span>
            </div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{copy.previewFilter}</span>
          </div>

          {lead ? (
            <>
              {/* 1순위 — 큰 게이지(주인공) + 강점 칩 */}
              <div className="flex items-center gap-4 rounded-xl bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white border border-white/10 dark:border-zinc-800 p-4 md:p-5">
                <ScoreGauge score={lead.score} size={122} showOutOf showLabel />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center justify-center h-6 min-w-6 rounded bg-blue-600 px-1.5 text-white text-[11px] font-bold shrink-0 tabular-nums">1</span>
                    <span className="text-xl md:text-2xl font-black truncate">{lead.name}</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{lead.sector} · {lead.ticker}</div>
                  <div className="flex items-center gap-1.5 mt-4 flex-wrap">
                    {lead.metrics.map((m) => (
                      <MetricChip key={m.key} label={metricLabels[m.key]} value={String(m.value)} tone="strong" />
                    ))}
                  </div>
                </div>
              </div>

              {/* 2~3순위 — 컴팩트 랭킹 행 */}
              {rest.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {rest.map((c) => (
                    <li key={c.ticker} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 bg-white/8 dark:bg-zinc-100 border border-white/10 dark:border-zinc-200">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-white/15 dark:bg-zinc-200 text-white dark:text-zinc-700 text-[10px] font-bold shrink-0 tabular-nums">{c.rank}</span>
                      <span className="text-[13px] font-semibold truncate flex-1">{c.name}</span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate hidden sm:inline">{c.sector}</span>
                      <ScoreBadge score={c.score} showLabel={false} size="sm" />
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 p-5 text-center text-[12px] text-zinc-500 dark:text-zinc-400">
              {copy.empty}
            </div>
          )}

          {/* KPI strip — 공시 신호 / 거래활성도 급증 / 종합 80↑ */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <KpiCell value={signalCount} label={copy.kpiSignals} tone="amber" Icon={FileText} />
            <KpiCell value={volumeSpikeCount} label={copy.kpiVolume} tone="emerald" Icon={TrendingUp} />
            <KpiCell value={strongCount} label={copy.kpiStrong} tone="blue" Icon={BarChart3} />
          </div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2.5">
            {locale === "ko"
              ? `${copy.footerPrefix} ${totalCount}${copy.footerSuffix}`
              : `${copy.footerPrefix} ${totalCount} ${copy.footerSuffix}`}
          </p>
        </div>
      </div>
    </section>
  );
}

// KPI 셀 — 작은 아이콘 + 큰 숫자 + 라벨. 미리보기 화면의 하단 요약 strip.
function KpiCell({
  value,
  label,
  tone,
  Icon,
}: {
  value: number;
  label: string;
  tone: "blue" | "emerald" | "amber";
  Icon: LucideIcon;
}) {
  // 정적 리터럴 클래스만 사용(런타임 합성 금지 — Tailwind 정적 스캔).
  const toneCls =
    tone === "blue"
      ? "text-sky-300 dark:text-blue-700"
      : tone === "emerald"
      ? "text-emerald-300 dark:text-emerald-700"
      : "text-amber-300 dark:text-amber-700";
  return (
    <div className="rounded-lg bg-white/10 dark:bg-zinc-100 border border-white/10 dark:border-zinc-200 px-2 py-3 text-center">
      <Icon className={"w-4 h-4 mx-auto mb-1.5 " + toneCls} aria-hidden={true} />
      <div className={"text-[18px] font-bold tabular-nums leading-none " + toneCls}>{value}</div>
      <div className="text-[10px] text-zinc-300 dark:text-zinc-500 mt-1 leading-tight">{label}</div>
    </div>
  );
}
