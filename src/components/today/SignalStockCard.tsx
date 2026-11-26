import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export interface SignalStockVM {
  name: string;
  ticker: string;
  sector: string;
  priceLabel: string;
  changePct: number;
  /** 종합 점수(0~100). */
  score: number;
  /** 신호 한 줄 설명(강점 또는 확인 포인트). */
  note: string;
  /** 과열 주의처럼 경고 톤으로 보여줄 때. */
  caution?: boolean;
}

export function SignalStockCard({ s }: { s: SignalStockVM }) {
  return (
    <Link prefetch={false} href={"/stock/" + s.ticker} className="research-signal-row">
      <span className="research-signal-identity">
        <strong>{s.name}</strong>
        <small className="font-mono">{s.ticker} · {s.sector}</small>
      </span>
      <span className="research-signal-price">
        <strong>{s.priceLabel}</strong>
        <small data-tone={s.changePct >= 0 ? "up" : "down"}>
          {s.changePct >= 0 ? "▲" : "▼"}{Math.abs(s.changePct).toFixed(2)}%
        </small>
      </span>
      <span className="research-signal-score tabular-nums">{s.score}<small> /100</small></span>
      <span className="research-signal-note" data-caution={s.caution}>{s.note}</span>
      <ArrowUpRight className="research-signal-arrow" size={16} aria-hidden="true" />
    </Link>
  );
}
