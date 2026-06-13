import { realStockPool, allThemes } from "@/lib/realStocks";
import { StocksExplorer } from "@/components/StocksExplorer";

export const revalidate = 3600;

export const metadata = {
  title: "종목 탐색 — 밸류맵 스톡",
  description: "138개 종목을 자체 지표 4종으로 정렬·필터링",
};

export default function StocksPage() {
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
  }));
  const themes = allThemes();
  return <StocksExplorer stocks={stocks} allThemes={themes} />;
}