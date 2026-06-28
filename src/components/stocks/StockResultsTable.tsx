"use client";

import Link from "next/link";
import { fmtWon } from "@/lib/format";
import { scoreColorOf } from "@/lib/scoreColor";
import { useLanguage } from "@/components/LanguageProvider";
import { stocksCopy } from "@/lib/copy/stocks";

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

// 신호 칩 라벨 — 로케일 copy의 t.signal 형태. 기본값은 한국어(서버/구버전 호출 호환).
// 값은 로케일별로 다르므로 키만 고정하고 값은 string으로 넓힌다(ko/en 모두 대입 가능).
type SignalLabels = Record<keyof (typeof stocksCopy)["ko"]["signal"], string>;
const KO_SIGNAL: SignalLabels = stocksCopy.ko.signal;

// 점수에서 파생한 신호 칩(강점/주의) — 카드 리스트와 동일 규칙. 공시 실데이터를 날조하지 않는다.
// 라벨은 로케일 copy(sig)에서 주입한다(미전달 시 한국어).
export function deriveSignals(
  s: { momentum: number; flow: number; value: number; vol: number; changePct: number; r3m?: number | null },
  sig: SignalLabels = KO_SIGNAL,
): { strengths: string[]; warnings: string[] } {
  const strengths: string[] = [];
  if (s.momentum >= 70) strengths.push(sig.strongTrend);
  if (s.flow >= 70) strengths.push(sig.activeTrade);
  if (s.value >= 70) strengths.push(sig.undervalued);
  if (s.vol >= 70) strengths.push(sig.goodRisk);
  const warnings: string[] = [];
  if (s.momentum < 40) warnings.push(sig.weakTrend);
  if (s.flow < 40) warnings.push(sig.lowTrade);
  if (s.value < 40) warnings.push(sig.valueBurden);
  if (s.vol < 40) warnings.push(sig.highVol);
  if (s.changePct < 0) warnings.push(sig.priceFalling);
  if (s.r3m != null && s.r3m >= 50) warnings.push(sig.surgeCaution);
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
  const { locale } = useLanguage();
  const t = stocksCopy[locale];
  return (
    <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70">
            <th className={TH + " text-left"}>{t.table.name}</th>
            <th className={TH}>{t.table.sector}</th>
            <th className={TH + " text-right"}>{t.table.price}</th>
            <th className={TH + " text-right"}>{t.table.change}</th>
            <th className={TH + " text-center"}>{t.table.composite}</th>
            <th className={TH + " text-center"}>{t.table.momentum}</th>
            <th className={TH + " text-center"}>{t.table.flow}</th>
            <th className={TH + " text-center"}>{t.table.value}</th>
            <th className={TH + " text-center"}>{t.table.vol}</th>
            <th className={TH}>{t.table.signal}</th>
            <th className={TH + " text-right"}>{t.table.action}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const { strengths, warnings } = deriveSignals(s, t.signal);
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
                <td className={TD + " text-zinc-600 dark:text-zinc-400"}>{s.sector ?? t.table.sectorEtc}</td>
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
                    {t.table.view}
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
