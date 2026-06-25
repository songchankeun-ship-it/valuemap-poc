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
import { getRecentViews, type RecentView } from "@/lib/recentViews";

const RECENT_KEY = "ornscore_recent_views";
const VIEW_KEY = "ornscore_watchlist_view";
const LEGACY_VIEW_KEY = "valuemap_watchlist_view";

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
  treasury_buy: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900",
  insider_buy: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900",
  correction: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900",
  single_contract: "bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-900",
  capital_raise: "bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-900",
};

export function WatchlistClient({
  allStocks,
  tickerToSignal = {},
  tickerToDelta = {},
  isLoggedIn = false,
}: {
  allStocks: StockInfo[];
  tickerToSignal?: Record<string, SignalInfo>;
  tickerToDelta?: Record<string, number>;
  isLoggedIn?: boolean;
}) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [recent, setRecent] = useState<RecentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [view, setView] = useState<"simple" | "analysis">("simple");

  useEffect(() => {
    const v = typeof window !== "undefined" ? localStorage.getItem(VIEW_KEY) ?? localStorage.getItem(LEGACY_VIEW_KEY) : null;
    if (v === "analysis" || v === "simple") setView(v);
  }, []);

  function changeView(v: "simple" | "analysis") {
    setView(v);
    if (typeof window !== "undefined") {
      localStorage.setItem(VIEW_KEY, v);
      localStorage.removeItem(LEGACY_VIEW_KEY);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const wl = await getWatchlist();
        if (mounted) {
          setWatchlist(wl);
          setRecent(getRecentViews());
        }
      } catch {
        if (mounted) setLoadError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    // 무한 로딩 방지 — 8초 후 강제 종료
    const loadTimeout = setTimeout(() => { if (mounted) setLoading(false); }, 8000);

    function onWatchlistChange() {
      getWatchlist().then((wl) => {
        if (mounted) setWatchlist(wl);
      });
    }
    function onRecentChange() {
      if (mounted) setRecent(getRecentViews());
    }

    window.addEventListener("watchlist-changed", onWatchlistChange);
    window.addEventListener("recent-views-changed", onRecentChange);

    return () => {
      mounted = false;
      clearTimeout(loadTimeout);
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

  if (loadError) {
    return (
      <div className="text-sm text-zinc-500 dark:text-zinc-400 py-8 text-center space-y-2">
        <div>관심 종목을 불러오지 못했어요.</div>
        <button onClick={() => window.location.reload()} className="text-xs px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 hover:border-blue-400 hover:text-blue-700 dark:hover:text-blue-400 transition">다시 시도</button>
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
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-6 md:p-8 text-center">
            <Heart className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-sm md:text-base font-semibold text-zinc-800 dark:text-zinc-100 mb-1.5">아직 관심 종목이 없습니다</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 max-w-sm mx-auto leading-relaxed">
              종목을 저장하면 매일 <strong className="text-zinc-700 dark:text-zinc-300">점수 변화</strong>와 <strong className="text-zinc-700 dark:text-zinc-300">공시 신호</strong>를 한곳에서 추적할 수 있어요. ♥ 버튼이나 아래 검색으로 추가하세요.
            </p>
            <div className="mb-4">
              <StockSearchBox stocks={allStocks} onPick={(t) => { void addToWatchlist(t); }} placeholder="관심 종목 검색해서 추가" />
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 max-w-md mx-auto">
              <Link href="/stocks" className="flex-1 inline-flex items-center justify-center gap-1 px-4 py-2.5 min-h-[44px] rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition">
                종목 탐색하러 가기 <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link href="/today" className="flex-1 inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-medium hover:border-zinc-400 dark:hover:border-zinc-600 transition">
                오늘의 후보 보기
              </Link>
            </div>
            {!isLoggedIn ? (
              <Link href="/login" className="mt-3 inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                로그인하고 여러 기기에서 동기화하기 <ArrowRight className="w-3 h-3" />
              </Link>
            ) : null}
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
                            <span>점수 <strong className="text-zinc-700 dark:text-zinc-300">{info.compositeScore}</strong>{tickerToDelta[item.ticker] !== undefined && Math.round(tickerToDelta[item.ticker]) !== 0 ? <span className={"ml-0.5 " + (tickerToDelta[item.ticker] > 0 ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400")}>{tickerToDelta[item.ticker] > 0 ? "▲" : "▼"}{Math.abs(Math.round(tickerToDelta[item.ticker]))}</span> : null}</span>
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
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-1">
              방문한 종목이 자동으로 기록돼 다시 찾기 쉬워요.
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-3">
              종목 페이지를 한 번 열면 여기에 최근 10개까지 쌓입니다.
            </p>
            <Link href="/stocks" className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
              종목 탐색하러 가기 <ArrowRight className="w-3 h-3" />
            </Link>
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
