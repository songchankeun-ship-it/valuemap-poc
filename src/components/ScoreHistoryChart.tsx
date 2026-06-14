import type { ScorePoint } from "@/lib/scoreHistory";
import { compositeOf } from "@/lib/score";

const METRIC_COLORS: Record<string, string> = {
  composite: "#3b82f6",
  momentum: "#3b82f6",
  flow: "#10b981",
  value: "#06b6d4",
  vol: "#f97316",
};

function Sparkline({ values, color, height = 40, width = 240 }: { values: number[]; color: string; height?: number; width?: number }) {
  if (values.length < 2) {
    return (
      <div className="flex items-center justify-center text-[10px] text-zinc-400 dark:text-zinc-500" style={{ height }}>
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
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="2,3" className="text-zinc-400" />
      <polygon points={`0,${height} ${points} ${width},${height}`} fill={color} fillOpacity="0.08" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width} cy={lastY} r="3" fill={color} />
    </svg>
  );
}

function StatBox({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-md px-2 py-1.5 text-center">
      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{label}</div>
      <div className={"text-base md:text-lg font-bold tabular-nums " + (tone ?? "text-zinc-900 dark:text-zinc-100")}>{value}</div>
    </div>
  );
}

/**
 * 점수 변화 — '현재'는 페이지의 권위값(currentScore)을 그대로 쓰고,
 * '이전'은 기록을 4지표에서 재계산해 stale 저장값 혼선을 막는다.
 * 기록 10회 미만이면 추세 그래프 대신 숫자만 보여준다.
 */
export function ScoreHistoryChart({ history, currentScore }: { history: ScorePoint[]; currentScore: number }) {
  const cur = Math.round(currentScore);

  if (history.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">점수 변화</div>
        <div className="grid grid-cols-3 gap-2">
          <StatBox label="현재" value={String(cur)} />
          <StatBox label="이전" value="—" />
          <StatBox label="변화" value="—" />
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2">
          점수 히스토리가 아직 쌓이지 않았습니다. 매일 자동으로 기록됩니다.
        </p>
      </div>
    );
  }

  const comp = history.map((h) => compositeOf(h));
  const prevRec = comp.length >= 2 ? comp[comp.length - 2] : comp[comp.length - 1];
  const prev = Math.round(prevRec);
  const change = cur - prev;
  const prevDate = history.length >= 2 ? history[history.length - 2]?.date : history[0]?.date;
  const enough = history.length >= 10;
  const changeTone =
    change > 0 ? "text-emerald-600 dark:text-emerald-400" : change < 0 ? "text-rose-600 dark:text-rose-400" : "text-zinc-500 dark:text-zinc-400";

  const momentum = history.map((h) => h.momentum);
  const flow = history.map((h) => h.flow);
  const value = history.map((h) => h.value);
  const vol = history.map((h) => h.vol);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4">
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-1">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">점수 변화</div>
        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 tabular-nums">
          기록 {history.length}회{enough ? "" : " · 10회부터 추세 그래프"}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatBox label="현재" value={String(cur)} />
        <StatBox label={"이전" + (prevDate ? " · " + prevDate.slice(5) : "")} value={String(prev)} />
        <StatBox label="변화" value={(change > 0 ? "+" : "") + change} tone={changeTone} />
      </div>

      {enough ? (
        <div className="mb-4">
          <Sparkline values={comp} color={METRIC_COLORS.composite} height={70} width={400} />
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <MiniChart label="추세" values={momentum} color={METRIC_COLORS.momentum} />
        <MiniChart label="거래활성도" values={flow} color={METRIC_COLORS.flow} />
        <MiniChart label="밸류" values={value} color={METRIC_COLORS.value} />
        <MiniChart label="위험조정" values={vol} color={METRIC_COLORS.vol} />
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
