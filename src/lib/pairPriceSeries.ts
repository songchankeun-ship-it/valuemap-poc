import type { PricePoint } from "./priceHistory";

const SESSION_LIMIT = 20;

export function alignPairPrices(a: PricePoint[], b: PricePoint[], asOf?: string | null) {
  const cutoff = asOf?.replaceAll("-", "");
  const byDate = (points: PricePoint[]) =>
    new Map(points
      .filter(({ d, c }) => /^\d{4}-\d{2}-\d{2}$/.test(d) && Number.isFinite(c) && c > 0 &&
        (!cutoff || d.replaceAll("-", "") <= cutoff))
      .map(({ d, c }) => [d, c] as const));
  const aPrices = byDate(a);
  const bPrices = byDate(b);
  const common = [...aPrices.keys()].filter((date) => bPrices.has(date)).sort().slice(-SESSION_LIMIT);
  if (common.length < 2) return null;
  const start = common[0];
  return common.map((date) => ({
    date,
    a: (aPrices.get(date)! / aPrices.get(start)!) * 100,
    b: (bPrices.get(date)! / bPrices.get(start)!) * 100,
  }));
}
