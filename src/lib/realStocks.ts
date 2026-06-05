import stocksData from "../../public/data/stocks.json";
import type { MockStock } from "./mockData";

export interface RealStock extends MockStock {
  beta?: number | null;
  peg?: number | null;
  returns?: { r1m?: number; r3m?: number; r6m?: number };
  volStats?: { annualReturn?: number; annualStd?: number; sharpe?: number };
  flowStats?: { recent5dAvg?: number; recent20dAvg?: number; ratio?: number };
  compositeScore?: number;
  market?: string;
}

const raw = stocksData as any;

export const realStockPool: RealStock[] = (raw.stocks || []).map((s: any) => ({
  ticker: s.ticker,
  name: s.name,
  currentPrice: s.currentPrice || 0,
  changePct: s.changePct || 0,
  marketCap: s.marketCap || 0,
  per: s.per || 0,
  pbr: s.pbr || 0,
  roe: s.roe || 0,
  dividendYield: s.dividendYield || 0,
  momentum: typeof s.momentum === "number" ? s.momentum : 50,
  flow: typeof s.flow === "number" ? s.flow : 50,
  value: typeof s.value === "number" ? s.value : 50,
  vol: typeof s.volScore === "number" ? s.volScore : 50,
  neglectScore: typeof s.value === "number" ? Math.round(s.value) : 50,
  themes: Array.isArray(s.themes) ? s.themes : [],
  beta: s.beta ?? null,
  peg: s.peg ?? null,
  returns: s.returns ?? {},
  volStats: s.volStats ?? {},
  flowStats: s.flowStats ?? {},
  compositeScore: s.compositeScore ?? 50,
  market: s.market ?? "KOSPI",
}));

export function allThemes(): string[] {
  const set = new Set<string>();
  for (const s of realStockPool) for (const t of s.themes) set.add(t);
  return Array.from(set).sort();
}

export const dataMetadata = {
  generatedAt: raw.generatedAt as string | undefined,
  source: raw.source as string | undefined,
  count: (raw.count || realStockPool.length) as number,
  metricsVersion: raw.metricsVersion as string | undefined,
  asOfBusinessDate: raw.asOfBusinessDate as string | undefined,
};
