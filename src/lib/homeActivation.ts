import { isSuspect, type QualityInput } from "./dataQuality";
import { compositeOf, type ScoreParts } from "./score";

export function pickHomeCandidates<T extends QualityInput & ScoreParts & { ticker: string }>(
  pool: readonly T[],
  laggedTickers: ReadonlySet<string>,
) {
  return pool
    .filter((stock) => {
      const score = compositeOf(stock);
      return /^\d{6}$/.test(stock.ticker) && Number.isFinite(score) && score > 0 &&
        !isSuspect(stock) && !laggedTickers.has(stock.ticker);
    })
    .sort((a, b) => compositeOf(b) - compositeOf(a))
    .slice(0, 3);
}

export type HomeDetailPreview = {
  ticker: string;
  name: string;
  conclusion: string;
  nextCheck: string;
};
