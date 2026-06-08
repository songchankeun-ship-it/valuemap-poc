"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import {
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
} from "@/lib/watchlist";

export function AddToWatchlistButton({
  ticker,
  name,
}: {
  ticker: string;
  name: string;
}) {
  const [isAdded, setIsAdded] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);

  // 초기 상태 로드
  useEffect(() => {
    let mounted = true;
    isInWatchlist(ticker).then((result) => {
      if (mounted) {
        setIsAdded(result);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [ticker]);

  // 외부 변경 감지
  useEffect(() => {
    function onChange() {
      isInWatchlist(ticker).then((result) => setIsAdded(result));
    }
    window.addEventListener("watchlist-changed", onChange);
    return () => window.removeEventListener("watchlist-changed", onChange);
  }, [ticker]);

  async function handleClick() {
    if (loading) return;
    if (isAdded) {
      setIsAdded(false); // 낙관적 업데이트
      await removeFromWatchlist(ticker);
    } else {
      setIsAdded(true); // 낙관적 업데이트
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
      await addToWatchlist(ticker);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm font-medium transition disabled:opacity-50 ${
          isAdded
            ? "bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100"
            : "bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50"
        }`}
        aria-label={isAdded ? "관심 종목에서 제거" : "관심 종목에 추가"}
      >
        <Heart
          className="w-4 h-4"
          fill={isAdded ? "currentColor" : "none"}
          strokeWidth={isAdded ? 0 : 1.8}
        />
        {isAdded ? "관심 등록됨" : "관심 종목"}
      </button>

      {showToast ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2">
          <Heart className="w-4 h-4 text-pink-400" fill="currentColor" />
          <span>{name} 관심 종목 추가됨</span>
          <Link
            href="/watchlist"
            className="text-pink-300 hover:text-pink-200 font-medium ml-2"
          >
            [목록 보기 →]
          </Link>
        </div>
      ) : null}
    </>
  );
}
