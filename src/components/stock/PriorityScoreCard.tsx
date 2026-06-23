/**
 * 탐색 우선도 카드 — 점수 N/100 + 전체/업종 순위 + 데이터 완성도·이상값·산식 버전.
 * 매수 신호 게이지처럼 보이지 않도록 인디고+중립 팔레트, 숫자는 tabular-nums.
 * 설계서 §6.2 / §15.
 */
export function PriorityScoreCard({
  score,
  overallRank,
  poolN,
  sectorRank,
  sectorCount,
  sector,
  completeness,
  metricsVersion,
  suspect,
}: {
  score: number;
  overallRank: number;
  poolN: number;
  sectorRank: number;
  sectorCount: number;
  sector: string;
  completeness: number;
  metricsVersion?: string | null;
  suspect: boolean;
}) {
  const accent = suspect ? "text-zinc-400 dark:text-zinc-500" : "text-indigo-700 dark:text-indigo-300";
  return (
    <div className={"rounded-xl border p-3 md:p-4 " + (suspect ? "border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20" : "border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20")}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">탐색 우선도</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={"text-3xl md:text-4xl font-bold leading-none tabular-nums " + accent}>{score}</span>
        <span className="text-sm text-zinc-400 dark:text-zinc-500 tabular-nums">/ 100</span>
        {suspect ? <span className="text-amber-600 dark:text-amber-400 text-base" aria-hidden="true"> ⚠</span> : null}
      </div>
      <div className="mt-2 space-y-0.5 text-[11px] text-zinc-600 dark:text-zinc-300 tabular-nums">
        <div>전체 <strong className="text-zinc-900 dark:text-zinc-100">{overallRank}</strong> / {poolN}위</div>
        <div>업종({sector}) <strong className="text-zinc-900 dark:text-zinc-100">{sectorRank}</strong> / {sectorCount}위</div>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-zinc-500 dark:text-zinc-400 tabular-nums">
        <span>필수 데이터 {completeness}%</span>
        {suspect ? (
          <span className="text-amber-600 dark:text-amber-400 font-medium">이상값 점검 중 · 임시 점수</span>
        ) : (
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">이상값 점검 통과</span>
        )}
        {metricsVersion ? <span>산식 {metricsVersion}</span> : null}
      </div>
      <p className="mt-2 text-[10px] text-zinc-400 dark:text-zinc-500 leading-snug">매수·매도 추천이 아닌 탐색 우선순위입니다.</p>
    </div>
  );
}
