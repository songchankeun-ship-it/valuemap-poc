// 주가 차트 텍스트 요약 — 접근성/SEO fallback (서버 렌더).
//
// StockPriceChart 는 next/dynamic({ ssr:false }) 지연 로드라 검색엔진·스크린리더·비JS
// 환경에서는 차트 섹션이 제목만 있는 빈 영역처럼 보인다. 이 컴포넌트는 서버에서 항상
// 렌더되어(그 환경들도 읽을 수 있게) 이미 받은 종가 배열에서 계산한 수치만 텍스트로 제공한다.
// 새 데이터·API·차트 이벤트 생성 없음(가격 시계열 파생 수치만).
import type { PricePoint } from "@/lib/priceHistory";
import { computePriceSummary, signedPctText } from "@/lib/priceSummary";

interface Props {
  name: string;
  points: PricePoint[];
}

function toneClass(pct: number | null): string {
  if (pct === null) return "text-zinc-700 dark:text-zinc-300";
  // 한국 관습 — 상승 빨강, 하락 파랑.
  return pct >= 0
    ? "text-red-600 dark:text-red-400"
    : "text-blue-600 dark:text-blue-400";
}

function fmtDate(d: string | null): string | null {
  if (!d) return null;
  return d.replace(/-/g, ".");
}

/**
 * 차트 바로 아래에 놓는 텍스트 요약. 값이 부족한 항목은 렌더하지 않는다(graceful).
 */
export function StockPriceSummary({ name, points }: Props) {
  const s = computePriceSummary(points);
  if (s.tradingDays < 2) return null;

  const rows: { label: string; text: string; pct: number | null }[] = [];
  if (s.return3mPct !== null) {
    rows.push({ label: "최근 3개월(약 63거래일) 수익률", text: signedPctText(s.return3mPct)!, pct: s.return3mPct });
  }
  if (s.return1mPct !== null) {
    rows.push({ label: "최근 1개월(약 21거래일) 수익률", text: signedPctText(s.return1mPct)!, pct: s.return1mPct });
  }
  if (s.maxDrawdownPct !== null) {
    rows.push({ label: "표시 구간 최대낙폭", text: `${s.maxDrawdownPct.toFixed(1)}%`, pct: s.maxDrawdownPct });
  }

  const from = fmtDate(s.fromDate);
  const to = fmtDate(s.toDate);
  const fullText = signedPctText(s.fullReturnPct);

  return (
    <section
      aria-label={`${name} 주가 요약`}
      data-testid="price-summary-fallback"
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4 mt-2"
    >
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        주가 요약
      </h3>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
        {from && to ? (
          <>
            {from} ~ {to} · {s.tradingDays.toLocaleString()}거래일 종가 기준
            {fullText ? <> · 표시 구간 등락률 <span className={toneClass(s.fullReturnPct)}>{fullText}</span></> : null}
          </>
        ) : (
          <>종가 {s.tradingDays.toLocaleString()}거래일 기준</>
        )}
      </p>

      {rows.length > 0 ? (
        <dl className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1.5">
          {rows.map((r) => (
            <div key={r.label} className="flex items-baseline justify-between sm:block gap-2">
              <dt className="text-[11px] text-zinc-500 dark:text-zinc-400">{r.label}</dt>
              <dd className={"text-sm font-semibold tabular-nums " + toneClass(r.pct)}>{r.text}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2">
        위 수치는 표시 구간 종가에서 계산한 참고용 요약입니다. 위 차트가 렌더되지 않는 환경(검색엔진·스크린리더 등)에서도 확인할 수 있게 제공합니다.
      </p>
    </section>
  );
}
