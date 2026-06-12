"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Search, TrendingUp, Bell } from "lucide-react";

const STORAGE_KEY = "valuemap_welcome_dismissed_v1";

/**
 * 첫 방문자에게만 한 번 보이는 '3단계 사용법' 안내 박스.
 * X 누르거나 LocalStorage에 표시되면 다시 안 보임.
 */
export function WelcomeOnboarding() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) setShow(true);
    } catch {
      // localStorage 차단된 경우 — 그냥 표시 안 함
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setShow(false);
  }

  if (!show) return null;

  return (
    <section className="relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-4 md:p-5">
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-2 right-2 p-1.5 rounded-md text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition"
        aria-label="안내 닫기"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">👋</span>
        <h2 className="text-sm md:text-base font-bold text-amber-900 dark:text-amber-200">
          처음 오셨나요? 3단계로 사용해보세요
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        <div className="bg-white/80 dark:bg-zinc-900/60 rounded-lg p-3 border border-amber-100 dark:border-amber-900/50">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
              1
            </div>
            <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">오늘의 후보 종목 보기</div>
          </div>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed mb-2">
            네 지표가 우호적인 상위 5개 종목을 확인하세요.
          </p>
          <Link
            href="/today"
            className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-medium hover:underline"
          >
            <TrendingUp className="w-3 h-3" />
            오늘 페이지 →
          </Link>
        </div>

        <div className="bg-white/80 dark:bg-zinc-900/60 rounded-lg p-3 border border-amber-100 dark:border-amber-900/50">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
              2
            </div>
            <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">관심 종목 깊이 보기</div>
          </div>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed mb-2">
            점수 옆 <strong>(?)</strong>를 누르면 각 지표 의미를 알 수 있어요.
          </p>
          <Link
            href="/stocks"
            className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-medium hover:underline"
          >
            <Search className="w-3 h-3" />
            전체 138개 종목 →
          </Link>
        </div>

        <div className="bg-white/80 dark:bg-zinc-900/60 rounded-lg p-3 border border-amber-100 dark:border-amber-900/50">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
              3
            </div>
            <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">알림 받기 (선택)</div>
          </div>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed mb-2">
            관심 종목에 ❤ 등록하면 새 공시 신호 발생 시 이메일 발송.
          </p>
          <Link
            href="/settings/notifications"
            className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-medium hover:underline"
          >
            <Bell className="w-3 h-3" />
            알림 설정 →
          </Link>
        </div>
      </div>

      <p className="text-[10px] text-amber-800 dark:text-amber-300 mt-3 leading-relaxed">
        ⚠ 본 도구는 매수·매도 추천이 아니라 <strong>데이터 기반 탐색 우선순위</strong>를 제공합니다. 투자 결정은 본인이 직접.
      </p>
    </section>
  );
}
