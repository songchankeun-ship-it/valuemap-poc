/**
 * /watchlist 라우트 전환 시 즉시 보이는 Suspense 스켈레톤.
 * - 순수 표시용(데이터 패칭·상태·신규 의존성 0). 실제 페이지의 헤더/목록 높이를
 *   그대로 흉내 내어 레이아웃 이동(CLS)을 최소화한다.
 * - 스타일은 StockPriceChartLazy 등 기존 스켈레톤과 동일(animate-pulse·zinc 톤·다크 변형).
 */
export default function WatchlistLoading() {
  return (
    <div className="max-w-3xl mx-auto px-0 md:px-4 py-4 md:py-8" aria-busy="true" aria-label="관심 종목 불러오는 중">
      <header className="mb-4 md:mb-6 px-4 md:px-0">
        <div className="h-6 w-28 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-2" />
        <div className="h-3 w-64 max-w-full rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
      </header>
      <div className="space-y-2 px-4 md:px-0">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-2" />
                <div className="h-3 w-20 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
              </div>
              <div className="h-9 w-14 rounded-md bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
