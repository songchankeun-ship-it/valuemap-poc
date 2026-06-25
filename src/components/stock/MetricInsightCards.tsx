import { ScoreTooltip, type ScoreKind } from "@/components/ScoreTooltip";
import { scoreColorOf } from "@/lib/scoreColor";
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
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {metrics.map((m) => {
        const v = Math.max(0, Math.min(100, Math.round(m.score)));
        const c = scoreColorOf(v);
        const r = readingFor(m);
        const isTop = m.topPct <= 50;
        const cautionTag = r.tone === "caution";
        return (
          <div
            key={m.label}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {m.label}
                <ScoreTooltip kind={m.kind} />
              </span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums shrink-0">{m.total}중 {m.rank}위</span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className={"text-2xl font-bold leading-none tabular-nums " + c.text}>{v}</span>
              <span className={"text-[11px] font-medium tabular-nums " + (isTop ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-500 dark:text-zinc-400")}>
                {isTop ? `상위 ${m.topPct}%` : `하위 ${100 - m.topPct}%`}
              </span>
              <span className={"ml-auto text-[10px] font-medium " + c.text}>{c.label}</span>
            </div>

            <div className={"relative h-1.5 w-full rounded-full overflow-hidden " + c.barTrack} aria-hidden="true">
              <div className={"absolute inset-y-0 left-0 rounded-full " + c.barFill} style={{ width: `${v}%` }} />
            </div>

            <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-snug">{r.meaning}</p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug flex gap-1">
              <span className={"shrink-0 font-semibold " + (cautionTag ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400")}>
                {cautionTag ? "주의" : "확인"}
              </span>
              <span>{r.action}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}
