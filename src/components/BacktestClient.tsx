"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, ShieldAlert } from "lucide-react";
import { BacktestLimitBadges } from "@/components/BacktestLimitBadges";
import { BacktestRiskNotice } from "@/components/backtest/BacktestRiskNotice";
import { MonthlyHeatmap } from "@/components/backtest/MonthlyHeatmap";
import { DrawdownChart } from "@/components/backtest/DrawdownChart";
import { ContributionBars } from "@/components/backtest/ContributionBars";

interface StratMetrics {
  totalReturn: number;
  cagr: number;
  benchmarkReturn: number;
  alpha: number;
  maxDrawdown: number;
  benchmarkMdd?: number;
  sharpe: number;
  benchmarkSharpe?: number;
  winRate: number;
  years: number;
  tradeCount: number;
  avgTurnover?: number;
  yearly?: Record<string, number>;
}
interface EquityPoint { month: string; equity: number; benchmark: number }
interface Strategy {
  id: string;
  label: string;
  metrics: StratMetrics;
  equityCurveMonthly: EquityPoint[];
  monthlyReturns: Record<string, number>;
  latestHoldings?: string[];
  contributors?: { ticker: string; pnl: number; pct: number }[];
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

// 서버/클라이언트 locale 차이(예: "PM" vs "오후")로 인한 hydration mismatch를 피하기 위해
// toLocaleString 대신 결정적(deterministic) 한국어 포맷을 직접 만든다.
function formatGeneratedAt(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const yyyy = d.getFullYear();
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const h24 = d.getHours();
  const ampm = h24 < 12 ? "오전" : "오후";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const min = String(d.getMinutes()).padStart(2, "0");
  const sec = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}. ${mm}. ${dd}. ${ampm} ${h12}:${min}:${sec}`;
}

// 등락 의미색(상승=빨강·하락=파랑). 수익 그룹 KPI에 사용.
function upDownTone(x: number) {
  return x >= 0 ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400";
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

// KPI 셀: 주값 + (선택) 벤치마크 대비 보조줄.
function KpiCell({
  label,
  value,
  valueTone,
  benchLabel,
}: {
  label: string;
  value: string;
  valueTone?: string;
  benchLabel?: string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 break-keep">{label}</div>
      <div className={"text-lg font-bold tabular-nums " + (valueTone || "text-zinc-900 dark:text-zinc-100")}>{value}</div>
      {benchLabel ? (
        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums mt-0.5">{benchLabel}</div>
      ) : null}
    </div>
  );
}

export function BacktestClient({ data, names = {}, siteDataAsOf }: { data: BacktestData; names?: Record<string, string>; siteDataAsOf?: string }) {
  const [activeId, setActiveId] = useState(
    data.strategies.find((s) => s.id === "composite")?.id || data.strategies[0]?.id
  );
  const active = data.strategies.find((s) => s.id === activeId) || data.strategies[0];
  const m = active.metrics;

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8">
      <header>
        <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">← 홈으로</Link>
        <h1 className="text-2xl font-bold mt-2 text-zinc-900 dark:text-zinc-100">실험 전략 백테스트</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          과거 가격 데이터로 가격 기반 실험 전략을 시뮬레이션한 결과입니다 · 현재 종합점수 검증 결과는 아닙니다.
        </p>
        <div className="mt-3">
          <BacktestLimitBadges />
        </div>
      </header>

      <BacktestRiskNotice assumptions={data.assumptions} benchmarkLabel={data.benchmarkLabel} />

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

      {/* KPI: 수익 그룹 / 위험 그룹을 시각적으로 분리 (설계서 §11.2·§20.7) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" aria-hidden="true" />
            <h2 className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">수익</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <KpiCell label="CAGR (연복리)" value={pct(m.cagr)} valueTone={upDownTone(m.cagr)} />
            <KpiCell
              label="총수익률"
              value={pct(m.totalReturn)}
              valueTone={upDownTone(m.totalReturn)}
              benchLabel={`벤치 ${pct(m.benchmarkReturn)}`}
            />
            <KpiCell label="누적 초과수익 (vs 벤치)" value={pct(m.alpha) + "p"} valueTone={upDownTone(m.alpha)} />
          </div>
        </div>

        <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" aria-hidden="true" />
            <h2 className="text-xs font-semibold text-rose-700 dark:text-rose-300">위험</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <KpiCell
              label="MDD (최대낙폭)"
              value={pct(m.maxDrawdown)}
              valueTone="text-rose-600 dark:text-rose-400"
              benchLabel={m.benchmarkMdd !== undefined ? `벤치 ${pct(m.benchmarkMdd)}` : undefined}
            />
            <KpiCell
              label="Sharpe (위험조정)"
              value={m.sharpe.toFixed(2)}
              benchLabel={m.benchmarkSharpe !== undefined ? `벤치 ${m.benchmarkSharpe.toFixed(2)}` : undefined}
            />
            <KpiCell label="승률 (월)" value={(m.winRate * 100).toFixed(0) + "%"} />
          </div>
        </div>
      </div>

      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 -mt-2 leading-relaxed">
        수익(왼쪽)과 위험(오른쪽)을 함께 보세요. 수익률이 높아도 낙폭·변동성이 크면 체감 위험은 커집니다.
        {m.benchmarkMdd !== undefined && m.benchmarkSharpe !== undefined ? (
          <> 이 전략 <strong className="text-zinc-700 dark:text-zinc-200 tabular-nums">MDD {pct(m.maxDrawdown)}</strong>(벤치 {pct(m.benchmarkMdd)}) · <strong className="text-zinc-700 dark:text-zinc-200 tabular-nums">Sharpe {m.sharpe.toFixed(2)}</strong>(벤치 {m.benchmarkSharpe.toFixed(2)}).</>
        ) : null}
      </p>

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

      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">낙폭(언더워터)</h3>
          <span className="text-[11px] text-rose-600 dark:text-rose-400 tabular-nums">최대낙폭 {pct(m.maxDrawdown)}</span>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-3">직전 고점 대비 하락폭. 0 아래로 깊을수록 손실 구간이 크고 길었습니다.</p>
        <DrawdownChart data={active.equityCurveMonthly} maxDrawdown={m.maxDrawdown} />
      </section>

      <MonthlyHeatmap monthlyReturns={active.monthlyReturns} />

      {m.yearly && Object.keys(m.yearly).length > 0 ? (
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-3">연도별 수익률</h3>
          <div className="space-y-1.5">
            {Object.entries(m.yearly).map(([y, r]) => (
              <div key={y} className="flex items-center gap-2 text-xs">
                <span className="w-10 text-zinc-500 dark:text-zinc-400 tabular-nums shrink-0">{y}</span>
                <div className="flex-1 h-4 bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden">
                  <div className={"h-full " + (r >= 0 ? "bg-red-400 dark:bg-red-500" : "bg-blue-400 dark:bg-blue-500")} style={{ width: Math.min(100, Math.abs(r) * 100) + "%" }} />
                </div>
                <span className={"w-16 text-right tabular-nums shrink-0 " + (r >= 0 ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400")}>{pct(r)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-zinc-600 dark:text-zinc-400">
            <div>전략 MDD <strong className="text-zinc-900 dark:text-zinc-100">{pct(m.maxDrawdown)}</strong>{m.benchmarkMdd !== undefined ? <> vs 벤치 {pct(m.benchmarkMdd)}</> : null}</div>
            <div>전략 Sharpe <strong className="text-zinc-900 dark:text-zinc-100">{m.sharpe.toFixed(2)}</strong>{m.benchmarkSharpe !== undefined ? <> vs 벤치 {m.benchmarkSharpe.toFixed(2)}</> : null}</div>
            {m.avgTurnover !== undefined ? <div>월평균 회전율 <strong className="text-zinc-900 dark:text-zinc-100">{(m.avgTurnover * 100).toFixed(0)}%</strong></div> : null}
            <div>총 거래 <strong className="text-zinc-900 dark:text-zinc-100">{m.tradeCount}건</strong></div>
          </div>
          {m.benchmarkSharpe != null && m.benchmarkMdd != null && m.totalReturn > m.benchmarkReturn && (m.maxDrawdown < m.benchmarkMdd || m.sharpe < m.benchmarkSharpe) ? (
            <p className="mt-3 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              ⚠ 총수익률은 벤치마크보다 높았지만, {m.maxDrawdown < (m.benchmarkMdd ?? 0) ? "최대낙폭이 더 크고 " : ""}{m.sharpe < (m.benchmarkSharpe ?? 99) ? "위험조정 성과(Sharpe)가 더 낮습니다" : "낙폭이 더 큽니다"}. 수익률만 보지 말고 낙폭·변동성을 함께 확인하세요.
            </p>
          ) : null}
        </section>
      ) : null}

      {active.contributors && active.contributors.length > 0 ? (
        <div className="space-y-3">
          <ContributionBars contributors={active.contributors} names={names} />
          {active.latestHoldings && active.latestHoldings.length > 0 ? (
            <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
              <div className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-0.5">마지막 리밸런싱 구성 예시 {active.latestHoldings.length}종목</div>
              <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-2 leading-relaxed">과거 백테스트 규칙을 마지막 리밸런싱 시점에 적용했을 때의 구성 예시입니다 · 현재 확인 후보나 추천이 아닙니다.</div>
              <div className="flex flex-wrap gap-1.5">
                {active.latestHoldings.map((tk) => (
                  <Link key={tk} href={"/stock/" + tk} prefetch={false} className="text-[11px] px-2 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-blue-400 transition">{names[tk] ?? tk}</Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      {/* 세 가지 날짜를 분리 표기 — 백테스트 생성일 / 데이터 기간 / 사이트 현재 데이터 기준 (서로 다름) */}
      <section className="text-[11px] text-zinc-500 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800 pt-4 space-y-1 leading-relaxed">
        <div>데이터 기간 <strong className="text-zinc-700 dark:text-zinc-300 tabular-nums">{data.period.from} ~ {data.period.to}</strong> ({data.period.years}년) · 유니버스 {data.universe}종목</div>
        <div>백테스트 생성일 <strong className="text-zinc-700 dark:text-zinc-300 tabular-nums">{formatGeneratedAt(data.generatedAt)}</strong> · KRX 일별 종가(FDR)</div>
        {siteDataAsOf ? (
          <div>사이트 현재 데이터 기준 <strong className="text-zinc-700 dark:text-zinc-300 tabular-nums">{siteDataAsOf}</strong> 장마감 · 위 백테스트 기간과 다릅니다</div>
        ) : null}
      </section>

      <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-700 dark:text-blue-400 border-t border-zinc-200 dark:border-zinc-800 pt-4">
        <Link href="/guide/metrics" className="hover:underline">지표 계산 방식 보기 →</Link>
        <Link href="/status" className="hover:underline">데이터 상태 확인 →</Link>
      </nav>
    </div>
  );
}
