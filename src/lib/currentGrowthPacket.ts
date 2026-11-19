import stocks from "../../public/data/stocks.json";
import { activitySurge } from "./homeSnapshot";
import { buildGrowthContent } from "./growthPacket";
import { realStockPool } from "./realStocks";
import { CURATED_COMPARISON_PAIRS } from "./seoContract";

export function currentGrowthPacket() {
  const activityTickers = activitySurge(realStockPool).items.slice(0, 6).map((stock) => stock.ticker);
  return buildGrowthContent(stocks, CURATED_COMPARISON_PAIRS, activityTickers);
}
