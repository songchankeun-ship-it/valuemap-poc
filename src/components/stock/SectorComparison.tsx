import Link from "next/link";
import { scoreColorOf } from "@/lib/scoreColor";

export interface SectorRow {
  ticker: string;
  name: string;
  /** 반올림된 종합점수(0~100). 계산은 page.tsx에서 1회 — 여기선 표시만. */
  composite: number;
  per: number;
  changePct: number;
  /** 업종 내 종합점수 순위. */
  rank: number;
  isMe: boolean;
}

/**
 * 같은 업종 비교 — 가로 막대 + 순위 배지 + 현재 종목 강조(설계서 §9.6).
 * 점수는 page.tsx에서 계산해 넘겨받는다(재계산 금지). 표본이 부족하면 안내 상태로 대체.
 */
export function SectorComparison({
  rows,
  sector,
  sectorCount,
}: {
  rows: SectorRow[];
  sector: string;
  sectorCount: number;
}) {
  return (
    <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4">
      <div className="flex items-baseline justify-between mb-2 gap-2">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">같은 업종 비교 · {sector}</div>
        <Link href={"/stocks?theme=" + encodeURIComponent(sector)} className="text-[11px] text-blue-700 dark:text-blue-400 hover:underline shrink-0">업종 전체 →</Link>
      </div>

      {sectorCount < 2 ? (
        <div className="rounded-md border border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900/40 px-3 py-6 text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">같은 업종 비교 표본이 부족합니다.</p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">분석 풀에 같은 업종 종목이 1곳뿐이라 상대 비교를 표시할 수 없어요.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-1 px-1">
            <ul className="space-y-1.5 min-w-[280px]">
              {rows.map((p) => {
                const v = Math.max(0, Math.min(100, p.composite));
                const c = scoreColorOf(v);
                return (
                  <li
                    key={p.ticker}
                    className={"flex items-center gap-2 rounded-md px-1.5 py-1.5 " + (p.isMe ? "bg-blue-50/70 dark:bg-blue-950/30 ring-1 ring-blue-200 dark:ring-blue-900" : "")}
                  >
                    <span className="shrink-0 w-6 text-center text-[10px] font-bold tabular-nums text-zinc-500 dark:text-zinc-400">{p.rank}</span>
                    <div className="shrink-0 w-[5.5rem] sm:w-28 truncate text-xs">
                      {p.isMe ? (
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{p.name} <span className="text-[9px] text-blue-600 dark:text-blue-400">현재</span></span>
                      ) : (
                        <Link href={"/stock/" + p.ticker} prefetch={false} className="text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400">{p.name}</Link>
                      )}
                    </div>
                    <div className={"relative h-2 flex-1 min-w-[48px] rounded-full overflow-hidden " + c.barTrack} aria-hidden="true">
                      <div className={"absolute inset-y-0 left-0 rounded-full " + c.barFill} style={{ width: `${v}%` }} />
                    </div>
                    <span className={"shrink-0 w-7 text-right text-xs font-semibold tabular-nums " + (p.isMe ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-700 dark:text-zinc-300")}>{v}</span>
                    <span className="shrink-0 w-9 text-right text-[10px] tabular-nums text-zinc-500 dark:text-zinc-400">{p.per > 0 ? p.per.toFixed(1) : "—"}</span>
                    <span className={"shrink-0 w-11 text-right text-[10px] tabular-nums " + (p.changePct >= 0 ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400")}>{p.changePct >= 0 ? "+" : ""}{p.changePct.toFixed(1)}%</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-400 dark:text-zinc-500">
            <span className="shrink-0">막대 = 종합점수 · 배지 = 업종 순위 · PER/등락 보조</span>
          </div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">같은 업종 {sectorCount}곳(본인 포함) 중 종합점수 상위 {Math.min(6, sectorCount)}곳. 종합점수는 탐색 우선순위용 실험 지표입니다.</p>
        </>
      )}
    </section>
  );
}
