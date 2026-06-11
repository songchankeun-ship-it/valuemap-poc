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
