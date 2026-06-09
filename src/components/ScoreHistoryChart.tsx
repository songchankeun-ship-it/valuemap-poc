import type { ScorePoint } from "@/lib/scoreHistory";

const METRIC_COLORS: Record<string, string> = {
  composite: "#3b82f6",
  momentum: "#3b82f6",
  flow: "#10b981",
  value: "#06b6d4",
  vol: "#f97316",
};

/**
 * 간단한 SVG 스파크라인.
 * width/height는 viewBox 단위 (CSS로 스케일).
 */
function Sparkline({
  values,
  color,
  height = 40,
  width = 240,
}: {
  values: number[];
  color: string;
  height?: number;
  width?: number;
}) {
  if (values.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-[10px] text-zinc-400 dark:text-zinc-500"
        style={{ height }}
      >
        데이터 부족
      </div>
    );
  }
  const min = 0;
  const max = 100;
  const range = max - min || 1;
  const stepX = width / (values.length - 1);

  const points = values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const last = values[values.length - 1];
  const lastY = height - ((last - min) / range) * height;
  const first = values[0];
  const delta = last - first;
  const trendUp = delta >= 0;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      {/* 가로 50점 가이드선 */}
      <line
        x1="0"
        y1={height / 2}
        x2={width}
        y2={height / 2}
        stroke="currentColor"
        strokeOpacity="0.1"
        strokeDasharray="2,3"
        className="text-zinc-400"
      />
      {/* 영역 채우기 */}
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={color}
        fillOpacity="0.08"
      />
      {/* 메인 라인 */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 마지막 포인트 */}
      <circle cx={width} cy={lastY} r="3" fill={color} />
      {/* 트렌드 표시 (디버그용 X — 실제론 옆 텍스트로) */}
      {trendUp ? null : null}
    </svg>
  );
}

export function ScoreHistoryChart({ history }: { history: ScorePoint[] }) {
  if (history.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4 text-center">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">점수 변화</div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          이 종목의 점수 히스토리가 아직 쌓이지 않았습니다. 매일 자동으로 기록됩니다.
        </p>
      </div>
    );
  }

  const composite = history.map((h) => h.composite);
  const momentum = history.map((h) => h.momentum);
  const flow = history.map((h) => h.flow);
  const value = history.map((h) => h.value);
  const vol = history.map((h) => h.vol);

  const firstComp = composite[0];
  const lastComp = composite[composite.length - 1];
  const delta = lastComp - firstComp;
  const trendUp = delta > 0;
  const trendDown = delta < 0;

  const firstDate = history[0]?.date;
  const lastDate = history[history.length - 1]?.date;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4">
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">점수 변화</div>
          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 tabular-nums">
            {firstDate} ~ {lastDate} · {history.length}일
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl md:text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{Math.round(lastComp)}</div>
          <div className={"text-sm font-semibold tabular-nums " + (trendUp ? "text-emerald-600 dark:text-emerald-400" : trendDown ? "text-rose-600 dark:text-rose-400" : "text-zinc-500 dark:text-zinc-400")}>
            {trendUp ? "▲" : trendDown ? "▼" : "—"} {Math.abs(delta).toFixed(1)}
          </div>
        </div>
      </div>

      {/* 종합 점수 큰 차트 */}
      <div className="mb-4">
        <Sparkline values={composite} color={METRIC_COLORS.composite} height={70} width={400} />
      </div>

      {/* 4지표 작은 차트 */}
      <div className="grid grid-cols-2 gap-3">
        <MiniChart label="모멘텀" values={momentum} color={METRIC_COLORS.momentum} />
        <MiniChart label="자금흐름" values={flow} color={METRIC_COLORS.flow} />
        <MiniChart label="밸류" values={value} color={METRIC_COLORS.value} />
        <MiniChart label="변동성조정" values={vol} color={METRIC_COLORS.vol} />
      </div>
    </div>
  );
}

function MiniChart({ label, values, color }: { label: string; values: number[]; color: string }) {
  const first = values[0] ?? 0;
  const last = values[values.length - 1] ?? 0;
  const delta = last - first;
  const trendUp = delta > 0;
  return (
    <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-md p-2">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[11px] text-zinc-600 dark:text-zinc-400">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">{Math.round(last)}</span>
          {Math.abs(delta) >= 0.5 ? (
            <span className={"text-[10px] tabular-nums " + (trendUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
              {trendUp ? "+" : ""}{delta.toFixed(1)}
            </span>
          ) : null}
        </div>
      </div>
      <Sparkline values={values} color={color} height={28} width={200} />
    </div>
  );
}
