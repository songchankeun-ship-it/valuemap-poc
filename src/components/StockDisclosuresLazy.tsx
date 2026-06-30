"use client";

import dynamic from "next/dynamic";

/**
 * 공시 탭 콘텐츠 지연 로딩 래퍼.
 * - StockDisclosures 는 기본 탭이 아닌 '공시' 탭에서만 마운트되고, 데이터도
 *   useEffect 로 클라이언트에서 직접 받아온다(현재도 SSR 은 로딩 셸만 렌더).
 * - 따라서 First Load JS 에서 분리해 탭 활성화 시점에만 청크를 받아도 동작 무변경.
 * - props·API·문구 동일.
 */
const StockDisclosures = dynamic(
  () => import("./StockDisclosures").then((m) => m.StockDisclosures),
  {
    ssr: false,
    loading: () => (
      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 text-sm text-zinc-500 dark:text-zinc-400"
        aria-busy="true"
      >
        공시 정보를 불러오는 중…
      </div>
    ),
  },
);

export function StockDisclosuresLazy({ ticker }: { ticker: string }) {
  return <StockDisclosures ticker={ticker} />;
}
