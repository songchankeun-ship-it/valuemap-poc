import type { Metadata } from "next";
import { realStockPool, allThemes, dataMetadata, formatBizDateLong, isDataStale } from "@/lib/realStocks";
import { sectorOf } from "@/lib/sector";
import { getPriceLagSummary } from "@/lib/priceLag";
import { StocksExplorer } from "@/components/StocksExplorer";
import { CompareTray } from "@/components/stock/CompareTray";
import { TopicLandingLinks } from "@/components/seo/TopicLandingLinks";
import { metricKeywords, stockDiscoveryKeywords, uniqueKeywords } from "@/lib/seoKeywords";
import { stocksSearchOwnership, type SeoSearchParams } from "@/lib/seoContract";

export const revalidate = 3600;

interface PageProps {
  searchParams: Promise<SeoSearchParams>;
}

function allSectors() {
  return Array.from(new Set(realStockPool.map((s) => sectorOf(s.themes, s.ticker)))).sort((a, b) => a.localeCompare(b, "ko"));
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { index, canonical } = stocksSearchOwnership(await searchParams);
  const title = "주식 스크리닝·종목 검색 — 오른스코어";
  const description = `${dataMetadata.count}개 코스피·코스닥 종목을 검색하고 정렬합니다. PER·PBR·ROE, 배당수익률, 저평가, 추세, 거래활성도, 위험조정 지표로 종목을 좁혀보세요.`;
  return {
    title,
    description,
    keywords: uniqueKeywords(stockDiscoveryKeywords, metricKeywords),
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "오른스코어",
      locale: "ko_KR",
      type: "website",
      // 공용 정적 공유 카드를 명시해 미리보기 이미지를 유지.
      images: ["/social/ornscore-og-1200x630.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: { index, follow: true },
    alternates: { canonical },
  };
}

export default async function StocksPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const theme = typeof params.theme === "string" ? params.theme : undefined;
  const sector = typeof params.sector === "string" ? params.sector : undefined;
  const q = typeof params.q === "string" ? params.q : "";
  const { canonical } = stocksSearchOwnership(params);
  const stocks = realStockPool.map((s) => ({
    ticker: s.ticker,
    name: s.name,
    currentPrice: s.currentPrice,
    changePct: s.changePct,
    marketCap: s.marketCap,
    market: s.market ?? "KOSPI",
    dividendYield: s.dividendYield ?? 0,
    eps: s.eps ?? 0,
    per: s.per,
    pbr: s.pbr,
    roe: s.roe,
    momentum: s.momentum,
    flow: s.flow,
    value: s.value,
    vol: s.vol,
    compositeScore: s.compositeScore,
    themes: s.themes,
    sector: sectorOf(s.themes, s.ticker),
    r3m: typeof s.returns?.r3m === "number" ? s.returns.r3m : null,
  }));
  const themes = allThemes();
  const sectors = allSectors();
  const validSector = sector && sectors.includes(sector) ? sector : undefined;
  const legacySector = theme && !themes.includes(theme) && sectors.includes(theme) ? theme : undefined;
  const initialSector = validSector ?? legacySector;
  const unresolvedTheme = theme && !themes.includes(theme) && !legacySector && !initialSector ? theme : undefined;
  const initialThemes = theme && themes.includes(theme) ? [theme] : unresolvedTheme ? [unresolvedTheme] : [];
  const laggedTickers = getPriceLagSummary().laggedTickers;
  return (
    <>
      <StocksExplorer
        stocks={stocks}
        allThemes={themes}
        initialThemes={initialThemes}
        initialSector={initialSector}
        initialQuery={q}
        totalCount={stocks.length}
        asOf={formatBizDateLong(dataMetadata.asOfBusinessDate)}
        metricsVersion={dataMetadata.metricsVersion}
        dataStale={isDataStale(dataMetadata.asOfBusinessDate)}
        laggedTickers={laggedTickers}
      />
      <TopicLandingLinks ownerPath={canonical} />
      {/* 설계서 §8-3·§12-5: 발견에서 담은 종목을 비교함 N/4로 이어가는 트레이. 담기는 각 카드가
          소유하고, 트레이는 담긴 수 반영 + /compare 이동만 담당(count 0이면 자동 숨김). */}
      <CompareTray />
    </>
  );
}
