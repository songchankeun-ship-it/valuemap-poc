"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getCompareList,
  addToCompare,
  removeFromCompare,
  clearCompare,
} from "@/lib/compare";
import { getWatchlist } from "@/lib/watchlist";
import { getRecentViews } from "@/lib/recentViews";
import { sectorOf } from "@/lib/sector";
import { fmtMarketCap, fmtWon } from "@/lib/format";
import { StockSearchBox } from "@/components/StockSearchBox";

interface RecommendedSet {
  label: string;
  tickers: string[];
  names: string[];
}

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
  returns?: { r1m?: number; r3m?: number; r6m?: number };
}

const SCORE_KEYS: Array<{ key: "momentum" | "flow" | "value" | "vol"; label: string; color: string }> = [
  { key: "momentum", label: "추세",     color: "bg-brand-500" },
  { key: "flow",     label: "거래활성도",   color: "bg-blue-500" },
  { key: "value",    label: "밸류",       color: "bg-emerald-500" },
  { key: "vol",      label: "위험조정", color: "bg-purple-500" },
];

const FUND_ROWS: Array<{ key: "per" | "pbr" | "roe" | "dividendYield"; label: string; suffix: string; better: "low" | "high" }> = [
  { key: "per",           label: "PER",   suffix: "배",  better: "low" },
  { key: "pbr",           label: "PBR",   suffix: "배",  better: "low" },
  { key: "roe",           label: "ROE",   suffix: "%",   better: "high" },
  { key: "dividendYield", label: "배당", suffix: "%",   better: "high" },
];

// 모바일에서 가로 스크롤 wrapper. 데스크톱에선 그냥 grid.
function ScrollX({
  count,
  cardWidthPx = 200,
  gap = 12,
  children,
  className = "",
}: {
  count: number;
  cardWidthPx?: number;
  gap?: number;
  children: React.ReactNode;
  className?: string;
}) {
  const minWidth = count * cardWidthPx + (count - 1) * gap;
  return (
    <div className={`-mx-3 md:mx-0 px-3 md:px-0 overflow-x-auto md:overflow-visible ${className}`}>
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${count}, minmax(${cardWidthPx}px, 1fr))`,
          gap: `${gap}px`,
          minWidth: count > 2 ? `${minWidth}px` : "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function CompareClient({ stockMap, top5 = [], recommendedSets = [] }: { stockMap: Record<string, CompareStock>; top5?: Array<{ ticker: string; name: string }>; recommendedSets?: RecommendedSet[] }) {
  const [tickers, setTickers] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [watchlist, setWatchlist] = useState<Array<{ ticker: string; name: string }>>([]);
  const [recentViews, setRecentViews] = useState<Array<{ ticker: string; name: string }>>([]);

  useEffect(() => {
    let active = true;

    function reload() {
      getCompareList().then((list) => {
        if (active) setTickers(list);
      });
    }

    // 최근 본 종목 — RecentViewTracker가 기록한 실제 방문 기록만 읽는다(이름은 stockMap으로 매핑, 풀에 없으면 제외, 가짜 항목 없음)
    function loadRecent() {
      if (!active) return;
      const mapped = getRecentViews()
        .map((r) => ({ ticker: r.ticker, name: stockMap[r.ticker]?.name }))
        .filter((x): x is { ticker: string; name: string } => Boolean(x.name));
      setRecentViews(mapped);
    }

    setMounted(true);
    reload();
    loadRecent();

    // 관심 종목에서 추가 — 마운트 시 1회 로드(이름은 stockMap으로 매핑, 풀에 없으면 제외)
    getWatchlist().then((items) => {
      if (!active) return;
      const mapped = items
        .map((it) => ({ ticker: it.ticker, name: stockMap[it.ticker]?.name }))
        .filter((x): x is { ticker: string; name: string } => Boolean(x.name));
      setWatchlist(mapped);
    });

    // 공유 링크(?stocks=005930,000660)에서 비교 바스켓 시드
    try {
      const shared = new URLSearchParams(window.location.search).get("stocks");
      if (shared) {
        const codes = shared.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 4);
        if (codes.length) Promise.all(codes.map((c) => addToCompare(c))).then(reload);
      }
    } catch {
      /* noop */
    }

    function onUpdate() {
      reload();
    }
    // 최근 본 종목이 바뀌거나(다른 탭/상세 방문) storage 이벤트가 오면 최근 목록도 갱신
    function onStorage() {
      reload();
      loadRecent();
    }
    window.addEventListener("compare-basket-changed", onUpdate);
    window.addEventListener("ornscore:compare-updated", onUpdate);
    window.addEventListener("valuemap:compare-updated", onUpdate);
    window.addEventListener("recent-views-changed", loadRecent);
    window.addEventListener("storage", onStorage);
    return () => {
      active = false;
      window.removeEventListener("compare-basket-changed", onUpdate);
      window.removeEventListener("ornscore:compare-updated", onUpdate);
      window.removeEventListener("valuemap:compare-updated", onUpdate);
      window.removeEventListener("recent-views-changed", loadRecent);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  async function remove(ticker: string) {
    setTickers((prev) => prev.filter((t) => t !== ticker));
    await removeFromCompare(ticker);
  }

  // 추천 세트 추가 — addToCompare가 매번 현재 목록을 읽으므로 순차 호출로 4개 상한을 지킨다.
  async function addSet(setTickers: string[]) {
    for (const t of setTickers) {
      await addToCompare(t);
    }
  }

  async function clearAll() {
    if (!confirm("비교 목록을 모두 비울까요?")) return;
    setTickers([]);
    await clearCompare();
  }

  function shareLink() {
    const url = `${window.location.origin}/compare?stocks=${tickers.join(",")}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => alert("공유 링크가 복사됐어요"));
    } else {
      alert(url);
    }
  }

  if (!mounted) return null;

  const stocks = tickers
    .map((t) => stockMap[t])
    .filter((s): s is CompareStock => Boolean(s));

  // 비교는 최소 2개부터 의미가 있으므로, 2개 미만이면 시작 화면을 보여준다.
  if (stocks.length < 2) {
    const selected = stocks[0]; // 0개 또는 1개
    const watchlistAddable = watchlist.filter((w) => !tickers.includes(w.ticker));
    // 최근 본 종목 — 이미 담은 종목은 제외. 실제 방문 기록이 1개 이상일 때만 노출(빈/가짜 칩 없음)
    const recentAddable = recentViews.filter((r) => !tickers.includes(r.ticker));
    return (
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 md:p-10">
        <div className="text-center">
          <div className="text-3xl md:text-4xl mb-3">📊</div>
          <h2 className="text-base md:text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">비교할 종목을 선택하세요</h2>
          <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mb-5 max-w-md mx-auto leading-relaxed">
            <strong className="text-zinc-700 dark:text-zinc-300">최소 2개 · 최대 4개</strong>를 골라 종합 점수 · PER/PBR/ROE · 수익률 · 위험을 나란히 비교할 수 있어요. 아래에서 바로 시작하세요.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-5">
          {/* 1) 직접 검색하기 — 빈 상태의 첫 행동 */}
          <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/20 p-4">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">종목명 또는 코드 검색</div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">검색 결과에서 최대 4개까지 담아 비교할 수 있어요.</p>
            <StockSearchBox stocks={Object.entries(stockMap).map(([ticker, st]) => ({ ticker, name: st.name }))} onPick={(t) => { void addToCompare(t); }} placeholder="예: 삼성전자, 005930" />
          </div>

          {/* 선택 칩 + 최소 2개 안내 — 1개 선택 시 */}
          {selected ? (
            <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 p-3">
              <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 mb-2 uppercase tracking-wide">선택한 종목</div>
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 text-xs pl-3 pr-1.5 py-1 min-h-[36px] rounded-full border border-blue-300 dark:border-blue-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100">
                  {selected.name}
                  <button
                    type="button"
                    onClick={() => remove(selected.ticker)}
                    aria-label={selected.name + " 비교에서 제거"}
                    className="w-5 h-5 flex items-center justify-center rounded-full text-zinc-400 hover:text-rose-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  >
                    ×
                  </button>
                </span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2 font-medium">비교하려면 1개 더 선택하세요 (최소 2개 · 최대 4개)</p>
            </div>
          ) : null}

          {/* 2) 추천 비교 세트 — 같은 업종끼리 한 번에 담기 */}
          {recommendedSets.length > 0 ? (
            <div>
              <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">추천 비교 세트</div>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-2">같은 업종 종목을 한 번에 담아 바로 비교를 시작할 수 있어요.</p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {recommendedSets.map((set) => (
                  <button
                    key={set.label}
                    type="button"
                    onClick={() => { void addSet(set.tickers); }}
                    className="w-full text-left px-3 py-2.5 min-h-[44px] rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition"
                  >
                    <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">{set.label} <span className="text-[10px] font-normal text-zinc-400 dark:text-zinc-500">{set.tickers.length}종목</span></div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{set.names.join(" · ")}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* 3) 최근 본 종목에서 추가 */}
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-3">
            <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">최근 본 종목에서 추가</div>
            {recentAddable.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {recentAddable.map((r) => (
                  <button
                    key={r.ticker}
                    type="button"
                    onClick={() => { void addToCompare(r.ticker); }}
                    className="text-xs px-2.5 py-1.5 min-h-[44px] rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-blue-400 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-400 transition"
                  >
                    + {r.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">종목 상세를 열어본 뒤 다시 오면 최근 본 종목에서 바로 추가할 수 있어요.</p>
            )}
          </div>

          {/* 3) 오늘 Top 5에서 고르기 */}
          {top5.length > 0 ? (
            <div>
              <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">오늘 Top 5에서 고르기</div>
              <div className="flex flex-wrap gap-1.5">
                {top5.map((s) => (
                  <button
                    key={s.ticker}
                    type="button"
                    onClick={() => { void addToCompare(s.ticker); }}
                    disabled={tickers.includes(s.ticker)}
                    className="text-xs px-2.5 py-1.5 min-h-[36px] rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-blue-400 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-400 transition disabled:opacity-40 disabled:hover:border-zinc-200"
                  >
                    {tickers.includes(s.ticker) ? "✓ " : "+ "}{s.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* 5) 관심 종목에서 추가 */}
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-3">
            <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">관심 종목에서 추가</div>
            {watchlistAddable.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {watchlistAddable.map((w) => (
                  <button
                    key={w.ticker}
                    type="button"
                    onClick={() => { void addToCompare(w.ticker); }}
                    className="text-xs px-2.5 py-1.5 min-h-[36px] rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-blue-400 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-400 transition"
                  >
                    + {w.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">관심 종목을 담아두면 여기서 바로 비교에 추가할 수 있어요.</p>
                <Link href="/watchlist" prefetch={false} className="text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline">관심 종목 보기</Link>
              </div>
            )}
          </div>

          {/* 6) 같은 업종에서 고르기 */}
          <div>
            <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">같은 업종에서 고르기</div>
            <Link href="/stocks" prefetch={false} className="inline-flex items-center gap-1 px-4 py-2.5 min-h-[44px] rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition">
              업종·테마로 종목 탐색 →
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>비교 중인 종목 <strong className="text-zinc-900 dark:text-zinc-100">{stocks.length}</strong>개</span>
        <div className="flex items-center gap-3">
          <button onClick={shareLink} className="text-blue-600 dark:text-blue-400 hover:underline">공유 링크 복사</button>
          <button onClick={clearAll} className="text-zinc-500 dark:text-zinc-400 hover:text-red-600 transition">모두 비우기</button>
        </div>
      </div>

      {stocks.length > 2 ? (
        <p className="md:hidden text-[11px] text-zinc-400 dark:text-zinc-500 -mt-2">← 가로로 스크롤하세요 →</p>
      ) : null}

      {/* 기본 정보 카드 */}
      <ScrollX count={stocks.length} cardWidthPx={200}>
        {stocks.map((s) => {
          const isUp = s.changePct > 0;
          const isDown = s.changePct < 0;
          const priceColor = isUp ? "text-red-600" : isDown ? "text-blue-600" : "text-zinc-500";
          return (
            <div key={s.ticker} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 md:p-4 shadow-soft relative">
              <button
                onClick={() => remove(s.ticker)}
                aria-label="비교에서 제거"
                className="absolute top-1.5 right-1.5 p-1.5 rounded-md text-zinc-400 dark:text-zinc-500 hover:bg-red-50 hover:text-red-600 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <Link href={`/stock/${s.ticker}`} className="block pr-6">
                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mb-0.5">{s.ticker}</div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2 truncate">{s.name}</div>
                <div className="text-base md:text-lg font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{fmtWon(s.currentPrice)}</div>
                <div className={`text-xs font-medium tabular-nums ${priceColor}`}>
                  {isUp ? "▲" : isDown ? "▼" : "—"} {Math.abs(s.changePct).toFixed(2)}%
                </div>
                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2">시총 {fmtMarketCap(s.marketCap)}</div>
                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">{sectorOf(s.themes)}</div>
              </Link>
            </div>
          );
        })}
      </ScrollX>

      {/* 자체 지표 비교 */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 md:p-5 shadow-soft">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3 md:mb-4">자체 지표 4종</h3>
        <div className="space-y-3">
          {SCORE_KEYS.map(({ key, label, color }) => {
            const max = Math.max(...stocks.map((s) => s[key]));
            return (
              <div key={key}>
                <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">{label}</div>
                <ScrollX count={stocks.length} cardWidthPx={120} gap={8}>
                  {stocks.map((s) => {
                    const v = s[key];
                    const pct = Math.max(0, Math.min(100, v));
                    const isMax = v === max && stocks.length > 1;
                    return (
                      <div key={s.ticker}>
                        <div className="flex items-baseline justify-between mb-0.5">
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{s.name}</span>
                          <span className={`text-xs font-bold tabular-nums ${isMax ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-700 dark:text-zinc-300"}`}>{Math.round(v)}</span>
                        </div>
                        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className={`h-full ${color} ${isMax ? "" : "opacity-70"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </ScrollX>
              </div>
            );
          })}
        </div>
      </section>

      {/* 재무 비교 표 — 가로 스크롤 */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 md:p-5 shadow-soft">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3 md:mb-4">재무</h3>
        <div className="-mx-3 md:mx-0 px-3 md:px-0 overflow-x-auto">
          <table className="w-full text-xs" style={{ minWidth: stocks.length > 2 ? `${100 + stocks.length * 80}px` : "auto" }}>
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase pb-2 sticky left-0 bg-white dark:bg-zinc-900">항목</th>
                {stocks.map((s) => (
                  <th key={s.ticker} className="text-right text-[11px] font-medium text-zinc-500 dark:text-zinc-400 pb-2 px-2 whitespace-nowrap">{s.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FUND_ROWS.map(({ key, label, suffix, better }) => {
                const vals = stocks.map((s) => s[key]);
                const best = better === "low" ? Math.min(...vals.filter((v) => v > 0)) : Math.max(...vals);
                return (
                  <tr key={key} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                    <td className="py-2.5 text-zinc-600 dark:text-zinc-400 sticky left-0 bg-white dark:bg-zinc-900">{label}</td>
                    {stocks.map((s) => {
                      const v = s[key];
                      const isBest = v === best && stocks.length > 1;
                      return (
                        <td key={s.ticker} className={`py-2.5 px-2 text-right tabular-nums whitespace-nowrap ${isBest ? "text-emerald-700 dark:text-emerald-400 font-semibold" : "text-zinc-700 dark:text-zinc-300"}`}>
                          {v > 0 ? v.toFixed(2) : "-"}<span className="text-[10px] text-zinc-400 dark:text-zinc-500 ml-0.5">{suffix}</span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-3">* PER/PBR은 낮을수록, ROE/배당은 높을수록 좋음 — 가장 좋은 값을 <span className="text-emerald-700 dark:text-emerald-400 font-semibold">초록</span>으로 표시.</p>
      </section>

      {/* 수익률 비교 */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 md:p-5 shadow-soft">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3 md:mb-4">수익률 <span className="text-[10px] font-normal text-zinc-400">(높을수록 강세)</span></h3>
        <div className="-mx-3 md:mx-0 px-3 md:px-0 overflow-x-auto">
          <table className="w-full text-xs" style={{ minWidth: stocks.length > 2 ? `${100 + stocks.length * 80}px` : "auto" }}>
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase pb-2 sticky left-0 bg-white dark:bg-zinc-900">기간</th>
                {stocks.map((s) => (
                  <th key={s.ticker} className="text-right text-[11px] font-medium text-zinc-500 dark:text-zinc-400 pb-2 px-2 whitespace-nowrap">{s.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {([["r1m", "1개월"], ["r3m", "3개월"], ["r6m", "6개월"]] as const).map(([k, label]) => {
                const nums = stocks.map((s) => s.returns?.[k]).filter((v): v is number => typeof v === "number");
                const best = nums.length > 0 ? Math.max(...nums) : undefined;
                return (
                  <tr key={k} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                    <td className="py-2.5 text-zinc-600 dark:text-zinc-400 sticky left-0 bg-white dark:bg-zinc-900">{label}</td>
                    {stocks.map((s) => {
                      const v = s.returns?.[k];
                      const has = typeof v === "number";
                      const isBest = has && v === best && stocks.length > 1;
                      return (
                        <td key={s.ticker} className={"py-2.5 px-2 text-right tabular-nums whitespace-nowrap " + (isBest ? "font-semibold " : "") + (has ? (v >= 0 ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400") : "text-zinc-400")}>
                          {has ? (v >= 0 ? "+" : "") + v.toFixed(0) + "%" : "—"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 테마 비교 */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 md:p-5 shadow-soft">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3 md:mb-4">테마</h3>
        <ScrollX count={stocks.length} cardWidthPx={140}>
          {stocks.map((s) => (
            <div key={s.ticker}>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-2 truncate">{s.name}</div>
              <div className="flex flex-wrap gap-1">
                {s.themes.map((t) => (
                  <Link key={t} href={`/stocks?theme=${encodeURIComponent(t)}`} className="text-[10px] px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">
                    #{t}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </ScrollX>
      </section>
    </div>
  );
}
