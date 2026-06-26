// 검색조건 → 종목 매칭 술어. StocksExplorer 필터와 동일 규칙을 서버(알림 cron)에서 재사용.
import type { SavedSearchConfig } from "@/lib/savedSearches";

export interface StockForMatch {
  ticker: string;
  name: string;
  per: number;
  pbr: number;
  roe: number;
  dividendYield: number;
  eps: number;
  score: number; // compositeOf 반올림값 (화면 표시 점수와 동일)
  momentum: number; // 4지표 하위 점수 (추세)
  flow: number; // 거래활성도
  value: number; // 밸류
  vol: number; // 위험조정
  marketCap: number;
  market: string;
  themes: string[];
}

const CAP_LARGE = 5_000_000_000_000;
const CAP_MID = 1_000_000_000_000;

export function matchesConfig(s: StockForMatch, c: SavedSearchConfig): boolean {
  if (c.query) {
    const q = c.query.toLowerCase();
    if (!s.name.toLowerCase().includes(q) && !s.ticker.includes(q)) return false;
  }
  if (c.market && c.market !== "all" && s.market !== c.market) return false;
  const bucket = c.capBucket ?? "all";
  if (bucket === "large" && !(s.marketCap >= CAP_LARGE)) return false;
  if (bucket === "mid" && !(s.marketCap >= CAP_MID && s.marketCap < CAP_LARGE)) return false;
  if (bucket === "small" && !(s.marketCap > 0 && s.marketCap < CAP_MID)) return false;
  if (s.score < (c.minComposite ?? 0)) return false;
  if (s.per > 0 && (s.per < (c.perMin ?? 0) || s.per > (c.perMax ?? 200))) return false;
  if (s.pbr > 0 && (s.pbr < (c.pbrMin ?? 0) || s.pbr > (c.pbrMax ?? 30))) return false;
  if ((c.roeMin ?? 0) > 0 && s.roe < (c.roeMin ?? 0)) return false;
  if ((c.divYieldMin ?? 0) > 0 && s.dividendYield < (c.divYieldMin ?? 0)) return false;
  if ((c.momentumMin ?? 0) > 0 && s.momentum < (c.momentumMin ?? 0)) return false;
  if ((c.flowMin ?? 0) > 0 && s.flow < (c.flowMin ?? 0)) return false;
  if ((c.valueMin ?? 0) > 0 && s.value < (c.valueMin ?? 0)) return false;
  if ((c.volMin ?? 0) > 0 && s.vol < (c.volMin ?? 0)) return false;
  if (c.excludeLoss && !(s.eps > 0)) return false;
  if (c.themes && c.themes.length > 0) {
    if (!s.themes.some((t) => c.themes!.includes(t))) return false;
  }
  return true;
}
