"use client";

import { useState } from "react";
import Link from "next/link";

interface StratMetrics {
  totalReturn: number;
  cagr: number;
  benchmarkReturn: number;
  alpha: number;
  maxDrawdown: number;
  sharpe: number;
  winRate: number;
  years: number;
  tradeCount: number;
}
interface EquityPoint { month: string; equity: number; benchmark: number }
interface Strategy {
  id: string;
  label: string;
  metrics: StratMetrics;
  equityCurveMonthly: EquityPoint[];
  monthlyReturns: Record<string, number>;
}
export interface BacktestData {
  realData: boolean;
  generatedAt: string;
  period: { from: string; to: string; years: number };
  universe: number;
  benchmarkLabel: string;
  assumptions: string;
  config: { topN: number; rebalance: string; initialCapital: number };
  strategies: Strategy[];
}

function pct(x: number, digits = 1) {
  return (x >= 0 ? "+" : "") + (x * 100).toFixed(digits) + "%";
}

function EquityChart({ data }: { data: EquityPoint[] }) {
  const W = 720;
  const H = 280;
  const padL = 56;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const xs = data.map((_, i) => i);
  const vals = data.flatMap((d) => [d.equity, d.benchmark]).filter((v) => v > 0);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const xAt = (i: number) =>
    padL + (xs.length <= 1 ? 0 : (i / (xs.length - 1)) * (W - padL - padR));
  const yAt = (v: number) =>
    padT + (1 - (v - minV) / (maxV - minV || 1)) * (H - padT - padB);

  const line = (key: "equity" | "benchmark") =>
    data.map((d, i) => (i === 0 ? "M" : "L") + xAt(i).toFixed(1) + " " + yAt(d[key]).toFixed(1)).join(" ");

  // y축 눈금 (시작자본 배수 기준)
  const init = data[0]?.equity || 10_000_000;
  const ticks = 4;
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) => minV + ((maxV - minV) * i) / ticks);

  // x축 라벨 (처음/중간/끝)
  const labelIdx = [0, Math.floor(data.length / 2), data.length - 1].filter(
    (v, i, a) => a.indexOf(v) === i && v >= 0
  );

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="누적 수익 곡선">
      {tickVals.map((tv, i) => (
        <g key={i}>
          <line x1={padL} y1={yAt(tv)} x2={W - padR} y2={yAt(tv)} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeWidth={1} />
          <text x={padL - 6} y={yAt(tv) + 3} textAnchor="end" className="fill-zinc-400 text-[9px]">
            {(tv / init).toFixed(1)}x
          </text>
        </g>
      ))}
      {labelIdx.map((i) => (
        <text key={i} x={xAt(i)} y={H - 8} textAnchor="middle" className="fill-zinc-400 text-[9px]">
          {data[i]?.month}
        </text>
      ))}
      <path d={line("benchmark")} fill="none" stroke="currentColor" className="text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} strokeDasharray="4 3" />
      <path d={line("equity")} fill="none" stroke="currentColor" className="text-blue-600 dark:text-blue-400" strokeWidth={2} />
    </svg>
  );
}

export function BacktestClient({ data }: { data: BacktestData }) {
  const [activeId, setActiveId] = useState(
    data.strategies.find((s) => s.id === "composite")?.id || data.strategies[0]?.id
  );
  const active = data.strategies.find((s) => s.id === activeId) || data.strategies[0];
  const m = active.metrics;

  const metricCards: { label: string; value: string; tone?: string }[] = [
    { label: "총수익률", value: pct(m.totalReturn), tone: m.totalReturn >= 0 ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400" },
    { label: "CAGR", value: pct(m.cagr) },
    { label: `알파 (vs 벤치마크)`, value: pct(m.alpha), tone: m.alpha >= 0 ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400" },
    { label: "MDD", value: pct(m.maxDrawdown), tone: "text-blue-600 dark:text-blue-400" },
    { label: "Sharpe", value: m.sharpe.toFixed(2) },
    { label: "승률(월)", value: (m.winRate * 100).toFixed(0) + "%" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8">
      <header>
        <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">← 홈으로</Link>
        <h1 className="text-2xl font-bold mt-2 text-zinc-900 dark:text-zinc-100">백테스트</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          실데이터 검증 · {data.period.from} ~ {data.period.to} ({data.period.years}년) · 유니버스 {data.universe}종목
        </p>
      </header>

      <div className="flex gap-1.5 flex-wrap">
        {data.strategies.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveId(s.id)}
            className={"text-xs px-3 py-1.5 rounded-full border transition " +
              (activeId === s.id
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-blue-400")}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {metricCards.map((c) => (
          <div key={c.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{c.label}</div>
            <div className={"text-lg font-bold tabular-nums " + (c.tone || "text-zinc-900 dark:text-zinc-100")}>{c.value}</div>
          </div>
        ))}
      </div>

      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{active.label} 누적 수익</h3>
          <div className="flex items-center gap-3 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 bg-blue-600 dark:bg-blue-400" />전략</span>
            <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 border-t border-dashed border-zinc-400" />{data.benchmarkLabel}</span>
          </div>
        </div>
        <EquityChart data={active.equityCurveMonthly} />
      </section>

      <section className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
        <strong className="block mb-1">⚠️ 읽을 때 주의</strong>
        가정: {data.assumptions}. 벤치마크는 <strong>{data.benchmarkLabel}</strong>. 과거 펀더멘털·수급 데이터가 없어
        밸류·자금흐름 전략은 백테스트에서 제외했고, 가격으로 복원 가능한 신호만 검증했습니다.
        과거 성과가 미래 수익을 보장하지 않습니다.
      </section>

      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
        생성: {new Date(data.generatedAt).toLocaleString("ko-KR")} · 데이터: KRX 일별 종가(FDR)
      </p>
    </div>
  );
}
