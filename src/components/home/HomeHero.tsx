"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { homeHeroCopy } from "@/lib/i18n";
import { useLanguage } from "@/components/LanguageProvider";
import { useMarketFreshness } from "@/components/trust/useMarketFreshness";
import { marketFreshnessCopy } from "@/lib/freshness";
import { HomeMarketPulse, type HomeMarketPulseData } from "./HomeMarketPulse";

interface SearchStockItem {
  ticker: string;
  name: string;
  themes: string[];
}

// 검색창 아래 예시 칩용 대표 종목 코드(삼성전자·카카오·GS). 분석 풀에 있는 것만 렌더된다.
const SEARCH_EXAMPLE_TICKERS = ["005930", "035720", "078930"];

interface HomeHeroProps {
  dataAsOf: string;
  /** 데이터 기준일 YYYYMMDD (방문 시각 기준 신선도 계산용). */
  dataAsOfRaw: string;
  dataStale: boolean;
  searchStocks: SearchStockItem[];
  searchThemes: string[];
  marketPulse: HomeMarketPulseData;
  comparison?: { href: string; label: string; chart: ReactNode };
}

export function HomeHero({
  dataAsOf,
  dataAsOfRaw,
  dataStale,
  searchStocks,
  searchThemes,
  marketPulse,
  comparison,
}: HomeHeroProps) {
  const { locale } = useLanguage();
  const copy = homeHeroCopy[locale];
  const f = marketFreshnessCopy[locale];
  // 방문 시각 기준 신선도 — 전 거래일 종가만 있고 오늘 장마감 수집 전이면 "정상"으로 보이지 않게 경고 톤.
  const freshness = useMarketFreshness(dataAsOfRaw);
  const awaitingClose = freshness?.state === "awaiting_close" && !dataStale;
  const dataWarn = dataStale || awaitingClose;
  // 검색이 홈의 1차 동선임을 드러내는 예시 칩 — 잘 알려진 대형주를 실제 분석 풀에서만 노출(없으면 자동 제외).
  // 하드코딩된 종목명 대신 풀에서 이름을 조회해 이름/코드 불일치를 방지한다.
  const searchExamples = SEARCH_EXAMPLE_TICKERS.map((ticker) => {
    const hit = searchStocks.find((s) => s.ticker === ticker);
    return hit ? { ticker, name: hit.name } : null;
  }).filter((x): x is { ticker: string; name: string } => x !== null);

  return (
    <section>
      <div className="research-entry">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="research-section-label">{copy.badge}</span>
            <span className="flex items-center gap-1.5 text-[11px] text-[var(--muted)] tabular-nums">
              <span aria-hidden="true" className={"h-1.5 w-1.5 rounded-full " + (dataWarn ? "bg-amber-500" : "bg-emerald-600")} />
              {dataAsOf} {copy.marketClose}
              {dataWarn && <span className="text-[var(--status-warn)]">{dataStale ? copy.delayed : f.awaitingShort}</span>}
            </span>
          </div>
          <h1 className="mt-2 text-[34px] font-extrabold leading-tight text-[var(--foreground)]">{copy.brand}</h1>
          <p className="mt-1 mb-3 max-w-[29rem] text-sm leading-relaxed text-[var(--muted)] break-keep">{copy.description}</p>
          <div>
            <div className="sr-only">{copy.searchLabel}</div>
            <GlobalSearch stocks={searchStocks} themes={searchThemes} variant="hero" />
            {searchExamples.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-3">
                <span className="text-[11px] text-[var(--muted)]">{copy.searchExamplePrefix}</span>
                {searchExamples.map((ex) => (
                  <Link key={ex.ticker} prefetch={false} href={"/stock/" + ex.ticker} className="research-link inline-flex min-h-9 items-center text-xs">
                    {ex.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <a href="#today-candidates" className="ui-primary-action research-button mt-1">
            <span>{copy.primaryCta}</span>
            <ArrowDown className="h-4 w-4 shrink-0" aria-hidden="true" />
          </a>
        </div>
        {comparison && (
          <div className="min-w-0">
            <Link href={comparison.href} className="research-link flex min-h-10 items-center justify-between gap-2 text-sm">
              <span className="break-keep">{comparison.label}</span>
              <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
            {comparison.chart}
          </div>
        )}
      </div>
      <HomeMarketPulse data={marketPulse} />
    </section>
  );
}
