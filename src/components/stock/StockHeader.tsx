"use client";

import { type ReactNode } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { stockHeaderCopy, priceBasisLagCopy } from "@/lib/copy/stockDetail";

/**
 * 종목 헤더 — 업종 태그 · 종목명(가장 크게) · 종목코드 + 현재가/액션 슬롯.
 * priceSlot(LivePrice)·actionsSlot(관심/비교/공유)은 클라이언트 컴포넌트라 슬롯으로 주입.
 * 설계서 §6.1.
 */
export function StockHeader({
  sector,
  name,
  ticker,
  asOfLabel,
  priceLagAsOf,
  priceSlot,
  actionsSlot,
}: {
  sector: string;
  name: string;
  ticker: string;
  asOfLabel?: string | null;
  priceLagAsOf?: string | null;
  priceSlot: ReactNode;
  actionsSlot: ReactNode;
}) {
  const { locale } = useLanguage();
  const t = stockHeaderCopy[locale];
  const lag = priceBasisLagCopy[locale];
  return (
    <div className="rounded-lg border border-zinc-200 bg-white/90 p-3 dark:border-zinc-800 dark:bg-zinc-950/60 md:p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 font-semibold shrink-0">{sector}</span>
            <h1 className="text-[22px] leading-tight md:text-4xl font-black text-zinc-950 dark:text-zinc-50 truncate">{name}</h1>
            <span className="text-[11px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-md tabular-nums font-mono shrink-0">{ticker}</span>
          </div>
          <div className="mt-1.5">{priceSlot}</div>
          {priceLagAsOf && asOfLabel ? (
            <div className="mt-0.5 text-[10px] text-amber-600 dark:text-amber-400 tabular-nums">{lag.servicePrefix} {asOfLabel} {lag.stockMid} {priceLagAsOf} {lag.stockSuffix}</div>
          ) : asOfLabel ? (
            <div className="mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums">{asOfLabel} {t.asOfSuffix}</div>
          ) : null}
        </div>
        {/* CTA 버튼 그룹 — 데스크톱은 우측 가로 배치(명확한 간격), 모바일은 한 줄로 내려 균등 폭으로 줄바꿈(텍스트처럼 붙지 않게). */}
        <div className="flex flex-wrap items-stretch gap-2 shrink-0 w-full sm:w-auto [&>*]:flex-1 [&>*]:justify-center sm:[&>*]:flex-none">{actionsSlot}</div>
      </div>
    </div>
  );
}
