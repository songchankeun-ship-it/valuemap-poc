import Link from "next/link";

export interface StockCandidate {
  rank: number;
  name: string;
  ticker: string;
  priceLabel: string;
  changePct: number;
  r3m: number | null;
  score: number;
  metrics: string[];
  riskNote: string;
  highReturn: boolean;
}

// 오늘 추가 확인 후보 카드 — 순위·종목·점수·강점 2개·주의 문구·종목 상세 CTA.
export function StockCandidateCard({ c }: { c: StockCandidate }) {
  return (
    <div className="flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-blue-400 dark:hover:border-blue-700 hover:shadow-sm transition">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[11px] font-bold shrink-0 tabular-nums">{c.rank}</span>
            <span className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">{c.name}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            <span className="font-mono tabular-nums">{c.ticker}</span>
            <span>·</span>
            <span className="tabular-nums">{c.priceLabel}</span>
            <span className={"tabular-nums " + (c.changePct >= 0 ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400")}>
              {c.changePct >= 0 ? "▲" : "▼"}{Math.abs(c.changePct).toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-2xl font-bold text-blue-700 dark:text-blue-400 tabular-nums leading-none">{c.score}</span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">종합 / 100</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-3 flex-wrap">
        {c.metrics.map((m) => (
          <span key={m} className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium tabular-nums">{m}</span>
        ))}
        {c.r3m !== null ? (
          <span className={"text-[11px] px-2 py-0.5 rounded-md font-medium tabular-nums " + (c.highReturn ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300")}>
            3개월 {c.r3m >= 0 ? "+" : ""}{Math.round(c.r3m)}%
          </span>
        ) : null}
      </div>

      <div className="mt-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 px-2.5 py-2">
        <div className="flex items-start gap-1.5">
          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 shrink-0 mt-px">주의</span>
          <p className="text-[11px] leading-snug text-amber-800/90 dark:text-amber-300/80">{c.riskNote}</p>
        </div>
      </div>

      <Link
        prefetch={false}
        href={"/stock/" + c.ticker}
        className="mt-3 text-center px-3 py-2 min-h-[44px] inline-flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 text-[13px] font-medium text-zinc-900 dark:text-zinc-100 hover:border-blue-400 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition"
      >
        종목 보기 →
      </Link>
    </div>
  );
}
