/**
 * MDD / 낙폭(언더워터) 차트 (설계서 §11.3). 순수 SVG — 외부 차트 라이브러리 없음.
 * equityCurveMonthly.equity 의 직전 고점 대비 하락폭(drawdown = equity/runningMax - 1)을
 * 0 기준선 아래 면적으로 그린다. 위험 강조이므로 0 아래만 표시하고, 최저점(최대낙폭) 월을 표시한다.
 * EquityChart 와 동일한 viewBox + w-full h-auto 반응형. 색은 하락=파랑(한국식 등락 색).
 */

interface EquityPoint {
  month: string;
  equity: number;
  benchmark: number;
}

function fmtPct(v: number) {
  return (v >= 0 ? "+" : "") + (v * 100).toFixed(1) + "%";
}

export function DrawdownChart({ data, maxDrawdown }: { data: EquityPoint[]; maxDrawdown?: number }) {
  if (!data || data.length < 2) return null;

  // 직전 고점 대비 낙폭(0 또는 음수) 계산
  let peak = -Infinity;
  const dd = data.map((d) => {
    peak = Math.max(peak, d.equity);
    return peak > 0 ? d.equity / peak - 1 : 0;
  });

  const W = 720;
  const H = 200;
  const padL = 44;
  const padR = 16;
  const padT = 14;
  const padB = 26;

  const minDd = Math.min(...dd, 0); // 가장 깊은 낙폭 (음수)
  const xAt = (i: number) =>
    padL + (data.length <= 1 ? 0 : (i / (data.length - 1)) * (W - padL - padR));
  // 0 은 위쪽, minDd 는 아래쪽
  const yAt = (v: number) =>
    padT + (v / (minDd || -1)) * (H - padT - padB);

  const troughIdx = dd.reduce((best, v, i) => (v < dd[best] ? i : best), 0);
  const troughVal = dd[troughIdx];

  const areaPath =
    "M" + xAt(0).toFixed(1) + " " + yAt(0).toFixed(1) + " " +
    dd.map((v, i) => "L" + xAt(i).toFixed(1) + " " + yAt(v).toFixed(1)).join(" ") + " " +
    "L" + xAt(data.length - 1).toFixed(1) + " " + yAt(0).toFixed(1) + " Z";
  const linePath = dd
    .map((v, i) => (i === 0 ? "M" : "L") + xAt(i).toFixed(1) + " " + yAt(v).toFixed(1))
    .join(" ");

  // y 눈금 (0, 절반, 최저)
  const tickVals = [0, minDd / 2, minDd];
  const labelIdx = [0, Math.floor(data.length / 2), data.length - 1].filter(
    (v, i, a) => a.indexOf(v) === i && v >= 0
  );

  const ddLabel = maxDrawdown !== undefined ? fmtPct(maxDrawdown) : fmtPct(troughVal);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      role="img"
      aria-label={`낙폭(언더워터) 차트. 최대 낙폭 ${ddLabel}, 최저점 ${data[troughIdx]?.month}`}
    >
      {tickVals.map((tv, i) => (
        <g key={i}>
          <line
            x1={padL}
            y1={yAt(tv)}
            x2={W - padR}
            y2={yAt(tv)}
            stroke="currentColor"
            className="text-zinc-200 dark:text-zinc-800"
            strokeWidth={1}
          />
          <text x={padL - 6} y={yAt(tv) + 3} textAnchor="end" className="fill-zinc-400 text-[9px]">
            {(tv * 100).toFixed(0)}%
          </text>
        </g>
      ))}
      {labelIdx.map((i) => (
        <text key={i} x={xAt(i)} y={H - 7} textAnchor="middle" className="fill-zinc-400 text-[9px]">
          {data[i]?.month}
        </text>
      ))}
      <path d={areaPath} className="fill-blue-500/20 dark:fill-blue-400/20" stroke="none" />
      <path d={linePath} fill="none" stroke="currentColor" className="text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
      {/* 최저점 표시 */}
      <circle cx={xAt(troughIdx)} cy={yAt(troughVal)} r={2.5} className="fill-blue-700 dark:fill-blue-300" />
      <text
        x={Math.min(W - padR, Math.max(padL, xAt(troughIdx)))}
        y={yAt(troughVal) + 12}
        textAnchor="middle"
        className="fill-blue-700 dark:fill-blue-300 text-[9px] font-semibold tabular-nums"
      >
        최대낙폭 {ddLabel}
      </text>
    </svg>
  );
}
