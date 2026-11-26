import { getPriceHistory } from "@/lib/priceHistory";
import { alignPairPrices } from "@/lib/pairPriceSeries";

type Instrument = { ticker: string; name: string };

function formatChange(normalized: number) {
  const change = normalized - 100;
  return Math.abs(change) < 0.05 ? "0.0%" : `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
}

export async function PairPriceChart({
  a,
  b,
  asOf,
}: {
  a: Instrument;
  b: Instrument;
  asOf?: string | null;
}) {
  const [aHistory, bHistory] = await Promise.all([getPriceHistory(a.ticker), getPriceHistory(b.ticker)]);
  const prices = alignPairPrices(aHistory?.points ?? [], bHistory?.points ?? [], asOf);
  if (!prices) {
    return (
      <figure className="research-chart research-chart-empty">
        <figcaption className="text-sm font-semibold">종가 흐름</figcaption>
        <p className="text-sm text-[#b8cec5]">비교 가능한 공통 거래일 데이터가 부족합니다.</p>
      </figure>
    );
  }

  const width = 440;
  const height = 150;
  const left = 34;
  const right = 9;
  const top = 12;
  const bottom = 13;
  const values = prices.flatMap((point) => [point.a, point.b]);
  const low = Math.min(100, ...values);
  const high = Math.max(100, ...values);
  const step = high - low > 30 ? 10 : high - low > 12 ? 5 : high - low > 4 ? 2 : 1;
  const min = Math.min(100 - step, Math.floor(low / step) * step);
  const max = Math.max(100 + step, Math.ceil(high / step) * step);
  const x = (i: number) => left + (i / (prices.length - 1)) * (width - left - right);
  const y = (value: number) => top + ((max - value) / (max - min)) * (height - top - bottom);
  const line = (side: "a" | "b") => prices.map((point, i) => `${x(i).toFixed(1)},${y(point[side]).toFixed(1)}`).join(" ");
  const lastIndex = prices.length - 1;
  const last = prices[lastIndex];
  const start = prices[0];

  return (
    <figure className="research-chart">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-[15px] font-semibold">종가 흐름</span>
        <span className="text-[11px] text-[#b8cec5]">{prices.length}거래일 · 시작 종가 100</span>
      </figcaption>
      <div className="research-chart-legend">
        {([{ instrument: a, side: "a" }, { instrument: b, side: "b" }] as const).map(({ instrument, side }) => (
          <div className="min-w-0 flex items-baseline justify-between gap-2" key={instrument.ticker}>
            <span className="min-w-0 flex items-center gap-2 text-[12px] leading-tight">
              <span className={`research-chart-key research-series-${side}`} aria-hidden="true" />
              <span className="break-keep">{instrument.name}</span>
            </span>
            <span className={`research-series-${side} shrink-0 font-mono text-[15px] font-semibold tabular-nums`}>
              {formatChange(last[side])}
            </span>
          </div>
        ))}
      </div>
      <svg className="research-chart-plot" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        {[...new Set([max, 100, min])].map((level) => (
          <g key={level}>
            <line x1={left} x2={width - right} y1={y(level)} y2={y(level)} stroke={level === 100 ? "#70887e" : "#354c45"} strokeDasharray={level === 100 ? "3 4" : undefined} />
            <text x={left - 6} y={y(level) + 4} textAnchor="end" fill="#b8cec5" fontSize="11">{level}</text>
          </g>
        ))}
        {(["a", "b"] as const).map((side) => (
          <g key={side} className={`research-series-${side}`}>
            <polyline fill="none" stroke="currentColor" strokeWidth="2.3" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={side === "b" ? "6 3" : undefined} points={line(side)} />
            <circle cx={x(lastIndex)} cy={y(last[side])} r="3.1" fill="currentColor" />
          </g>
        ))}
      </svg>
      <div className="flex justify-between gap-3 text-[11px] font-mono tabular-nums text-[#b8cec5]">
        <time dateTime={start.date}>{start.date}</time>
        <time dateTime={last.date}>{last.date}</time>
      </div>
    </figure>
  );
}
