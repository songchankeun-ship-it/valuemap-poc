"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getCompareList,
  removeFromCompare,
  clearCompare,
} from "@/lib/compare";

interface CompareStock {
  ticker: string;
  name: string;
  currentPrice: number;
  changePct: number;
  marketCap: number;
  per: number;
  pbr: number;
  roe: number;
  dividendYield: number;
  momentum: number;
  flow: number;
  value: number;
  vol: number;
  neglectScore: number;
  themes: string[];
}

const SCORE_KEYS: Array<{ key: "momentum" | "flow" | "value" | "vol" | "neglectScore"; label: string; color: string }> = [
  { key: "momentum",     label: "모멘텀",   color: "bg-brand-500" },
  { key: "flow",         label: "자금흐름", color: "bg-blue-500" },
  { key: "value",        label: "밸류",     color: "bg-emerald-500" },
  { key: "vol",          label: "변동성조정", color: "bg-purple-500" },
  { key: "neglectScore", label: "소외",     color: "bg-amber-500" },
];

const FUND_ROWS: Array<{ key: "per" | "pbr" | "roe" | "dividendYield"; label: string; suffix: string; better: "low" | "high" }> = [
  { key: "per",           label: "PER",   suffix: "배",  better: "low" },
  { key: "pbr",           label: "PBR",   suffix: "배",  better: "low" },
  { key: "roe",           label: "ROE",   suffix: "%",   better: "high" },
  { key: "dividendYield", label: "배당", suffix: "%",   better: "high" },
];

function formatMarketCap(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(1)}조`;
  }
  if (value >= 100_000_000) {
    return `${(value / 100_000_000).toFixed(0)}억`;
  }
  return value.toLocaleString();
}

export function CompareClient({ stockMap }: { stockMap: Record<string, CompareStock> }) {
  const [tickers, setTickers] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let active = true;

    function reload() {
      getCompareList().then((list) => {
        if (active) setTickers(list);
      });
    }

    setMounted(true);
    reload();

    function onUpdate() {
      reload();
    }
    window.addEventListener("compare-basket-changed", onUpdate);
    window.addEventListener("valuemap:compare-updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      active = false;
      window.removeEventListener("compare-basket-changed", onUpdate);
      window.removeEventListener("valuemap:compare-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  async function remove(ticker: string) {
    setTickers((prev) => prev.filter((t) => t !== ticker)); // 낙관적
    await removeFromCompare(ticker);
  }

  async function clearAll() {
    if (!confirm("비교 목록을 모두 비울까요?")) return;
    setTickers([]); // 낙관적
    await clearCompare();
  }

  if (!mounted) return null;

  const stocks = tickers
    .map((t) => stockMap[t])
    .filter((s): s is CompareStock => Boolean(s));

  if (stocks.length === 0) {
    return (
      <section className="bg-white border border-zinc-200 rounded-xl p-10 text-center">
        <div className="text-4xl mb-3">📊</div>
        <h2 className="text-base font-semibold text-zinc-900 mb-2">비교할 종목이 없어요</h2>
        <p className="text-sm text-zinc-500 mb-6 max-w-md mx-auto leading-relaxed">
          종목 페이지에서 <strong>"비교에 추가"</strong> 버튼을 눌러 종목을 모아주세요.
          여기서 나란히 보여드릴게요.
        </p>
        <Link href="/stocks" className="inline-block px-5 py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition">
          종목 둘러보기 →
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>비교 중인 종목 <strong className="text-zinc-900">{stocks.length}</strong>개</span>
        <button onClick={clearAll} className="text-zinc-500 hover:text-red-600 transition">모두 비우기</button>
      </div>

      {/* 기본 정보 카드 */}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${stocks.length}, minmax(0, 1fr))` }}>
        {stocks.map((s) => {
          const isUp = s.changePct > 0;
          const isDown = s.changePct < 0;
          const priceColor = isUp ? "text-red-600" : isDown ? "text-blue-600" : "text-zinc-500";
          return (
            <div key={s.ticker} className="bg-white border border-zinc-200 rounded-xl p-4 shadow-soft relative">
              <button
                onClick={() => remove(s.ticker)}
                aria-label="비교에서 제거"
                className="absolute top-2 right-2 p-1.5 rounded-md text-zinc-400 hover:bg-red-50 hover:text-red-600 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <Link href={`/stock/${s.ticker}`} className="block">
                <div className="text-[10px] text-zinc-400 font-mono mb-0.5">{s.ticker}</div>
                <div className="text-sm font-semibold text-zinc-900 mb-2 truncate">{s.name}</div>
                <div className="text-base font-bold text-zinc-900 tabular-nums">{s.currentPrice.toLocaleString()}<span className="text-xs font-normal text-zinc-500 ml-1">원</span></div>
                <div className={`text-xs font-medium tabular-nums ${priceColor}`}>
                  {isUp ? "▲" : isDown ? "▼" : "—"} {Math.abs(s.changePct).toFixed(2)}%
                </div>
                <div className="text-[10px] text-zinc-400 mt-2">시총 {formatMarketCap(s.marketCap)}</div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* 자체 지표 비교 */}
      <section className="bg-white border border-zinc-200 rounded-xl p-5 shadow-soft">
        <h3 className="text-sm font-semibold text-zinc-900 mb-4">자체 지표 4종 + 소외</h3>
        <div className="space-y-3">
          {SCORE_KEYS.map(({ key, label, color }) => {
            const max = Math.max(...stocks.map((s) => s[key]));
            return (
              <div key={key}>
                <div className="text-[11px] font-medium text-zinc-500 mb-1.5 uppercase tracking-wide">{label}</div>
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${stocks.length}, minmax(0, 1fr))` }}>
                  {stocks.map((s) => {
                    const v = s[key];
                    const pct = Math.max(0, Math.min(100, v));
                    const isMax = v === max && stocks.length > 1;
                    return (
                      <div key={s.ticker}>
                        <div className="flex items-baseline justify-between mb-0.5">
                          <span className="text-[10px] text-zinc-500 truncate">{s.name}</span>
                          <span className={`text-xs font-bold tabular-nums ${isMax ? "text-zinc-900" : "text-zinc-700"}`}>{Math.round(v)}</span>
                        </div>
                        <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div className={`h-full ${color} ${isMax ? "" : "opacity-70"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 재무 비교 표 */}
      <section className="bg-white border border-zinc-200 rounded-xl p-5 shadow-soft">
        <h3 className="text-sm font-semibold text-zinc-900 mb-4">재무</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="text-left text-[11px] font-medium text-zinc-500 uppercase pb-2">항목</th>
              {stocks.map((s) => (
                <th key={s.ticker} className="text-right text-[11px] font-medium text-zinc-500 pb-2">{s.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FUND_ROWS.map(({ key, label, suffix, better }) => {
              const vals = stocks.map((s) => s[key]);
              const best = better === "low" ? Math.min(...vals.filter((v) => v > 0)) : Math.max(...vals);
              return (
                <tr key={key} className="border-b border-zinc-100 last:border-0">
                  <td className="py-2.5 text-zinc-600">{label}</td>
                  {stocks.map((s) => {
                    const v = s[key];
                    const isBest = v === best && stocks.length > 1;
                    return (
                      <td key={s.ticker} className={`py-2.5 text-right tabular-nums ${isBest ? "text-emerald-700 font-semibold" : "text-zinc-700"}`}>
                        {v > 0 ? v.toFixed(2) : "-"}<span className="text-[10px] text-zinc-400 ml-0.5">{suffix}</span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-[10px] text-zinc-400 mt-3">* PER/PBR은 낮을수록, ROE/배당은 높을수록 좋음 — 가장 좋은 값을 <span className="text-emerald-700 font-semibold">초록</span>으로 표시.</p>
      </section>

      {/* 테마 비교 */}
      <section className="bg-white border border-zinc-200 rounded-xl p-5 shadow-soft">
        <h3 className="text-sm font-semibold text-zinc-900 mb-4">테마</h3>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${stocks.length}, minmax(0, 1fr))` }}>
          {stocks.map((s) => (
            <div key={s.ticker}>
              <div className="text-[10px] text-zinc-500 mb-2 truncate">{s.name}</div>
              <div className="flex flex-wrap gap-1">
                {s.themes.map((t) => (
                  <Link key={t} href={`/stocks?theme=${encodeURIComponent(t)}`} className="text-[10px] px-1.5 py-0.5 bg-zinc-100 text-zinc-700 rounded hover:bg-zinc-200 transition">
                    #{t}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
