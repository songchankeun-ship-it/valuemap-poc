import type { Metadata } from "next";
import { realStockPool, allThemes, dataMetadata, formatBizDateLong, isDataStale } from "@/lib/realStocks";
import { sectorOf } from "@/lib/sector";
import { StocksExplorer } from "@/components/StocksExplorer";

export const revalidate = 3600;

interface PageProps {
  searchParams: Promise<{ theme?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { theme } = await searchParams;
  if (theme) {
    return {
      title: `${theme} 관련 종목 — 오른스코어`,
      description: `${theme} 테마 종목을 자체 지표 4종(추세·거래활성도·밸류·위험조정)으로 정렬·필터링합니다.`,
    };
  }
  return {
    title: "종목 탐색 — 오른스코어",
    description: "138개 종목을 자체 지표 4종으로 정렬·필터링",
  };
}

export default async function StocksPage({ searchParams }: PageProps) {
  const { theme } = await searchParams;
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
    sector: sectorOf(s.themes),
    r3m: typeof s.returns?.r3m === "number" ? s.returns.r3m : null,
  }));
  const themes = allThemes();
  const initialThemes = theme && themes.includes(theme) ? [theme] : [];
  return (
    <StocksExplorer
      stocks={stocks}
      allThemes={themes}
      initialThemes={initialThemes}
      totalCount={stocks.length}
      asOf={formatBizDateLong(dataMetadata.asOfBusinessDate)}
      metricsVersion={dataMetadata.metricsVersion}
      dataStale={isDataStale(dataMetadata.asOfBusinessDate)}
    />
  );
}
