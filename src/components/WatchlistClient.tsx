"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Clock, Trash2 } from "lucide-react";

interface WatchlistItem {
  ticker: string;
  name: string;
  addedAt: number;
}

interface RecentViewItem {
  ticker: string;
  name: string;
  viewedAt: number;
}

const WATCHLIST_KEY = "valuemap_watchlist";
const RECENT_KEY = "valuemap_recent_views";

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "방금";
  if (diff < hour) return Math.floor(diff / minute) + "분 전";
  if (diff < day) return Math.floor(diff / hour) + "시간 전";
  return Math.floor(diff / day) + "일 전";
}

export function WatchlistClient() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [recent, setRecent] = useState<RecentViewItem[]>([]);

  useEffect(() => {
    function load() {
      try {
        const wRaw = localStorage.getItem(WATCHLIST_KEY);
        setWatchlist(wRaw ? JSON.parse(wRaw) : []);
        const rRaw = localStorage.getItem(RECENT_KEY);
        setRecent(rRaw ? JSON.parse(rRaw) : []);
      } catch {
        setWatchlist([]);
        setRecent([]);
      }
    }
    load();
    function onStorage(e: StorageEvent) {
      if (e.key === WATCHLIST_KEY || e.key === RECENT_KEY) load();
    }
    function onCustom() { load(); }
    window.addEventListener("storage", onStorage);
    window.addEventListener("watchlist-changed", onCustom as EventListener);
    window.addEventListener("recent-views-changed", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("watchlist-changed", onCustom as EventListener);
      window.removeEventListener("recent-views-changed", onCustom as EventListener);
    };
  }, []);

  function removeFromWatchlist(ticker: string) {
    const next = watchlist.filter((item) => item.ticker !== ticker);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
    setWatchlist(next);
    window.dispatchEvent(new CustomEvent("watchlist-changed"));
  }

  function clearRecent() {
    localStorage.removeItem(RECENT_KEY);
    setRecent([]);
    window.dispatchEvent(new CustomEvent("recent-views-changed"));
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-zinc-900">관심 종목 &amp; 최근 본 종목</h1>
        <p className="text-xs text-zinc-500 mt-1">
          이 브라우저에만 저장됩니다. 다른 기기에서는 보이지 않아요.
        </p>
      </header>

      <section className="bg-white border border-zinc-200 rounded-lg p-5">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-600" fill="currentColor" strokeWidth={2} />
            관심 종목 <span className="text-zinc-400 tabular-nums">({watchlist.length})</span>
          </h2>
        </div>
        {watchlist.length === 0 ? (
          <div className="text-sm text-zinc-500 text-center py-10">
            아직 관심 종목이 없습니다.<br/>
            <span className="text-xs text-zinc-400 mt-2 block">종목 상세 페이지에서 ♡ 관심 버튼을 눌러 추가하세요.</span>
            <Link href="/stocks" className="inline-block mt-4 px-4 py-2 text-xs bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition">
              종목 탐색으로
            </Link>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {watchlist.map((item) => (
              <li key={item.ticker} className="flex items-center justify-between gap-2 py-2 px-2 -mx-2 rounded hover:bg-zinc-50">
                <Link href={"/stock/" + item.ticker} className="flex-1 min-w-0 flex items-center gap-3">
                  <span className="font-medium text-zinc-900 truncate">{item.name}</span>
                  <span className="text-[10px] text-zinc-400 tabular-nums shrink-0">{item.ticker}</span>
                  <span className="text-[10px] text-zinc-400 shrink-0">{formatTime(item.addedAt)} 추가</span>
                </Link>
                <button
                  type="button"
                  onClick={() => removeFromWatchlist(item.ticker)}
                  className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded transition shrink-0"
                  title="관심 종목에서 제거"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white border border-zinc-200 rounded-lg p-5">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-500" strokeWidth={1.8} />
            최근 본 종목 <span className="text-zinc-400 tabular-nums">({recent.length})</span>
          </h2>
          {recent.length > 0 ? (
            <button
              type="button"
              onClick={clearRecent}
              className="text-[10px] text-zinc-500 hover:text-zinc-900 hover:underline"
            >
              기록 삭제
            </button>
          ) : null}
        </div>
        {recent.length === 0 ? (
          <div className="text-sm text-zinc-500 text-center py-10">
            아직 본 종목이 없습니다.
          </div>
        ) : (
          <ul className="space-y-0.5">
            {recent.map((item) => (
              <li key={item.ticker}>
                <Link href={"/stock/" + item.ticker} className="flex items-center justify-between gap-3 py-2 px-2 -mx-2 rounded hover:bg-zinc-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-medium text-zinc-900 truncate">{item.name}</span>
                    <span className="text-[10px] text-zinc-400 tabular-nums shrink-0">{item.ticker}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 shrink-0">{formatTime(item.viewedAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="text-[10px] text-zinc-400 leading-relaxed border-t border-zinc-200 pt-3">
        관심 종목과 최근 본 기록은 모두 이 브라우저의 로컬 저장소에만 보관됩니다. 시크릿 모드/다른 브라우저에서는 보이지 않으며, 브라우저 데이터를 지우면 사라집니다.
      </section>
    </div>
  );
}