/**
 * /stock/[ticker] 라우트 전환 시 즉시 보이는 Suspense 스켈레톤.
 * - 순수 표시용(데이터 패칭·상태·신규 의존성 0). 실제 페이지의 브레드크럼 + 결론
 *   히어로 + 지표/차트 영역 높이를 흉내 내어 레이아웃 이동(CLS)을 최소화한다.
 * - 스타일은 StockPriceChartLazy 등 기존 스켈레톤과 동일(animate-pulse·zinc 톤·다크 변형).
 */
export default function StockDetailLoading() {
  return (
    <div className="space-y-3 md:space-y-4" aria-busy="true" aria-label="종목 정보 불러오는 중">
      {/* 브레드크럼 */}
      <div className="h-3 w-44 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />

      {/* 결론 히어로 카드 */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 md:p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="h-6 w-40 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-2" />
            <div className="h-4 w-24 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
          </div>
          <div className="h-16 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
        </div>
        <div className="flex gap-2 mb-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-9 w-24 rounded-md bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
          ))}
        </div>
      </div>

      {/* 지표/차트 영역 */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4">
        <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-3" />
        <div className="h-[220px] rounded-md bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
      </div>
    </div>
  );
}
