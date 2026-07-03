/**
 * /stocks 라우트 전환 시 즉시 보이는 Suspense 스켈레톤.
 * - 순수 표시용(데이터 패칭·상태·신규 의존성 0). 실제 페이지의 헤더 + 필터 바
 *   + 종목 카드 그리드 높이를 흉내 내어 레이아웃 이동(CLS)을 최소화한다.
 * - 스타일은 기존 loading.tsx(animate-pulse·zinc 톤·다크 변형)와 동일.
 */
export default function StocksLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="종목 탐색 불러오는 중">
      {/* 헤더 */}
      <div>
        <div className="h-6 w-28 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-2" />
        <div className="h-3 w-56 max-w-full rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
      </div>

      {/* 필터/정렬 바 */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4">
        <div className="h-10 rounded-md bg-zinc-100 dark:bg-zinc-800/60 animate-pulse mb-3" />
        <div className="flex gap-2 flex-wrap">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-20 rounded-full bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
          ))}
        </div>
      </div>

      {/* 종목 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4"
          >
            <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-2" />
            <div className="h-3 w-20 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse mb-3" />
            <div className="grid grid-cols-4 gap-1.5">
              {[0, 1, 2, 3].map((j) => (
                <div key={j} className="h-10 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
