/**
 * /disclosures 라우트 전환 시 즉시 보이는 Suspense 스켈레톤.
 * - 순수 표시용(데이터 패칭·상태·신규 의존성 0). 실제 페이지의 브레드크럼 + 헤더
 *   + 필터 바 + 공시 카드 목록 높이를 흉내 내어 레이아웃 이동(CLS)을 최소화한다.
 * - 스타일은 기존 loading.tsx(animate-pulse·zinc 톤·다크 변형)와 동일.
 */
export default function DisclosuresLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="공시 신호 불러오는 중">
      {/* 브레드크럼 */}
      <div className="h-3 w-40 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />

      {/* 헤더 */}
      <div>
        <div className="h-6 w-32 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-2" />
        <div className="h-3 w-64 max-w-full rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
      </div>

      {/* 필터 바 */}
      <div className="border-y border-zinc-200 py-3 dark:border-zinc-800">
        <div className="flex gap-2 flex-wrap">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-16 rounded-md bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
          ))}
        </div>
      </div>

      {/* 공시 카드 목록 */}
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4"
          >
            <div className="h-4 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-2" />
            <div className="h-3 w-1/4 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse mb-2" />
            <div className="h-3 w-2/3 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
