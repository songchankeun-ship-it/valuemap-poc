/**
 * 홈(/) 라우트 전환 시 즉시 보이는 Suspense 스켈레톤.
 * - 순수 표시용(데이터 패칭·상태·신규 의존성 0). 실제 페이지의 히어로 + 스냅샷 4카드
 *   + 후보 리스트 높이를 흉내 내어 레이아웃 이동(CLS)을 최소화한다.
 * - 스타일은 기존 loading.tsx(animate-pulse·zinc 톤·다크 변형)와 동일.
 */
export default function HomeLoading() {
  return (
    <div className="space-y-5 md:space-y-7" aria-busy="true" aria-label="홈 화면 불러오는 중">
      {/* 히어로 카드 */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 md:p-6">
        <div className="h-7 w-3/4 max-w-md rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-3" />
        <div className="h-4 w-2/3 max-w-sm rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse mb-5" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
          ))}
        </div>
      </div>

      {/* 시장 스냅샷 4카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
        ))}
      </div>

      {/* 후보 섹션 */}
      <div>
        <div className="h-5 w-32 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-3" />
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4"
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
