"use client";

/**
 * 앱 헤더 하단 데이터 상태 바 (클라이언트) — 다국어 v2.
 * 서버(AppHeader)가 직렬화 가능한 값만 props로 주입한다(stocks.json 미번들).
 * 데이터 기준일·지연 여부·산식 버전 + 데이터 신뢰 모달을 로케일에 맞춰 보여준다.
 */
import { useLanguage } from "@/components/LanguageProvider";
import { headerBarCopy } from "@/lib/copy/trust";
import { MetricsVersionBadge } from "./trust/badges";
import { LocalizedDataTrustModal } from "./trust/TrustLayer";
import type { LocalizedDataStatus } from "@/lib/dataStatus";
import type { Locale } from "@/lib/i18n";

export function HeaderDataBar({
  businessDate,
  businessDateShort,
  bizDaysSince,
  isStale,
  hasData,
  metricsVersionLabel,
  statusByLocale,
}: {
  businessDate: string;
  businessDateShort: string;
  bizDaysSince: number | null;
  isStale: boolean;
  hasData: boolean;
  metricsVersionLabel: string;
  statusByLocale: Record<Locale, LocalizedDataStatus>;
}) {
  const { locale } = useLanguage();
  const t = headerBarCopy[locale];
  return (
    <div
      className={
        isStale
          ? "bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900"
          : "bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800"
      }
    >
      <div className="px-3 md:px-4 py-1.5 flex items-center justify-between gap-2 text-[10px] md:text-[11px]">
        <div
          className={
            "flex items-center gap-1.5 md:gap-2 min-w-0 " +
            (isStale ? "text-amber-900 dark:text-amber-200" : "text-zinc-600 dark:text-zinc-400")
          }
        >
          <span className={"w-1.5 h-1.5 rounded-full shrink-0 " + (isStale ? "bg-amber-500" : "bg-green-500")} />
          <span className="truncate">
            {hasData ? (
              <>
                {/* 모바일: 짧고 명확한 형태 */}
                <span className="sm:hidden">
                  <strong className={"tabular-nums " + (isStale ? "text-amber-900 dark:text-amber-100" : "text-zinc-900 dark:text-zinc-100")}>{businessDateShort}</strong>
                  <span className="ml-1 text-zinc-500 dark:text-zinc-500">{t.marketClose}</span>
                </span>
                {/* 데스크톱: 단일 기준일만 */}
                <span className="hidden sm:inline">
                  {t.dataBasis}{" "}
                  <strong className={"tabular-nums " + (isStale ? "text-amber-900 dark:text-amber-100" : "text-zinc-900 dark:text-zinc-100")}>{businessDate}</strong>
                  <span className="text-zinc-500 dark:text-zinc-500"> {t.marketClose}</span>
                </span>
                {isStale && bizDaysSince !== null ? <span className="ml-1.5 font-semibold">{t.bizDaysAgo(bizDaysSince)}</span> : null}
              </>
            ) : (
              <span className="text-zinc-500 dark:text-zinc-500">{t.preparing}</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-zinc-500 dark:text-zinc-500 hidden md:inline whitespace-nowrap">KRX · Naver · yfinance · DART</span>
          <span className="hidden sm:inline-flex"><MetricsVersionBadge label={metricsVersionLabel} /></span>
          <LocalizedDataTrustModal statusByLocale={statusByLocale} />
        </div>
      </div>
    </div>
  );
}

/** 헤더 우측 "N개 종목" / "N stocks" 칩. */
export function HeaderStockCount({ count }: { count: number }) {
  const { locale } = useLanguage();
  return (
    <span className="hidden md:inline text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">
      {headerBarCopy[locale].stocksCount(count)}
    </span>
  );
}
