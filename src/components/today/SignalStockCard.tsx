import Link from "next/link";
import { ScoreGauge } from "@/components/ui/ScoreGauge";

export interface SignalStockVM {
  name: string;
  ticker: string;
  sector: string;
  priceLabel: string;
  changePct: number;
  /** 종합 점수(0~100) — 게이지로 표시. */
  score: number;
  /** 신호 한 줄 설명(강점 또는 확인 포인트). */
  note: string;
  /** 과열 주의처럼 경고 톤으로 보여줄 때. */
  caution?: boolean;
}

// 신호별 섹션용 컴팩트 종목 카드 — 점수 게이지를 주인공으로, 이름/업종/가격/한 줄 신호 + CTA.
// 카드 전체가 종목 상세로 이동하는 링크(터치 영역 충분, 모바일 카드 중심).
export function SignalStockCard({ s }: { s: SignalStockVM }) {
  return (
    <Link
      prefetch={false}
      href={"/stock/" + s.ticker}
      className="flex min-h-[72px] items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 transition hover:border-blue-400 active:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-700 dark:active:bg-zinc-800/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
    >
      <ScoreGauge score={s.score} size={56} showLabel={false} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[14px] font-bold text-zinc-900 dark:text-zinc-100 truncate">{s.name}</span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono tabular-nums shrink-0">{s.ticker}</span>
        </div>
        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{s.sector}</div>
        <div className="flex items-center gap-1.5 mt-1 text-[12px]">
          <span className="tabular-nums font-semibold text-zinc-800 dark:text-zinc-200">{s.priceLabel}</span>
          <span className={"tabular-nums text-[11px] font-medium " + (s.changePct >= 0 ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400")}>
            {s.changePct >= 0 ? "▲" : "▼"}{Math.abs(s.changePct).toFixed(2)}%
          </span>
        </div>
        <p className={"mt-1 text-[11px] leading-snug line-clamp-2 " + (s.caution ? "text-amber-700 dark:text-amber-400" : "text-zinc-500 dark:text-zinc-400")}>
          {s.caution ? "⚠ " : ""}{s.note}
        </p>
      </div>
    </Link>
  );
}
