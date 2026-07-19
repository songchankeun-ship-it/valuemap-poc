/**
 * /today 라우트 전환 시 즉시 보이는 Suspense 스켈레톤.
 * - 순수 표시용(데이터 패칭·상태·신규 의존성 0). 실제 페이지의 헤더/브리핑 + Top 후보
 *   + 신호 섹션 높이를 흉내 내어 레이아웃 이동(CLS)을 최소화한다.
 * - 스타일은 기존 loading.tsx(animate-pulse·zinc 톤·다크 변형)와 동일.
 */
export default function TodayLoading() {
  return (
    <div className="space-y-5 md:space-y-6" aria-busy="true" aria-label="오늘 화면 불러오는 중">
      {/* 헤더 + 상태/시장 단면 */}
      <div className="border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <div className="mb-3 h-6 w-40 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        <div className="mb-2 h-3 w-full max-w-lg rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
        <div className="h-3 w-2/3 max-w-md rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
      </div>
      <div className="ui-data-band h-11 animate-pulse" />
      <div className="grid grid-cols-2 border-y border-zinc-200 dark:border-zinc-800 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 border-zinc-200 p-3 dark:border-zinc-800 lg:border-l first:border-l-0">
            <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="mt-2 h-5 w-12 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
          </div>
        ))}
      </div>

      {/* 오늘의 Top 3 후보 */}
      <div>
        <div className="h-5 w-32 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-3" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4"
            >
              <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-2" />
              <div className="h-3 w-16 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse mb-3" />
              <div className="h-14 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* 신호 섹션 — 첫 화면에 필요한 밀도만 유지 */}
      <div>
        <div className="h-5 w-28 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-3" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
