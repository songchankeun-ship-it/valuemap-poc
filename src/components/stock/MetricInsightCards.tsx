"use client";

import { ScoreTooltip, type ScoreKind } from "@/components/ScoreTooltip";
import { scoreColorOf } from "@/lib/scoreColor";
import { useLanguage } from "@/components/LanguageProvider";
import { metricInsightCardsCopy, stockDetailCopy } from "@/lib/copy/stockDetail";
import {
  readMomentum,
  readFlow,
  readValue,
  readVol,
  type Reading,
} from "@/lib/metricReadings";

export interface MetricInsight {
  label: string;
  kind: Extract<ScoreKind, "momentum" | "flow" | "value" | "vol">;
  /** 원점수(0~100). 표시·해석용 — 계산식 무관. */
  score: number;
  /** 1~100, 작을수록 상위. */
  topPct: number;
  rank: number;
  total: number;
  /** 밸류 카드 해석에만 사용(PER·PBR 문구). */
  per?: number;
  pbr?: number;
}

function readingFor(m: MetricInsight): Reading {
  switch (m.kind) {
    case "momentum":
      return readMomentum(m.score);
    case "flow":
      return readFlow(m.score);
    case "value":
      return readValue(m.score, m.per ?? 0, m.pbr ?? 0);
    case "vol":
      return readVol(m.score);
  }
}

/**
 * 4개 지표 카드(추세·거래활성도·밸류·위험조정).
 * 각 카드: 지표명 + 설명 툴팁, 점수·상위/하위 백분위, 구간색 막대, 한 줄 해석, 주의/확인 문구.
 * 문구는 @/lib/metricReadings 단일 소스(초보자 해석 카드와 공유) — 표시 전용, 점수 계산 무변경.
 */
export function MetricInsightCards({ metrics }: { metrics: MetricInsight[] }) {
  const { locale } = useLanguage();
  const t = metricInsightCardsCopy[locale];
  const metricLabels = stockDetailCopy[locale].metricLabels;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
      {metrics.map((m) => {
        const v = Math.max(0, Math.min(100, Math.round(m.score)));
        const c = scoreColorOf(v);
        const r = readingFor(m);
        const isTop = m.topPct <= 50;
        const cautionTag = r.tone === "caution";
        const label = metricLabels[m.kind];
        return (
          <div
            key={m.kind}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 sm:p-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {label}
                <ScoreTooltip kind={m.kind} />
              </span>
              <span className={"text-[10px] font-medium shrink-0 " + c.text}>{c.label}</span>
            </div>

            {/* 점수(0~100) — 순위와 다른 줄·다른 라벨로 분리해 같은 숫자로 보이지 않게 */}
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{t.scoreLabel}</span>
              <span className={"text-2xl font-bold leading-none tabular-nums " + c.text}>{v}</span>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums">/ 100</span>
            </div>

            <div className={"relative h-1.5 w-full rounded-full overflow-hidden " + c.barTrack} aria-hidden="true">
              <div className={"absolute inset-y-0 left-0 rounded-full " + c.barFill} style={{ width: `${v}%` }} />
            </div>

            {/* 상대순위 — 점수와 별개 지표 */}
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">
              {t.rankPrefix} <strong className="text-zinc-700 dark:text-zinc-300">{m.rank}</strong> / {m.total}{t.rankSuffix}
              <span className="text-zinc-400 dark:text-zinc-500"> · {isTop ? `${t.topPctPrefix} ${m.topPct}%` : `${t.bottomPctPrefix} ${100 - m.topPct}%`}</span>
            </div>

            {m.kind === "value" ? (
              <div className="text-[10px] font-medium text-amber-800 dark:text-amber-300 leading-snug rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 px-2 py-1">{t.valueNote}</div>
            ) : null}

            <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-snug">
              <span className="font-semibold text-zinc-500 dark:text-zinc-400">{t.interpretLabel}</span> {r.meaning}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug flex gap-1">
              <span className={"shrink-0 font-semibold " + (cautionTag ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400")}>
                {cautionTag ? t.cautionTag : t.confirmTag}
              </span>
              <span>{r.action}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}
