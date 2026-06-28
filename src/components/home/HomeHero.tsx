"use client";

import Link from "next/link";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { MetricChip } from "@/components/ui/MetricChip";
import { homeHeroCopy } from "@/lib/i18n";
import { homeCopy } from "@/lib/copy/home";
import { useLanguage } from "@/components/LanguageProvider";
import type { StockCandidate } from "./StockCandidateCard";
import type { ReactNode } from "react";

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
    <section className="relative overflow-hidden rounded-2xl border border-blue-900/40 dark:border-zinc-800 bg-gradient-to-br from-blue-800 via-blue-900 to-slate-900 dark:from-blue-950 dark:via-slate-950 dark:to-zinc-950 p-5 md:p-8 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-[50%_50%] gap-6 lg:gap-8 items-center">
        {/* 좌측 — 카피 + CTA (딥블루 위 화이트 텍스트) */}
        <div>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="inline-flex items-center text-[10px] font-semibold tracking-wide text-blue-50 px-2 py-0.5 rounded-full bg-white/10 border border-white/20">
              {copy.badge}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] text-blue-100/80">
              <span className={"w-1.5 h-1.5 rounded-full " + (dataStale ? "bg-orange-400" : "bg-emerald-400")} />
              <span className="tabular-nums">{copy.dataPrefix} {dataAsOf} {copy.marketClose}</span>
              {dataStale ? <span className="font-medium text-orange-300">· {copy.delayed}</span> : <span className="text-emerald-300">· {copy.normal}</span>}
            </span>
          </div>
          <h1 className="text-[25px] leading-tight md:text-[36px] md:leading-[1.12] font-bold tracking-tight text-white">
            {copy.titleBefore}{" "}
            <span className="text-sky-300">{copy.titleAccent}</span> {copy.titleAfter}
          </h1>
          <p className="text-[13px] md:text-[15px] text-blue-100/90 mt-4 max-w-xl leading-relaxed">
            {copy.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 mt-6">
            <a href="#today-candidates" className="text-center px-5 py-3 min-h-[44px] inline-flex items-center justify-center rounded-lg bg-white text-blue-800 text-sm font-bold hover:bg-blue-50 transition shadow-md shadow-blue-950/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              {copy.primaryCta}
            </a>
            <Link prefetch={false} href="/guide/metrics" className="text-center px-5 py-3 min-h-[44px] inline-flex items-center justify-center rounded-lg bg-transparent border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              {copy.secondaryCta}
            </Link>
          </div>
          <p className="text-[11px] text-blue-200/80 mt-4">
            {copy.note}{" "}
            <Link prefetch={false} href="/stocks" className="text-white font-medium hover:underline">{copy.stockSearch}</Link>
          </p>
        </div>

        {/* 우측 — 대시보드 미리보기 '화면' (딥블루 위 흰 카드, 강한 대비) */}
        <div className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 md:p-5 shadow-xl shadow-blue-950/30 ring-1 ring-black/5">
          <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">{copy.previewTitle}</span>
            </div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{copy.previewFilter}</span>
          </div>

          {lead ? (
            <>
              {/* 1순위 — 큰 게이지(주인공) + 강점 칩 */}
              <div className="flex items-center gap-4 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-zinc-950/60 dark:to-blue-950/20 border border-blue-100/70 dark:border-zinc-800 p-3.5">
                <ScoreGauge score={lead.score} size={104} showOutOf showLabel />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-blue-600 text-white text-[10px] font-bold shrink-0 tabular-nums">1</span>
                    <span className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100 truncate">{lead.name}</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{lead.sector} · {lead.ticker}</div>
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    {lead.metrics.map((m) => (
                      <MetricChip key={m.key} label={metricLabels[m.key]} value={String(m.value)} tone="strong" />
                    ))}
                  </div>
                </div>
              </div>

              {/* 2~3순위 — 컴팩트 랭킹 행 */}
              {rest.length > 0 ? (
                <ul className="mt-2 space-y-1.5">
                  {rest.map((c) => (
                    <li key={c.ticker} className="flex items-center gap-2.5 rounded-lg px-3 py-2 bg-slate-50/80 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800">
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-[10px] font-bold shrink-0 tabular-nums">{c.rank}</span>
                      <span className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 truncate flex-1">{c.name}</span>
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
            <KpiCell
              value={signalCount}
              label={copy.kpiSignals}
              tone="amber"
              icon={
                <path d="M4 3.5h7l3 3V14a.5.5 0 0 1-.5.5h-9A.5.5 0 0 1 4 14V4a.5.5 0 0 1 0-.5Zm6.5.5v2.5H13" />
              }
            />
            <KpiCell
              value={volumeSpikeCount}
              label={copy.kpiVolume}
              tone="emerald"
              icon={<path d="M2.5 11.5 6.5 7l2.5 2.5L13.5 5M13.5 5h-2.6M13.5 5v2.6" />}
            />
            <KpiCell
              value={strongCount}
              label={copy.kpiStrong}
              tone="blue"
              icon={<path d="M8 2.5 9.7 6l3.8.4-2.8 2.5.8 3.7L8 11.2 4.5 12.6l.8-3.7L2.5 6.4 6.3 6 8 2.5Z" />}
            />
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
  icon,
}: {
  value: number;
  label: string;
  tone: "blue" | "emerald" | "amber";
  icon: ReactNode;
}) {
  // 정적 리터럴 클래스만 사용(런타임 합성 금지 — Tailwind 정적 스캔).
  const toneCls =
    tone === "blue"
      ? "text-blue-700 dark:text-blue-400"
      : tone === "emerald"
      ? "text-emerald-700 dark:text-emerald-400"
      : "text-amber-700 dark:text-amber-400";
  return (
    <div className="rounded-lg bg-slate-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800 px-2 py-2.5 text-center">
      <svg viewBox="0 0 16 16" className={"w-3.5 h-3.5 mx-auto mb-1 " + toneCls} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {icon}
      </svg>
      <div className={"text-[16px] font-bold tabular-nums leading-none " + toneCls}>{value}</div>
      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-tight">{label}</div>
    </div>
  );
}
