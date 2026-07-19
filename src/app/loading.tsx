/**
 * 홈(/) 라우트 전환 시 즉시 보이는 Suspense 스켈레톤.
 * - 순수 표시용(데이터 패칭·상태·신규 의존성 0). 실제 페이지의 히어로 + 내부 시장 단면
 *   + 후보 3카드 높이를 흉내 내어 레이아웃 이동(CLS)을 최소화한다.
 * - 스타일은 기존 loading.tsx(animate-pulse·zinc 톤·다크 변형)와 동일.
 */
export default function HomeLoading() {
  return (
    <div className="space-y-5 md:space-y-7" aria-busy="true" aria-label="홈 화면 불러오는 중">
      {/* 히어로 + 내부 시장 단면 */}
      <div className="ui-hero-band -mx-3 px-4 py-5 md:-mx-4 md:px-6 md:py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-3 h-3 w-40 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="mb-3 h-8 w-3/4 max-w-lg rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="mb-5 h-4 w-2/3 max-w-md rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
          <div className="h-14 max-w-2xl rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 animate-pulse" />
          <div className="mt-4 h-11 w-40 rounded-md bg-blue-200 dark:bg-blue-950 animate-pulse" />
          <div className="ui-market-pulse mt-5 grid grid-cols-2 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 border-zinc-200 p-3 dark:border-zinc-800 sm:border-l first:border-l-0">
                <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="mt-2 h-4 w-10 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 후보 섹션 */}
      <div>
        <div className="h-5 w-32 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-3" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-72 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-2" />
                  <div className="h-3 w-24 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
                </div>
                <div className="h-9 w-12 rounded-md bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
