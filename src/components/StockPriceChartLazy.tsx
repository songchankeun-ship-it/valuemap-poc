"use client";

import dynamic from "next/dynamic";
import type { PricePoint } from "@/lib/priceHistory";

/**
 * 주가 차트 지연 로딩 래퍼.
 * - StockPriceChart 는 hover/range 상태를 가진 인터랙티브 SVG 클라이언트 컴포넌트라
 *   종목 상세 First Load JS 에서 가장 큰 비중을 차지한다.
 * - 결론 카드(히어로) 아래·접힘선(below-the-fold) 위치라 첫 페인트에 필수 아님 →
 *   next/dynamic({ ssr:false }) 로 별도 청크 분리해 초기 번들에서 제외한다.
 * - 레이아웃 이동(CLS) 방지를 위해 차트와 동일한 높이의 스켈레톤을 표시한다.
 * - 데이터·props·문구는 기존과 동일(표시 시점만 하이드레이션 직후로 지연).
 *
 * ※ ssr:false 는 서버 컴포넌트(page.tsx)에서 직접 쓸 수 없어 이 클라이언트 래퍼에 둔다.
 */
const StockPriceChart = dynamic(
  () => import("./StockPriceChart").then((m) => m.StockPriceChart),
  {
    ssr: false,
    loading: () => (
      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4"
        aria-busy="true"
        aria-label="주가 차트 불러오는 중"
      >
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          주가 차트
        </div>
        <div className="h-[280px] rounded-md bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
        <div className="flex gap-1 mt-3 justify-center">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="min-w-[44px] h-[44px] rounded-md bg-zinc-100 dark:bg-zinc-800/60 animate-pulse"
            />
          ))}
        </div>
        <div className="h-3 mt-3 mx-auto w-48 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
      </div>
    ),
  },
);

interface Props {
  ticker: string;
  name: string;
  points: PricePoint[];
}

export function StockPriceChartLazy(props: Props) {
  return <StockPriceChart {...props} />;
}
