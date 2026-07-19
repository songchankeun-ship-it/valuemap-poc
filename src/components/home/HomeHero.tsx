"use client";

import Link from "next/link";
import { ArrowRight, Search, ShieldCheck } from "lucide-react";
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
}

// 홈 히어로 — 하나의 시작 영역(설계서 §6.3). 서비스 정의 → 검색 → 단일 주 행동(오늘 후보) →
// 보조 텍스트 링크(전체 종목) → 짧은 비자문 한 문장 → 같은 데이터의 시장 단면 순으로 구성한다.
// 우측 후보/KPI 미리보기는 아래 후보 섹션과 정보가 겹쳐 제거했고, 후보 카드가 모바일 첫 화면에
// 곧바로 이어지도록 높이를 낮춘다. 주 행동은 시각적으로 하나만 강조하고 전체 종목은 텍스트 링크로 둔다.
// 시장 단면은 독립 섹션이 아니라 히어로 내부의 네 숫자 밴드라 첫 방문 4구간 계약을 유지한다.
export function HomeHero({
  dataAsOf,
  dataAsOfRaw,
  dataStale,
  searchStocks,
  searchThemes,
  marketPulse,
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
    <section className="ui-hero-band relative -mx-3 overflow-hidden px-4 py-5 md:-mx-4 md:px-6 md:py-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase text-blue-700 dark:text-blue-300">
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
            {copy.badge}
          </span>
          <span
            className="inline-flex items-center gap-1.5 border-l border-zinc-200 dark:border-zinc-700 pl-2 text-[10px] text-zinc-600 dark:text-zinc-300"
            title={`${copy.dataPrefix} ${dataAsOf} ${copy.marketClose}`}
          >
            <span className={"w-1.5 h-1.5 rounded-full " + (dataWarn ? "bg-orange-400" : "bg-emerald-400")} />
            <span className="tabular-nums">{copy.dataPrefix} {dataAsOf} {copy.marketClose}</span>
            {dataStale ? (
              <span className="font-medium text-orange-600 dark:text-orange-300">· {copy.delayed}</span>
            ) : awaitingClose ? (
              <span className="font-medium text-orange-600 dark:text-orange-300">· {f.awaitingShort}</span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-300">· {copy.normal}</span>
            )}
          </span>
        </div>
        <h1 className="max-w-2xl text-[26px] leading-[1.12] md:text-[36px] md:leading-[1.08] font-black text-zinc-950 dark:text-white">
          {copy.titleBefore}{" "}
          <span className="text-blue-700 dark:text-sky-300">{copy.titleAccent}</span> {copy.titleAfter}
        </h1>
        <p className="text-[13px] md:text-[14px] text-zinc-600 dark:text-zinc-300 mt-3 max-w-2xl leading-relaxed">
          {copy.description}
        </p>
        <div className="mt-3 md:mt-4 max-w-2xl">
          <div className="flex items-center gap-1.5 mb-1.5 text-[12px] font-bold text-zinc-800 dark:text-zinc-100">
            <Search className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <span>{copy.searchLabel}</span>
          </div>
          <GlobalSearch stocks={searchStocks} themes={searchThemes} variant="hero" />
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            <span className="shrink-0">{copy.searchExamplePrefix}</span>
            {searchExamples.map((ex) => (
              <Link
                key={ex.ticker}
                prefetch={false}
                href={"/stock/" + ex.ticker}
                className="inline-flex items-center gap-1 border-b border-zinc-300 dark:border-zinc-700 py-0.5 font-medium text-zinc-700 dark:text-zinc-200 hover:border-blue-500 hover:text-blue-700 dark:hover:text-blue-300 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
              >
                <span className="truncate max-w-[7rem]">{ex.name}</span>
                <span className="font-mono tabular-nums text-[10px] text-zinc-400 dark:text-zinc-500">{ex.ticker}</span>
              </Link>
            ))}
            <span className="shrink-0 text-zinc-400 dark:text-zinc-500">· {copy.searchCodeNote}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 mt-3 md:mt-4">
          <a href="#today-candidates" className="ui-primary-action text-center px-4 py-2.5 min-h-[44px] inline-flex items-center justify-center gap-2 rounded-md text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
            <span>{copy.primaryCta}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
          <Link
            prefetch={false}
            href="/stocks"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-sm text-sm font-semibold text-zinc-600 dark:text-zinc-300 underline decoration-zinc-300 dark:decoration-zinc-600 underline-offset-4 hover:text-blue-700 dark:hover:text-blue-300 hover:decoration-blue-400 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span>{copy.browseAll}</span>
          </Link>
        </div>
        <p className="mt-4 max-w-2xl border-t border-zinc-200 dark:border-zinc-800 pt-3 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          {copy.note}
        </p>
        <HomeMarketPulse data={marketPulse} />
      </div>
    </section>
  );
}
