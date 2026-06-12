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

/**
 * generatedAt(ISO) 또는 YYYYMMDD 형태를 YYYYMMDD로 변환.
 * stocks.json에 asOfBusinessDate가 없으면 generatedAt 날짜를 영업일로 사용.
 */
function deriveBusinessDate(asOf?: string, gen?: string): string | undefined {
  if (asOf && /^\d{8}$/.test(asOf)) return asOf;
  if (asOf && asOf.length >= 10 && asOf[4] === "-" && asOf[7] === "-") {
    return asOf.slice(0, 4) + asOf.slice(5, 7) + asOf.slice(8, 10);
  }
  if (gen) {
    try {
      const d = new Date(gen);
      if (!Number.isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const da = String(d.getDate()).padStart(2, "0");
        return `${y}${m}${da}`;
      }
    } catch {}
  }
  return undefined;
}

export const dataMetadata = {
  generatedAt: raw.generatedAt as string | undefined,
  source: raw.source as string | undefined,
  count: (raw.count || realStockPool.length) as number,
  metricsVersion: raw.metricsVersion as string | undefined,
  asOfBusinessDate: deriveBusinessDate(
    raw.asOfBusinessDate as string | undefined,
    raw.generatedAt as string | undefined,
  ),
};
