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
import { useMarketFreshness } from "./trust/useMarketFreshness";
import { marketFreshnessCopy } from "@/lib/freshness";
import type { LocalizedDataStatus } from "@/lib/dataStatus";
import type { Locale } from "@/lib/i18n";

export function HeaderDataBar({
  businessDate,
  businessDateShort,
  businessDateRaw,
  bizDaysSince,
  isStale,
  hasData,
  metricsVersionLabel,
  statusByLocale,
}: {
  businessDate: string;
  businessDateShort: string;
  /** 데이터 기준일 YYYYMMDD (방문 시각 기준 신선도 계산용). */
  businessDateRaw: string;
  bizDaysSince: number | null;
  isStale: boolean;
  hasData: boolean;
  metricsVersionLabel: string;
  statusByLocale: Record<Locale, LocalizedDataStatus>;
}) {
  const { locale } = useLanguage();
  const t = headerBarCopy[locale];
  const f = marketFreshnessCopy[locale];
  // 방문 시각 기준 신선도 — 마운트 전에는 null(빌드 시각으로 굳지 않도록).
  const freshness = useMarketFreshness(businessDateRaw);
  // 전 거래일 종가만 있고 오늘 장마감 데이터 수집 전이면, isStale이 아니어도 "정상"으로 보이지 않게 경고 톤.
  const awaitingClose = hasData && freshness?.state === "awaiting_close" && !isStale;
  const warn = isStale || awaitingClose;
  return (
    <div className="ui-status-strip" data-state={warn ? "warn" : "ok"}>
      <div className="flex items-center justify-end px-3 py-1.5 text-[10px] md:px-4 md:text-[11px]">
        <div
          className={"flex min-w-0 max-w-full items-center justify-end gap-1.5 " + (warn ? "text-amber-900 dark:text-amber-200" : "text-zinc-600 dark:text-zinc-300")}
        >
          <span className={"w-1.5 h-1.5 rounded-full shrink-0 " + (warn ? "bg-amber-500" : "bg-emerald-500")} />
          <span className="min-w-0 truncate">
            {hasData ? (
              <>
                <span className="sm:hidden">
                  <strong className={"tabular-nums " + (warn ? "text-amber-900 dark:text-amber-100" : "text-zinc-900 dark:text-zinc-100")}>{businessDateShort}</strong>
                  <span className="ml-1 text-zinc-600 dark:text-zinc-300">{t.marketClose}</span>
                </span>
                <span className="hidden sm:inline">
                  {t.dataBasis}{" "}
                  <strong className={"tabular-nums " + (warn ? "text-amber-900 dark:text-amber-100" : "text-zinc-900 dark:text-zinc-100")}>{businessDate}</strong>
                  <span className="text-zinc-600 dark:text-zinc-300"> {t.marketClose}</span>
                </span>
                {isStale && bizDaysSince !== null ? (
                  <span className="ml-1.5 font-semibold">{t.bizDaysAgo(bizDaysSince)}</span>
                ) : awaitingClose ? (
                  <span className="ml-1.5 font-semibold">· {f.awaitingShort}</span>
                ) : null}
              </>
            ) : (
              <span className="text-zinc-600 dark:text-zinc-300">{t.preparing}</span>
            )}
          </span>
          <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">·</span>
          <span className="text-zinc-600 dark:text-zinc-300 hidden md:inline whitespace-nowrap">KRX · Naver · DART</span>
          <span className="hidden sm:inline-flex"><MetricsVersionBadge label={metricsVersionLabel} /></span>
          <LocalizedDataTrustModal
            statusByLocale={statusByLocale}
            triggerClassName={warn ? "bg-transparent border-amber-300/70 dark:border-amber-800" : "bg-transparent border-zinc-300 dark:border-zinc-700"}
          />
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
