"use client";

import Link from "next/link";
import { ArrowRight, GitCompare } from "lucide-react";
import { useCompareCount } from "@/components/CompareCountProvider";
import { clearCompare, COMPARE_MAX } from "@/lib/compare";
import { useLanguage } from "@/components/LanguageProvider";
import { compareTrayCopy } from "@/lib/copy/stockDetail";
import { trackEvent } from "@/lib/clientAnalytics";

// Desktop keeps the tray. Mobile shows the same basket count in bottom navigation.
export function CompareTray() {
  const { locale } = useLanguage();
  const t = compareTrayCopy[locale];
  const count = useCompareCount();

  // 비우기 — 결과 화면 '모두 비우기'와 동일하게 확인 후 비교함을 초기화한다.
  // 실제 비우기/브로드캐스트는 compare.ts가 소유하고, count는 basket-changed 이벤트로 갱신된다.
  function reset() {
    if (!confirm("비교함을 모두 비울까요?")) return;
    trackEvent("compare_tray_reset", { count });
    void clearCompare();
  }

  if (count === 0) return null;

  return (
    <>
      {/* 고정 트레이가 마지막 콘텐츠를 가리지 않도록 흐름 내 여백 확보(보일 때만 렌더) */}
      <div aria-hidden="true" className="hidden lg:block lg:h-16" />
      <div
        role="region"
        aria-label={t.ariaLabel}
        className="desk-chrome desk-compare-tray hidden lg:block fixed bottom-6 right-3 z-30"
      >
        <div className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white/95 dark:bg-zinc-900/95 backdrop-blur px-2 py-1.5 sm:px-3 sm:py-2 shadow-lg max-w-[calc(100vw-1.5rem)]">
          <div className="flex items-center gap-1.5 min-w-0">
            <GitCompare className="h-4 w-4 shrink-0 desk-accent" aria-hidden="true" />
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200 tabular-nums whitespace-nowrap">
              {t.basketPrefix} {count}/{COMPARE_MAX}
            </span>
            <span className="hidden md:inline text-[11px] text-zinc-600 dark:text-zinc-300 truncate">
              {t.hint}
            </span>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center shrink-0 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-rose-600 hover:border-rose-300 dark:hover:text-rose-400 px-3 min-h-[44px] text-xs font-medium whitespace-nowrap transition"
          >
            {t.reset}
          </button>
          <Link
            href="/compare"
            prefetch={false}
            data-analytics-event="compare_tray_open"
            data-analytics-count={String(count)}
            className="inline-flex items-center gap-1 shrink-0 rounded-md desk-compare-cta text-white px-3 min-h-10 sm:min-h-[44px] text-xs font-semibold whitespace-nowrap transition"
          >
            {t.cta}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </>
  );
}
