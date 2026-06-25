import { ScoreGauge } from "@/components/ui/ScoreGauge";

/**
 * 탐색 우선도 카드 — 점수 게이지 + 전체/업종 순위 + 데이터 완성도·이상값·산식 버전.
 * 정상 상태는 ScoreGauge(구간색 링)로 점수를 주인공화하고, 이상값 점검 중(suspect)에는
 * 매수 게이지처럼 보이지 않도록 게이지 대신 회색 숫자만 노출한다. 설계서 §6.2 / §9.3 / §15.
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
  return (
    <div className={"rounded-xl border p-3 md:p-4 " + (suspect ? "border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20" : "border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20")}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">탐색 우선도</div>

      <div className="mt-2 flex items-center gap-3">
        {suspect ? (
          <div className="flex items-baseline gap-1 shrink-0">
            <span className="text-3xl md:text-4xl font-bold leading-none tabular-nums text-zinc-400 dark:text-zinc-500">{score}</span>
            <span className="text-sm text-zinc-400 dark:text-zinc-500 tabular-nums">/ 100</span>
            <span className="text-amber-600 dark:text-amber-400 text-base" aria-hidden="true"> ⚠</span>
          </div>
        ) : (
          <ScoreGauge score={score} size={88} showLabel showOutOf />
        )}

        <div className="min-w-0 space-y-0.5 text-[11px] text-zinc-600 dark:text-zinc-300 tabular-nums">
          <div className="text-[10px] text-zinc-400 dark:text-zinc-500">상대순위 <span className="font-normal">(점수와 별개)</span></div>
          <div>전체 <strong className="text-zinc-900 dark:text-zinc-100">{overallRank}</strong> / {poolN}위</div>
          <div className="truncate">업종({sector}) <strong className="text-zinc-900 dark:text-zinc-100">{sectorRank}</strong> / {sectorCount}위</div>
        </div>
      </div>

      {/* 데이터 상태 배지 — 각각 독립 pill로 분리(텍스트처럼 붙지 않게). */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px] tabular-nums">
        <span className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-2 py-0.5 text-zinc-600 dark:text-zinc-300">필수 데이터 {completeness}%</span>
        {suspect ? (
          <span className="inline-flex items-center rounded-full border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 font-medium text-amber-700 dark:text-amber-300">이상값 점검 중 · 임시 점수</span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-300">이상값 점검 통과</span>
        )}
        {metricsVersion ? (
          <span className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-2 py-0.5 text-zinc-600 dark:text-zinc-300">{metricsVersion}</span>
        ) : null}
      </div>
    </div>
  );
}
