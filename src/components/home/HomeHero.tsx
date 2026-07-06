"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, FileText, Search, ShieldCheck, TrendingUp, type LucideIcon } from "lucide-react";
import { homeHeroCopy } from "@/lib/i18n";
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

// 홈 히어로 — 서비스 소개보다 "오늘 무엇을 먼저 볼지"를 짧게 제시하는 브리핑 헤더.
// 후보 카드가 모바일 첫 화면 안에 곧바로 이어지도록 높이를 낮춘다.
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
  const lead = previewCandidates[0];
  const visibleCandidateCount = Math.min(previewCandidates.length, 3);
  const countLabel = locale === "ko" ? `${totalCount}개 분석` : `${totalCount} analyzed`;
  const changeLabel = lead
    ? `${lead.changePct >= 0 ? "▲" : "▼"}${Math.abs(lead.changePct).toFixed(2)}%`
    : "";

  return (
    <section className="relative -mx-3 md:-mx-4 overflow-hidden border-y border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-3 md:px-4 md:py-5">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem] gap-3 md:gap-4 items-stretch">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 px-4 py-3 md:px-5 md:py-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              {copy.badge}
            </span>
            <span
              className="inline-flex items-center gap-1.5 text-[10px] text-zinc-600 dark:text-zinc-300 px-2.5 py-1 rounded-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
              title={`${copy.dataPrefix} ${dataAsOf} ${copy.marketClose}`}
            >
              <span className={"w-1.5 h-1.5 rounded-full " + (dataStale ? "bg-orange-400" : "bg-emerald-400")} />
              <span className="tabular-nums">{copy.dataPrefix} {dataAsOf} {copy.marketClose}</span>
              {dataStale ? <span className="font-medium text-orange-600 dark:text-orange-300">· {copy.delayed}</span> : <span className="text-emerald-600 dark:text-emerald-300">· {copy.normal}</span>}
            </span>
          </div>
          <h1 className="max-w-2xl text-[24px] leading-[1.08] md:text-[38px] md:leading-[1.04] font-black text-zinc-950 dark:text-white">
            {copy.titleBefore}{" "}
            <span className="text-blue-700 dark:text-sky-300">{copy.titleAccent}</span> {copy.titleAfter}
          </h1>
          <p className="hidden sm:block text-[13px] md:text-[14px] text-zinc-600 dark:text-zinc-300 mt-3 max-w-2xl leading-relaxed">
            {copy.description}
          </p>
          <div className="flex flex-row flex-wrap gap-2.5 mt-3 md:mt-4">
            <a href="#today-candidates" className="text-center px-4 py-2.5 min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition shadow-sm shadow-zinc-900/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
              <Search className="h-4 w-4" aria-hidden="true" />
              <span>{copy.primaryCta}</span>
            </a>
            <Link prefetch={false} href="/stocks" className="text-center px-4 py-2.5 min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-semibold hover:border-blue-400 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
              <span>{copy.stockSearch}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="hidden lg:block rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-white dark:bg-zinc-900 px-4 py-4 md:px-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] font-semibold">{copy.previewTitle}</span>
            <span className="text-[10px] text-zinc-400">{copy.previewFilter}</span>
          </div>
          {lead ? (
            <div className="mt-3 rounded-xl border border-white/10 bg-white/8 px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] text-zinc-400">{copy.previewLead}</div>
                  <div className="mt-1 text-lg font-black truncate">{lead.name}</div>
                  <div className="mt-0.5 text-[11px] text-zinc-400 truncate">{lead.sector} · {lead.ticker}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-2xl font-black tabular-nums">{lead.score}</div>
                  <div className="text-[10px] text-zinc-400">ORN</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 text-[11px]">
                <span className="tabular-nums text-zinc-300">{lead.priceLabel}</span>
                <span className={"tabular-nums font-semibold " + (lead.changePct >= 0 ? "text-red-300" : "text-blue-300")}>{changeLabel}</span>
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-dashed border-white/20 p-4 text-center text-[12px] text-zinc-400">
              {copy.empty}
            </div>
          )}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <KpiCell value={signalCount} label={copy.kpiSignals} tone="amber" Icon={FileText} />
            <KpiCell value={volumeSpikeCount} label={copy.kpiVolume} tone="emerald" Icon={TrendingUp} />
            <KpiCell value={strongCount} label={copy.kpiStrong} tone="blue" Icon={BarChart3} />
          </div>
          <p className="text-[10px] text-zinc-400 mt-2.5">
            {countLabel} · {visibleCandidateCount}{locale === "ko" ? "개 후보만 먼저 표시" : " candidates shown first"}
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
      ? "text-sky-300"
      : tone === "emerald"
      ? "text-emerald-300"
      : "text-amber-300";
  return (
    <div className="rounded-lg bg-white/10 border border-white/10 px-2 py-2.5 text-center">
      <Icon className={"w-4 h-4 mx-auto mb-1.5 " + toneCls} aria-hidden={true} />
      <div className={"text-[18px] font-bold tabular-nums leading-none " + toneCls}>{value}</div>
      <div className="text-[10px] text-zinc-300 mt-1 leading-tight">{label}</div>
    </div>
  );
}
