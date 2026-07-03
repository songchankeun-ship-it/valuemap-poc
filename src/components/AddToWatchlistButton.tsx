"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import {
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
} from "@/lib/watchlist";

type Toast = { kind: "added" } | { kind: "removed" } | null;

export function AddToWatchlistButton({
  ticker,
  name,
}: {
  ticker: string;
  name: string;
}) {
  const [isAdded, setIsAdded] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [loading, setLoading] = useState(true);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // 언마운트 시 대기 중인 토스트 자동 소멸 타이머 해제
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // 추가는 짧게(2.5s), 제거는 되돌릴 시간을 주려 조금 길게(5s) 노출
  function flashToast(kind: "added" | "removed") {
    setToast({ kind });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), kind === "removed" ? 5000 : 2500);
  }

  async function handleClick() {
    if (loading) return;
    if (isAdded) {
      setIsAdded(false); // 낙관적 업데이트
      flashToast("removed");
      await removeFromWatchlist(ticker);
    } else {
      setIsAdded(true); // 낙관적 업데이트
      flashToast("added");
      await addToWatchlist(ticker);
    }
  }

  // 방금 제거한 종목을 다시 담아 되돌리기(같은 낙관적 업데이트·이벤트 흐름 유지)
  async function undoRemove() {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
    setIsAdded(true); // 낙관적 업데이트
    await addToWatchlist(ticker);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-md border text-sm font-medium transition disabled:opacity-50 ${
          isAdded
            ? "bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-900 text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-950/50"
            : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
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

      {/* 토스트 영역 — 항상 렌더해 스크린리더가 변화를 읽도록 aria-live 유지.
          모바일에서는 하단 탭바(MobileBottomNav) 위로 띄우고 데스크톱은 bottom-6. */}
      <div
        aria-live="polite"
        className="fixed left-1/2 -translate-x-1/2 z-50 bottom-[calc(3.5rem_+_env(safe-area-inset-bottom))] lg:bottom-6 w-[calc(100vw_-_2rem)] max-w-sm flex justify-center px-2 pointer-events-none"
      >
        {toast ? (
          toast.kind === "added" ? (
            <div className="pointer-events-auto bg-zinc-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <Heart className="w-4 h-4 text-pink-400 shrink-0" fill="currentColor" />
              <span className="break-keep">{name} 관심 종목 추가됨</span>
              <Link
                href="/watchlist"
                className="inline-flex items-center min-h-[44px] text-pink-300 hover:text-pink-200 font-medium"
              >
                목록 보기 →
              </Link>
            </div>
          ) : (
            <div className="pointer-events-auto bg-zinc-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <Heart className="w-4 h-4 text-zinc-400 shrink-0" strokeWidth={1.8} />
              <span className="break-keep">{name} 관심 종목에서 제거됨</span>
              <button
                type="button"
                onClick={() => { void undoRemove(); }}
                className="inline-flex items-center min-h-[44px] text-pink-300 hover:text-pink-200 font-semibold"
              >
                실행 취소
              </button>
            </div>
          )
        ) : null}
      </div>
    </>
  );
}
