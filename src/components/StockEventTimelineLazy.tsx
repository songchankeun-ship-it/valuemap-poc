"use client";

import dynamic from "next/dynamic";
import type { ScorePoint } from "@/lib/scoreHistory";

/**
 * 이벤트 타임라인 지연 로딩 래퍼.
 * - StockEventTimeline 은 기본 탭이 아닌 '근거' 탭에서만 마운트되고 공시 데이터를
 *   useEffect 로 클라이언트에서 받아온다(SSR 은 로딩/빈 셸).
 * - First Load JS 에서 분리해 탭 활성화 시점에만 청크 로드 → 동작 무변경.
 * - props·문구 동일.
 */
const StockEventTimeline = dynamic(
  () => import("./StockEventTimeline").then((m) => m.StockEventTimeline),
  {
    ssr: false,
    loading: () => (
      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 text-sm text-zinc-500 dark:text-zinc-400"
        aria-busy="true"
      >
        타임라인을 불러오는 중…
      </div>
    ),
  },
);

export function StockEventTimelineLazy({ ticker, scores }: { ticker: string; scores: ScorePoint[] }) {
  return <StockEventTimeline ticker={ticker} scores={scores} />;
}
