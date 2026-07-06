"use client";

import { ScoreGauge } from "@/components/ui/ScoreGauge";
import type { ReactNode } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { priorityScoreCardCopy } from "@/lib/copy/stockDetail";

function DataStatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" }) {
  const toneClass =
    tone === "good"
      ? "border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
      : tone === "warn"
      ? "border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300"
      : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300";
  return (
    <span role="listitem" className={"inline-flex items-center rounded-md border px-2 py-0.5 font-medium whitespace-nowrap " + toneClass}>
      {children}
    </span>
  );
}

/**
 * 탐색 우선도 카드 — 상단 결론의 보조 정보로 점수·전체/업종 순위만 빠르게 보여준다.
 * 정상 상태는 ScoreGauge(구간색 링)로 점수를 보여주고, 이상값 점검 중(suspect)에는
 * 매수 게이지처럼 보이지 않도록 게이지 대신 회색 숫자만 노출한다. 설계서 §6.2 / §9.3 / §15.
 */
export function PriorityScoreCard({
  score,
  overallRank,
  poolN,
  sectorRank,
  sectorCount,
  sector,
  completeness,
  metricsVersion,
  suspect,
}: {
  score: number;
  overallRank: number;
  poolN: number;
  sectorRank: number;
  sectorCount: number;
  sector: string;
  completeness: number;
  metricsVersion?: string | null;
  suspect: boolean;
}) {
  const { locale } = useLanguage();
  const t = priorityScoreCardCopy[locale];
  return (
    <div className={"rounded-xl border bg-white dark:bg-zinc-900 p-3 md:p-4 " + (suspect ? "border-amber-300 dark:border-amber-800" : "border-zinc-200 dark:border-zinc-800")}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t.title}</div>

      <div className="mt-2 flex items-center gap-3">
        {suspect ? (
          <div className="flex items-baseline gap-1 shrink-0">
            <span className="text-3xl md:text-4xl font-bold leading-none tabular-nums text-zinc-400 dark:text-zinc-500">{score}</span>
            <span className="text-sm text-zinc-400 dark:text-zinc-500 tabular-nums">/ 100</span>
            <span className="text-amber-600 dark:text-amber-400 text-base" aria-hidden="true"> ⚠</span>
          </div>
        ) : (
          <ScoreGauge score={score} size={76} showLabel showOutOf />
        )}

        <div className="min-w-0 flex-1 space-y-2 text-[11px] text-zinc-600 dark:text-zinc-300 tabular-nums">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800 px-2 py-1.5">
              <div className="text-[10px] text-zinc-400 dark:text-zinc-500">{t.overallPrefix}</div>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{overallRank}<span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500"> / {poolN}{t.rankSuffix}</span></div>
            </div>
            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800 px-2 py-1.5">
              <div className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">{sector}</div>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{sectorRank}<span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500"> / {sectorCount}{t.rankSuffix}</span></div>
            </div>
          </div>
          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 normal-nums leading-snug whitespace-normal">{t.scopeNote(poolN)}</div>
        </div>
      </div>

      <div className="mt-3 border-t border-zinc-100 dark:border-zinc-800 pt-2">
        <div className="mb-1 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">{t.trustLabel}</div>
        <div role="list" aria-label={t.badgeAriaLabel} className="flex flex-wrap items-center gap-1.5 text-[10px] tabular-nums">
          <DataStatusPill>{t.requiredDataPrefix} {completeness}%</DataStatusPill>
          <span className="sr-only"> · </span>
          {suspect ? (
            <DataStatusPill tone="warn">{t.suspectPill}</DataStatusPill>
          ) : (
            <DataStatusPill tone="good">{t.passPill}</DataStatusPill>
          )}
          {metricsVersion ? (
            <>
              <span className="sr-only"> · </span>
              <DataStatusPill>{metricsVersion}</DataStatusPill>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
