"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, X, Clock, ArrowRight } from "lucide-react";
import { StockSearchBox } from "@/components/StockSearchBox";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  type WatchlistItem,
} from "@/lib/watchlist";

type RecentView = {
  ticker: string;
  name: string;
  viewedAt: string;
};

const RECENT_KEY = "valuemap_recent_views";

function readRecent(): RecentView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 10);
  } catch {
    return [];
  }
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

type StockInfo = {
  ticker: string;
  name: string;
  momentum?: number;
  flow?: number;
  value?: number;
  vol?: number;
  compositeScore?: number;
};

type SignalInfo = {
  signalLabel: string;
  signalType: string;
  strength: number;
};

const SIGNAL_TONE: Record<string, string> = {
  treasury_buy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  insider_buy: "bg-blue-50 text-blue-700 border-blue-200",
  correction: "bg-amber-50 text-amber-700 border-amber-200",
  single_contract: "bg-sky-50 text-sky-700 border-sky-200",
  capital_raise: "bg-pink-50 text-pink-700 border-pink-200",
};

export function WatchlistClient({
  allStocks,
  tickerToSignal = {},
}: {
  allStocks: StockInfo[];
  tickerToSignal?: Record<string, SignalInfo>;
}) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [recent, setRecent] = useState<RecentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"simple" | "analysis">("simple");

  useEffect(() => {
    const v = typeof window !== "undefined" ? localStorage.getItem("valuemap_watchlist_view") : null;
    if (v === "analysis" || v === "simple") setView(v);
  }, []);

  function changeView(v: "simple" | "analysis") {
    setView(v);
    if (typeof window !== "undefined") localStorage.setItem("valuemap_watchlist_view", v);
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      const wl = await getWatchlist();
      if (mounted) {
        setWatchlist(wl);
        setRecent(readRecent());
        setLoading(false);
      }
    }
    load();

    function onWatchlistChange() {
      getWatchlist().then((wl) => {
        if (mounted) setWatchlist(wl);
      });
    }
    function onRecentChange() {
      if (mounted) setRecent(readRecent());
    }

    window.addEventListener("watchlist-changed", onWatchlistChange);
    window.addEventListener("recent-views-changed", onRecentChange);

    return () => {
      mounted = false;
      window.removeEventListener("watchlist-changed", onWatchlistChange);
      window.removeEventListener("recent-views-changed", onRecentChange);
    };
  }, []);

  async function handleRemove(ticker: string) {
    setWatchlist((prev) => prev.filter((i) => i.ticker !== ticker)); // 낙관적
    await removeFromWatchlist(ticker);
  }

  function clearRecent() {
    localStorage.removeItem(RECENT_KEY);
    setRecent([]);
    window.dispatchEvent(new CustomEvent("recent-views-changed"));
  }

  function nameOf(ticker: string): string {
    return allStocks.find((s) => s.ticker === ticker)?.name ?? ticker;
  }

  if (loading) {
    return (
      <div className="text-sm text-zinc-500 py-8 text-center">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 관심 종목 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            <Heart className="w-4 h-4 text-pink-600" fill="currentColor" />
            관심 종목
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
              {watchlist.length}개
            </span>
          </h2>
          {watchlist.length > 0 ? (
            <div className="flex gap-0.5 text-[11px] bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
              <button type="button" onClick={() => changeView("simple")} className={"px-2.5 py-1 rounded-md transition " + (view === "simple" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium shadow-sm" : "text-zinc-500 dark:text-zinc-400")}>간단</button>
              <button type="button" onClick={() => changeView("analysis")} className={"px-2.5 py-1 rounded-md transition " + (view === "analysis" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium shadow-sm" : "text-zinc-500 dark:text-zinc-400")}>분석</button>
            </div>
          ) : null}
        </div>

        {watchlist.length === 0 ? (
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-8 text-center">
            <Heart className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">관심 종목이 없어요</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
              추가하면 점수 변화·신규 공시·시장경보·거래량 급증을 한눈에 확인할 수 있어요. ♥ 버튼이나 아래 검색으로 추가하세요.
            </p>
            <div className="mb-4">
              <StockSearchBox stocks={allStocks} onPick={(t) => { void addToWatchlist(t); }} placeholder="관심 종목 검색해서 추가" />
            </div>
            <Link
              href="/stocks"
              className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
              종목 둘러보기 <ArrowRight className="w-3 h-3" />
            </Link>
            <div className="mt-4 flex items-center justify-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">많이 보는 종목:</span>
              {[["005930", "삼성전자"], ["000660", "SK하이닉스"], ["005380", "현대차"]].map(([t, n]) => (
                <Link key={t} href={"/stock/" + t} className="text-[11px] px-2 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-pink-400 dark:hover:border-pink-600 transition">{n}</Link>
              ))}
            </div>
          </div>
        ) : (
          <ul className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg divide-y divide-zinc-100 dark:divide-zinc-800">
            {watchlist.map((item) => {
              const info = allStocks.find((s) => s.ticker === item.ticker);
              const name = info?.name ?? item.ticker;
              const signal = tickerToSignal[item.ticker];
              return (
                <li key={item.ticker} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <Link
                    href={`/stock/${item.ticker}`}
                    className="flex-1 flex items-center gap-3 group min-w-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                          {name}
                        </span>
                        {signal ? (
                          <span className={"text-[10px] px-1.5 py-0.5 rounded border font-medium " + (SIGNAL_TONE[signal.signalType] || "bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700")}>
                            🔔 {signal.signalLabel}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums flex items-center gap-1.5 flex-wrap">
                        <span>{item.ticker}</span>
                        {info?.compositeScore !== undefined ? (
                          <>
                            <span className="text-zinc-300 dark:text-zinc-600">·</span>
                            <span>점수 <strong className="text-zinc-700 dark:text-zinc-300">{info.compositeScore}</strong></span>
                          </>
                        ) : null}
                        <span className="text-zinc-300 dark:text-zinc-600">·</span>
                        <span>추가 {formatTime(item.addedAt)}</span>
                      </div>
                      {view === "analysis" && info ? (
                        <div className="mt-2 grid grid-cols-4 gap-1.5">
                          {([["추세", info.momentum], ["거래", info.flow], ["밸류", info.value], ["위험", info.vol]] as const).map(([l, v]) => (
                            <div key={l} className="bg-zinc-50 dark:bg-zinc-800/50 rounded px-1.5 py-1 text-center">
                              <div className="text-[9px] text-zinc-400 dark:text-zinc-500">{l}</div>
                              <div className="text-[11px] font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">{v !== undefined ? Math.round(v) : "—"}</div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.ticker)}
                    className="ml-2 p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition shrink-0"
                    aria-label="관심 종목에서 제거"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* 최근 본 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            <Clock className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            최근 본 종목
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
              {recent.length}개
            </span>
          </h2>
          {recent.length > 0 ? (
            <button
              type="button"
              onClick={clearRecent}
              className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
            >
              전체 삭제
            </button>
          ) : null}
        </div>

        {recent.length === 0 ? (
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-6 text-center">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              종목 페이지를 둘러보면 여기 기록이 쌓여요.
            </p>
          </div>
        ) : (
          <ul className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg divide-y divide-zinc-100 dark:divide-zinc-800">
            {recent.map((item) => (
              <li key={item.ticker} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <Link
                  href={`/stock/${item.ticker}`}
                  className="flex items-center justify-between px-4 py-3 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                      {item.name}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                      {item.ticker} · {formatTime(item.viewedAt)}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}