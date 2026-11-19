// 종목 가격 시계열 로더 — 서버 컴포넌트에서 fs로 직접 읽음.
import fs from "fs";
import path from "path";

export interface PricePoint {
  d: string; // YYYY-MM-DD
  c: number; // close
  v: number; // volume
}

export interface PriceHistory {
  ticker: string;
  generatedAt: string;
  count: number;
  from: string;
  to: string;
  points: PricePoint[];
}

export function priceChange63Sessions(history: PriceHistory | null): number | null {
  const points = history?.points;
  if (!points || points.length <= 63) return null;
  const lastClose = points[points.length - 1]?.c;
  const pastClose = points[points.length - 1 - 63]?.c;
  return lastClose && pastClose && pastClose > 0
    ? ((lastClose - pastClose) / pastClose) * 100
    : null;
}

/**
 * 특정 종목의 가격 시계열 로드. 데이터 없으면 null.
 */
export async function getPriceHistory(ticker: string): Promise<PriceHistory | null> {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "data",
      "prices",
      `${ticker}.json`,
    );
    if (!fs.existsSync(filePath)) return null;
    const raw = await fs.promises.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as PriceHistory;
    if (!parsed?.points || parsed.points.length < 2) return null;
    return parsed;
  } catch {
    return null;
  }
}
