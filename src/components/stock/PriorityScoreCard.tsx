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
    <span role="listitem" className={"inline-flex items-center rounded-md border px-2.5 py-1 font-medium whitespace-nowrap " + toneClass}>
      {children}
    </span>
  );
}

/**
 * 탐색 우선도 카드 — 점수 게이지 + 전체/업종 순위 + 데이터 완성도·이상값·산식 버전.
 * 정상 상태는 ScoreGauge(구간색 링)로 점수를 주인공화하고, 이상값 점검 중(suspect)에는
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
    <div className={"rounded-xl border p-3 md:p-4 " + (suspect ? "border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20" : "border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20")}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">{t.title}</div>

      <div className="mt-2 flex items-center gap-3">
        {suspect ? (
          <div className="flex items-baseline gap-1 shrink-0">
            <span className="text-3xl md:text-4xl font-bold leading-none tabular-nums text-zinc-400 dark:text-zinc-500">{score}</span>
            <span className="text-sm text-zinc-400 dark:text-zinc-500 tabular-nums">/ 100</span>
            <span className="text-amber-600 dark:text-amber-400 text-base" aria-hidden="true"> ⚠</span>
          </div>
        ) : (
          <ScoreGauge score={score} size={88} showLabel showOutOf />
        )}

        <div className="min-w-0 space-y-1 text-[11px] text-zinc-600 dark:text-zinc-300 tabular-nums">
          <div className="text-[10px] text-zinc-400 dark:text-zinc-500">{t.rankLabel} <span className="font-normal">{t.rankParen}</span></div>
          <div>{t.overallPrefix} <strong className="text-zinc-900 dark:text-zinc-100">{overallRank}</strong> / {poolN}{t.rankSuffix}</div>
          <div className="truncate">{t.sectorPrefix}({sector}) <strong className="text-zinc-900 dark:text-zinc-100">{sectorRank}</strong> / {sectorCount}{t.rankSuffix}</div>
          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 normal-nums leading-snug whitespace-normal">{t.scopeNote(poolN)}</div>
        </div>
      </div>

      {/* 데이터 상태 배지 — 각각 독립 pill로 분리(텍스트처럼 붙지 않게). */}
      <div role="list" aria-label={t.badgeAriaLabel} className="mt-2.5 flex flex-wrap items-center gap-2 text-[10px] tabular-nums">
        <DataStatusPill>{t.requiredDataPrefix} {completeness}%</DataStatusPill>
        {/* sr-only/정적 추출 분리자 — 화면엔 pill 간격, 스크린리더·텍스트 추출엔 ' · '로 끊어 읽히게 */}
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

      {/* 배지 용어 초보자 풀이 — 필수 데이터·이상값 점검이 무엇인지 한 줄로(설계서 §6.2 데이터 신뢰). 점수/데이터 무변경, 표시 전용. */}
      <p className="mt-2 text-[10px] leading-snug text-zinc-500 dark:text-zinc-400">{t.confidenceGloss}</p>
    </div>
  );
}
