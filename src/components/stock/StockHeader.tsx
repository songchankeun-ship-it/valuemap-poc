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
    <div className="research-stock-heading">
      <div className="min-w-0">
        <div className="research-stock-identity">
          <span className="font-mono tabular-nums">{ticker}</span>
          <span>{sector}</span>
        </div>
        <h1>{name}</h1>
        {priceSlot}
        {priceLagAsOf && asOfLabel ? (
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300 tabular-nums">{lag.servicePrefix} {asOfLabel} {lag.stockMid} {priceLagAsOf} {lag.stockSuffix}</p>
        ) : asOfLabel ? (
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 tabular-nums">{asOfLabel} {t.asOfSuffix}</p>
        ) : null}
      </div>
      <div className="research-stock-actions">{actionsSlot}</div>
    </div>
  );
}
