import { ScoreTooltip } from "./ScoreTooltip";

export interface MetricAxis {
  label: string;
  kind: "momentum" | "flow" | "value" | "vol";
  topPct: number; // 1~100 (작을수록 상위)
  rank: number;
  total: number;
  raw: number;
}

/**
 * 4축 요약 스트립 — 오른스코어 고유 시각 언어.
 * 원칙: ① 점수보다 백분위를 크게 ② 색이 아닌 '점 개수'로 강도 표현(색맹 안전)
 *       ③ 낮은 지표도 '하위 X%'로 명확 ④ 원점수·순위는 보조 정보.
 */
export function MetricStrip({ axes }: { axes: MetricAxis[] }) {
  return (
    <div className="space-y-2.5">
      {axes.map((a) => {
        const strong = 100 - a.topPct; // 0~99, 클수록 강함
        const filled = Math.max(1, Math.min(5, Math.round(strong / 20)));
        const isTop = a.topPct <= 50;
        return (
          <div key={a.label} className="flex items-center gap-2 md:gap-3">
            <span className="flex items-center gap-1 w-[5.5rem] md:w-28 shrink-0 text-xs text-zinc-600 dark:text-zinc-300">
              {a.label}
              <ScoreTooltip kind={a.kind} />
            </span>
            <span className="flex gap-1 shrink-0" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={"w-2 h-2 rounded-full " + (i < filled ? "bg-zinc-800 dark:bg-zinc-200" : "bg-zinc-200 dark:bg-zinc-700")}
                />
              ))}
            </span>
            <span className={"text-xs md:text-sm font-semibold tabular-nums shrink-0 " + (isTop ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400")}>
              {isTop ? `상위 ${a.topPct}%` : `하위 ${100 - a.topPct}%`}
            </span>
            <span className="ml-auto text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums shrink-0">
              {a.total}중 {a.rank}위 · 원점수 {Math.round(a.raw)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
