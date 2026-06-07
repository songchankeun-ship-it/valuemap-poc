"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";

interface Props {
  ticker: string;
  name: string;
}

interface WatchlistItem {
  ticker: string;
  name: string;
  addedAt: number;
}

const STORAGE_KEY = "valuemap_watchlist";

export function AddToWatchlistButton({ ticker, name }: Props) {
  const [inWatchlist, setInWatchlist] = useState(false);
  const [toast, setToast] = useState({ msg: "", show: false });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const list: WatchlistItem[] = JSON.parse(raw);
      setInWatchlist(list.some((item) => item.ticker === ticker));
    } catch {}
  }, [ticker]);

  const toggle = () => {
    let list: WatchlistItem[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) list = JSON.parse(raw);
    } catch {}
    const willBeIn = !inWatchlist;
    if (inWatchlist) {
      list = list.filter((item) => item.ticker !== ticker);
    } else {
      list.push({ ticker, name, addedAt: Date.now() });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    setInWatchlist(willBeIn);
    window.dispatchEvent(new CustomEvent("watchlist-changed"));
    setToast({
      msg: willBeIn ? name + "을(를) 관심 종목에 추가했습니다" : name + "을(를) 관심 종목에서 제거했습니다",
      show: true,
    });
    setTimeout(() => setToast({ msg: "", show: false }), 3000);
  };

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        className={"px-3 py-1.5 border rounded-md text-sm transition flex items-center gap-1.5 " + (
          inWatchlist
            ? "bg-pink-50 border-pink-300 text-pink-700"
            : "border-zinc-300 text-zinc-700 hover:border-pink-300 hover:text-pink-600"
        )}
        title={inWatchlist ? "관심 종목에서 제거" : "관심 종목에 추가"}
      >
        <Heart className="w-3.5 h-3.5" fill={inWatchlist ? "currentColor" : "none"} strokeWidth={2} />
        <span>{inWatchlist ? "관심" : "관심"}</span>
      </button>

      {toast.show ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 text-white px-4 py-2.5 rounded-lg shadow-xl text-sm flex items-center gap-3 max-w-[90vw]">
          <span className="truncate">{toast.msg}</span>
          <Link href="/watchlist" className="text-pink-300 hover:text-pink-200 hover:underline shrink-0 font-medium">
            관심 종목 →
          </Link>
        </div>
      ) : null}
    </>
  );
}