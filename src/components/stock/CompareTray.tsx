"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, GitCompare } from "lucide-react";
import { getCompareList, COMPARE_MAX } from "@/lib/compare";
import { useLanguage } from "@/components/LanguageProvider";
import { compareTrayCopy } from "@/lib/copy/stockDetail";

/**
 * 설계서 5-8: 종목 상세 하단 비교 유도.
 * 비교함에 담긴 종목 수를 반영(비교함 N/4)하고 /compare로 연결만 한다.
 * 담기/빼기 상태(local/session·Supabase)는 compare.ts가 소유하며 이 컴포넌트는 재구현하지 않는다.
 * count 0에서 시작해 마운트 후 이벤트로 갱신 → SSR/CSR 모두 처음엔 null이라 하이드레이션 불일치 없음.
 * z-index는 AddToCompareButton 토스트(z-[100])보다 낮게 두고 모바일 하단 탭 위에 뜨게 한다.
 */
export function CompareTray() {
  const { locale } = useLanguage();
  const t = compareTrayCopy[locale];
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    function update() {
      getCompareList().then((list) => {
        if (mounted) setCount(list.length);
      });
    }
    update();
    window.addEventListener("compare-basket-changed", update);
    window.addEventListener("ornscore:compare-updated", update);
    window.addEventListener("valuemap:compare-updated", update);
    return () => {
      mounted = false;
      window.removeEventListener("compare-basket-changed", update);
      window.removeEventListener("ornscore:compare-updated", update);
      window.removeEventListener("valuemap:compare-updated", update);
    };
  }, []);

  if (count === 0) return null;

  return (
    <>
      {/* 고정 트레이가 마지막 콘텐츠를 가리지 않도록 흐름 내 여백 확보(보일 때만 렌더) */}
      <div aria-hidden="true" className="h-16" />
      <div
        role="region"
        aria-label={t.ariaLabel}
        className="fixed right-3 z-30 bottom-[calc(3.5rem_+_env(safe-area-inset-bottom)_+_0.75rem)] lg:bottom-6"
      >
        <div className="flex items-center gap-3 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white/95 dark:bg-zinc-900/95 backdrop-blur px-3 py-2 shadow-lg max-w-[calc(100vw-1.5rem)]">
          <div className="flex items-center gap-1.5 min-w-0">
            <GitCompare className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200 tabular-nums whitespace-nowrap">
              {t.basketPrefix} {count}/{COMPARE_MAX}
            </span>
            <span className="hidden sm:inline text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
              {t.hint}
            </span>
          </div>
          <Link
            href="/compare"
            prefetch={false}
            className="inline-flex items-center gap-1 shrink-0 rounded-full bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 text-xs font-semibold transition"
          >
            {t.cta}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </>
  );
}
