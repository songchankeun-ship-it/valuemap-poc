import Link from "next/link";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { MetricChip } from "@/components/ui/MetricChip";
import { MetricBar } from "@/components/ui/MetricBar";

export interface StockCandidate {
  rank: number;
  name: string;
  ticker: string;
  sector: string;
  priceLabel: string;
  changePct: number;
  r3m: number | null;
  score: number;
  /** 강점 라벨(강한 지표 2개 "추세 96" 형태). */
  metrics: string[];
  /** 4지표 점수 — 막대 시각화용. */
  m: { momentum: number; flow: number; value: number; vol: number };
  riskNote: string;
  highReturn: boolean;
}

// 오늘 추가 확인 후보 카드 — 종합점수를 주인공으로(게이지), 4지표 막대 + 강점/주의 분리.
export function StockCandidateCard({ c }: { c: StockCandidate }) {
  return (
    <div className="flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-blue-400 dark:hover:border-blue-700 hover:shadow-sm transition">
      {/* 상단 — 종목 정보 + 종합점수 게이지 */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[11px] font-bold shrink-0 tabular-nums">{c.rank}</span>
            <span className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">{c.name}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 flex-wrap">
            <span className="font-mono tabular-nums">{c.ticker}</span>
            <span>·</span>
            <span className="truncate">{c.sector}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[12px]">
            <span className="tabular-nums text-zinc-700 dark:text-zinc-300">{c.priceLabel}</span>
            <span className={"tabular-nums font-medium " + (c.changePct >= 0 ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400")}>
              {c.changePct >= 0 ? "▲" : "▼"}{Math.abs(c.changePct).toFixed(2)}%
            </span>
            {c.r3m !== null ? (
              <span className={"text-[10px] px-1.5 py-0.5 rounded font-medium tabular-nums " + (c.highReturn ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400")}>
                3M {c.r3m >= 0 ? "+" : ""}{Math.round(c.r3m)}%
              </span>
            ) : null}
          </div>
        </div>
        <ScoreGauge score={c.score} size={72} showOutOf={false} />
      </div>

      {/* 4지표 막대 */}
      <div className="mt-3 space-y-1.5">
        <MetricBar label="추세" value={c.m.momentum} />
        <MetricBar label="거래활성도" value={c.m.flow} />
        <MetricBar label="밸류" value={c.m.value} />
        <MetricBar label="위험조정" value={c.m.vol} />
      </div>

      {/* 강점 — 강한 지표 2개 */}
      <div className="mt-3">
        <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">강점</div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {c.metrics.map((m) => (
            <MetricChip key={m} label={m.replace(/\s*\d+$/, "")} value={m.match(/\d+$/)?.[0] ?? ""} tone="strong" />
          ))}
        </div>
      </div>

      {/* 주의 — 확인 필요 문구 */}
      <div className="mt-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 px-2.5 py-2">
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
