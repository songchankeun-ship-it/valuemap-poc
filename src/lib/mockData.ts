// Dummy data fallback. Replace with DB calls in production.

export interface MockTheme {
  slug: string;
  name: string;
  category: string;
  stockCount: number;
  neglectScore: number;
  compositeScore: number;
  momentum: number;
  flow: number;
  value: number;
  vol: number;
  return1m: number;
  return3m: number;
  return6m: number;
  return1y: number;
}

export const mockTopNeglectedThemes: MockTheme[] = [
  { slug: "battery",        name: "2차전지",         category: "산업", stockCount: 22, neglectScore: 87, compositeScore: 75, momentum: 65, flow: 78, value: 87, vol: 70, return1m: 4.2,  return3m: 12.7, return6m: -3.4, return1y: -18.5 },
  { slug: "semi-materials", name: "반도체 소재",     category: "산업", stockCount: 12, neglectScore: 82, compositeScore: 73, momentum: 60, flow: 75, value: 84, vol: 72, return1m: 1.8,  return3m: 8.4,  return6m: -6.2, return1y: -15.3 },
  { slug: "bio",            name: "바이오",          category: "산업", stockCount: 40, neglectScore: 78, compositeScore: 68, momentum: 55, flow: 70, value: 80, vol: 65, return1m: 2.4,  return3m: 5.8,  return6m: -8.1, return1y: -22.0 },
  { slug: "shipbuilding",   name: "조선",            category: "산업", stockCount: 9,  neglectScore: 75, compositeScore: 72, momentum: 70, flow: 68, value: 75, vol: 75, return1m: 3.1,  return3m: 11.2, return6m: 5.8,  return1y: -8.4 },
  { slug: "robot",          name: "로봇",            category: "기술", stockCount: 28, neglectScore: 71, compositeScore: 70, momentum: 72, flow: 65, value: 70, vol: 73, return1m: 5.4,  return3m: 9.8,  return6m: 2.1,  return1y: -5.2 },
];

export interface MockStock {
  ticker: string;
  name: string;
  currentPrice: number;
  changePct: number;
  marketCap: number;
  per: number;
  pbr: number;
  roe: number;
  dividendYield: number;
  momentum: number;
  flow: number;
  value: number;
  vol: number;
  neglectScore: number;
  themes: string[];
}

export const mockStocksInTheme: Record<string, MockStock[]> = {
  battery: [
    { ticker: "373220", name: "LG에너지솔루션",  currentPrice: 325500, changePct: 1.21,  marketCap: 76_000_000_000_000, per: 14.2, pbr: 1.85, roe: 12.4, dividendYield: 0.8, momentum: 68, flow: 81, value: 92, vol: 72, neglectScore: 92, themes: ["2차전지","전기차","LFP 배터리","LG그룹","전고체 배터리"] },
    { ticker: "006400", name: "삼성SDI",         currentPrice: 198400, changePct: -0.5,  marketCap: 13_650_000_000_000, per: 11.8, pbr: 1.42, roe: 9.8,  dividendYield: 1.2, momentum: 62, flow: 70, value: 82, vol: 68, neglectScore: 88, themes: ["2차전지","전기차","삼성그룹","전고체 배터리"] },
    { ticker: "096770", name: "SK이노베이션",    currentPrice: 95200,  changePct: -1.8,  marketCap: 8_770_000_000_000,  per: 9.5,  pbr: 0.85, roe: 8.4,  dividendYield: 2.1, momentum: 55, flow: 60, value: 79, vol: 65, neglectScore: 85, themes: ["2차전지","정유화학","SK그룹"] },
    { ticker: "247540", name: "에코프로비엠",    currentPrice: 142800, changePct: 2.4,   marketCap: 13_980_000_000_000, per: 18.6, pbr: 3.42, roe: 18.2, dividendYield: 0.3, momentum: 78, flow: 72, value: 75, vol: 70, neglectScore: 82, themes: ["2차전지","2차전지 소재부품","에코프로그룹"] },
  ],
  "semi-materials": [
    { ticker: "005930", name: "삼성전자", currentPrice: 78200, changePct: 0.8, marketCap: 467_000_000_000_000, per: 12.8, pbr: 1.42, roe: 11.2, dividendYield: 2.4, momentum: 72, flow: 80, value: 75, vol: 74, neglectScore: 75, themes: ["반도체","HBM/HBM3E","DDR5","삼성그룹","밸류업"] },
  ],
};

export function getThemeBySlug(slug: string): MockTheme | undefined {
  return mockTopNeglectedThemes.find((t) => t.slug === slug);
}

export function getStocksInTheme(slug: string): MockStock[] {
  return mockStocksInTheme[slug] ?? [];
}

import { realStockPool as validStockPool } from "./realStocks";

const inThemeStocks: MockStock[] = Object.values(mockStocksInTheme).flat();
const allStocksMap = new Map<string, MockStock>();
for (const s of inThemeStocks) allStocksMap.set(s.ticker, s);
for (const s of validStockPool) allStocksMap.set(s.ticker, s);
const allStocks: MockStock[] = Array.from(allStocksMap.values());

export function getAllStocks(): MockStock[] {
  return allStocks;
}

export function getStockByTicker(ticker: string): MockStock | undefined {
  return allStocks.find((s) => s.ticker === ticker);
}

import type { StockAnalysisInput } from "./prompts/stock-analysis";

export function getMockStockInputForAI(ticker: string): StockAnalysisInput | null {
  const s = getStockByTicker(ticker);
  if (!s) return null;
  const primaryTheme = s.themes[0];
  const peers = allStocks.filter((p) => p.themes.includes(primaryTheme) && p.ticker !== s.ticker);
  const peerPerAvg = peers.length > 0 ? peers.reduce((sum, p) => sum + p.per, 0) / peers.length : s.per * 1.2;
  const peerPbrAvg = peers.length > 0 ? peers.reduce((sum, p) => sum + p.pbr, 0) / peers.length : s.pbr * 1.2;

  return {
    ticker: s.ticker,
    name: s.name,
    marketCap: s.marketCap,
    currentPrice: s.currentPrice,
    changePct: s.changePct,
    per: s.per,
    pbr: s.pbr,
    roe: s.roe,
    dividendYield: s.dividendYield,
    momentumScore: s.momentum,
    flowScore: s.flow,
    valueScore: s.value,
    volAdjustedScore: s.vol,
    compositeScore: Math.round((s.momentum + s.flow + s.value + s.vol) / 4),
    neglectScore: s.neglectScore,
    peerPerAvg: Number(peerPerAvg.toFixed(2)),
    peerPbrAvg: Number(peerPbrAvg.toFixed(2)),
    themes: s.themes,
    foreignNetSum: 28_500_000_000,
    pensionNetSum: 4_700_000_000,
    recentDisclosures: [
      { reportNm: "분기보고서(2026.1Q)", submittedAt: "2026-05-15" },
      { reportNm: "주요사항보고서(자기주식취득결정)", submittedAt: "2026-05-08" },
      { reportNm: "임원·주요주주특정증권등소유상황보고서", submittedAt: "2026-04-30" },
    ],
    return1m: 3.4,
    return3m: 8.2,
    return6m: -5.1,
    return1y: -14.8,
  };
}

export const mockMarketIndices = {
  kospi:  { value: 2750.32, changePct: 0.45 },
  kosdaq: { value: 850.18,  changePct: -0.32 },
  usdkrw: { value: 1328,    changePct: 0.0 },
};

export const mockInsight = {
  title: "외국인 자금이 3주 연속 유입한 테마 3",
  body:  "지난 3거래일간 외국인 순매수 상위 테마에서 자금 흐름이 추세적임. 가장 두드러진 곳은 반도체 소재, 조선, 바이오.",
  tags:  ["반도체 소재", "조선", "바이오"],
};
