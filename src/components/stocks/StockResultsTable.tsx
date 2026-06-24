import Link from "next/link";
import { fmtWon } from "@/lib/format";
import { scoreColorOf } from "@/lib/scoreColor";

// /stocks 데스크톱 점수 히트맵 테이블 — 카드와 같은 점수 색 규칙(scoreColor)을 쓴다.
// 모바일에서는 렌더하지 않는다(상위 StocksExplorer가 lg:block로만 노출).
// 점수 계산식·데이터는 건드리지 않고 '표시'만 한다.

export interface StockRowVM {
  ticker: string;
  name: string;
  currentPrice: number;
  changePct: number;
  per: number;
  pbr: number;
  roe: number;
  dividendYield: number;
  market: string;
  momentum: number;
  flow: number;
  value: number;
  vol: number;
  compositeScore?: number;
  themes: string[];
  r3m?: number | null;
  sector?: string;
}

// 점수에서 파생한 신호 칩(강점/주의) — 카드 리스트와 동일 규칙. 공시 실데이터를 날조하지 않는다.
export function deriveSignals(s: { momentum: number; flow: number; value: number; vol: number; changePct: number; r3m?: number | null }): { strengths: string[]; warnings: string[] } {
  const strengths: string[] = [];
  if (s.momentum >= 70) strengths.push("추세 강함");
  if (s.flow >= 70) strengths.push("거래 활발");
  if (s.value >= 70) strengths.push("저평가 가능");
  if (s.vol >= 70) strengths.push("위험 대비 양호");
  const warnings: string[] = [];
  if (s.momentum < 40) warnings.push("추세 약함");
  if (s.flow < 40) warnings.push("거래 부진");
  if (s.value < 40) warnings.push("밸류 부담");
  if (s.vol < 40) warnings.push("변동성 큼");
  if (s.changePct < 0) warnings.push("가격 하락 중");
  if (s.r3m != null && s.r3m >= 50) warnings.push("급등 주의");
  return { strengths, warnings };
}

// 점수 히트맵 셀 — scoreColor 밴드(80↑ blue / 60~79 sky / 40~59 amber / <40 zinc) 그대로.
function ScoreHeatCell({ score, lead }: { score: number; lead?: boolean }) {
  const v = Number.isFinite(score) ? Math.round(score) : 0;
  const c = scoreColorOf(v);
  return (
    <span
      className={"inline-flex items-center justify-center min-w-[2.75rem] px-2 py-1 rounded-md border tabular-nums " + (lead ? "font-bold text-sm" : "font-semibold text-xs") + " " + c.badge}
      title={c.label}
    >
      {v}
    </span>
  );
}

const TH = "px-2.5 py-2 font-semibold text-zinc-500 dark:text-zinc-400 whitespace-nowrap";
const TD = "px-2.5 py-2 align-middle whitespace-nowrap";

export function StockResultsTable({ rows }: { rows: StockRowVM[] }) {
  return (
    <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70">
            <th className={TH + " text-left"}>종목명</th>
            <th className={TH}>업종</th>
            <th className={TH + " text-right"}>현재가</th>
            <th className={TH + " text-right"}>등락률</th>
            <th className={TH + " text-center"}>종합점수</th>
            <th className={TH + " text-center"}>추세</th>
            <th className={TH + " text-center"}>거래활성도</th>
            <th className={TH + " text-center"}>밸류</th>
            <th className={TH + " text-center"}>위험조정</th>
            <th className={TH}>신호</th>
            <th className={TH + " text-right"}>액션</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const { strengths, warnings } = deriveSignals(s);
            const chips = [...strengths.slice(0, 1), ...warnings.slice(0, 1)];
            const up = s.changePct >= 0;
            return (
              <tr key={s.ticker} className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition">
                <td className={TD}>
                  <Link prefetch={false} href={"/stock/" + s.ticker} className="group inline-flex flex-col">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-blue-700 dark:group-hover:text-blue-400">{s.name}</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono tabular-nums">{s.ticker} · {s.market}</span>
                  </Link>
                </td>
                <td className={TD + " text-zinc-600 dark:text-zinc-400"}>{s.sector ?? "기타"}</td>
                <td className={TD + " text-right tabular-nums text-zinc-900 dark:text-zinc-100"}>{fmtWon(s.currentPrice)}</td>
                <td className={TD + " text-right tabular-nums " + (up ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400")}>
                  {up ? "▲" : "▼"} {Math.abs(s.changePct).toFixed(2)}%
                </td>
                <td className={TD + " text-center"}><ScoreHeatCell score={s.compositeScore || 0} lead /></td>
                <td className={TD + " text-center"}><ScoreHeatCell score={s.momentum} /></td>
                <td className={TD + " text-center"}><ScoreHeatCell score={s.flow} /></td>
                <td className={TD + " text-center"}><ScoreHeatCell score={s.value} /></td>
                <td className={TD + " text-center"}><ScoreHeatCell score={s.vol} /></td>
                <td className={TD}>
                  {chips.length > 0 ? (
                    <div className="flex gap-1 flex-wrap max-w-[180px]">
                      {strengths.slice(0, 1).map((label) => (
                        <span key={label} className="text-[10px] px-1.5 py-0.5 rounded border font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900">{label}</span>
                      ))}
                      {warnings.slice(0, 1).map((label) => (
                        <span key={label} className="text-[10px] px-1.5 py-0.5 rounded border font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900">{label}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">—</span>
                  )}
                </td>
                <td className={TD + " text-right"}>
                  <Link prefetch={false} href={"/stock/" + s.ticker} className="inline-flex items-center px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-blue-400 hover:text-blue-700 dark:hover:text-blue-400 transition whitespace-nowrap">
                    확인
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
