"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, X, Clock, ArrowRight } from "lucide-react";
import {
  getWatchlist,
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

export function WatchlistClient({
  allStocks,
}: {
  allStocks: { ticker: string; name: string }[];
}) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [recent, setRecent] = useState<RecentView[]>([]);
  const [loading, setLoading] = useState(true);

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
          <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900">
            <Heart className="w-4 h-4 text-pink-600" fill="currentColor" />
            관심 종목
            <span className="text-xs text-zinc-500 font-normal">
              {watchlist.length}개
            </span>
          </h2>
        </div>

        {watchlist.length === 0 ? (
          <div className="bg-zinc-50 border border-dashed border-zinc-300 rounded-lg p-8 text-center">
            <Heart className="w-8 h-8 text-zinc-300 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-sm text-zinc-600 mb-1">관심 종목이 없어요</p>
            <p className="text-xs text-zinc-500 mb-4">
              종목 페이지에서 ♥ 버튼을 누르면 여기 모입니다.
            </p>
            <Link
              href="/stocks"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              종목 둘러보기 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <ul className="bg-white border border-zinc-200 rounded-lg divide-y divide-zinc-100">
            {watchlist.map((item) => {
              const name = nameOf(item.ticker);
              return (
                <li key={item.ticker} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50">
                  <Link
                    href={`/stock/${item.ticker}`}
                    className="flex-1 flex items-center gap-3 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-900 group-hover:text-blue-600 truncate">
                        {name}
                      </div>
                      <div className="text-xs text-zinc-500 tabular-nums">
                        {item.ticker} · 추가 {formatTime(item.addedAt)}
                      </div>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.ticker)}
                    className="ml-2 p-1.5 text-zinc-400 hover:text-red-600 transition"
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
          <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900">
            <Clock className="w-4 h-4 text-zinc-600" />
            최근 본 종목
            <span className="text-xs text-zinc-500 font-normal">
              {recent.length}개
            </span>
          </h2>
          {recent.length > 0 ? (
            <button
              type="button"
              onClick={clearRecent}
              className="text-xs text-zinc-500 hover:text-red-600"
            >
              전체 삭제
            </button>
          ) : null}
        </div>

        {recent.length === 0 ? (
          <div className="bg-zinc-50 border border-dashed border-zinc-300 rounded-lg p-6 text-center">
            <p className="text-xs text-zinc-500">
              종목 페이지를 둘러보면 여기 기록이 쌓여요.
            </p>
          </div>
        ) : (
          <ul className="bg-white border border-zinc-200 rounded-lg divide-y divide-zinc-100">
            {recent.map((item) => (
              <li key={item.ticker} className="hover:bg-zinc-50">
                <Link
                  href={`/stock/${item.ticker}`}
                  className="flex items-center justify-between px-4 py-3 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-900 group-hover:text-blue-600 truncate">
                      {item.name}
                    </div>
                    <div className="text-xs text-zinc-500 tabular-nums">
                      {item.ticker} · {formatTime(item.viewedAt)}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-blue-600 transition" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}