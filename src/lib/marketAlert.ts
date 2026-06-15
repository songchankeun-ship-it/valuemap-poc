// KRX 시장경보 로더. public/data/market-alerts.json(스크래퍼 생성)을 읽어 종목별 활성 경보 제공.
// 데이터 없으면 빈 배열(가짜 경보 표시 안 함 — 설계서 원칙 #8).
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type MarketAlertType =
  | "INVESTMENT_CAUTION"   // 투자주의
  | "INVESTMENT_WARNING"   // 투자경고
  | "INVESTMENT_RISK"      // 투자위험
  | "WARNING_PRENOTICE"    // 투자경고 지정예고
  | "SHORT_TERM_OVERHEAT"  // 단기과열
  | "TRADING_HALT"         // 거래정지
  | "MANAGEMENT_ISSUE"     // 관리종목
  | "UNFAITHFUL_DISCLOSURE"// 불성실공시법인
  | "DELISTING_REVIEW";    // 상장적격성 심사

export interface MarketAlert {
  stockCode: string;
  type: MarketAlertType;
  title: string;
  announcedAt: string | null;
  isActive: boolean;
  sourceUrl: string | null;
}

const LABELS: Record<MarketAlertType, string> = {
  INVESTMENT_CAUTION: "투자주의",
  INVESTMENT_WARNING: "투자경고",
  INVESTMENT_RISK: "투자위험",
  WARNING_PRENOTICE: "투자경고 지정예고",
  SHORT_TERM_OVERHEAT: "단기과열",
  TRADING_HALT: "거래정지",
  MANAGEMENT_ISSUE: "관리종목",
  UNFAITHFUL_DISCLOSURE: "불성실공시법인",
  DELISTING_REVIEW: "상장적격성 심사",
};

export function alertLabel(t: MarketAlertType): string {
  return LABELS[t] ?? "시장경보";
}

// 위험도 우선순위(높을수록 먼저 노출). 거래정지·관리·위험 > 경고·주의.
const SEVERITY: Record<MarketAlertType, number> = {
  TRADING_HALT: 9, DELISTING_REVIEW: 8, MANAGEMENT_ISSUE: 7, INVESTMENT_RISK: 6,
  UNFAITHFUL_DISCLOSURE: 5, INVESTMENT_WARNING: 4, SHORT_TERM_OVERHEAT: 3,
  WARNING_PRENOTICE: 2, INVESTMENT_CAUTION: 1,
};

interface AlertFile { asOf: string | null; alerts: MarketAlert[] }

let cache: { byTicker: Map<string, MarketAlert[]>; asOf: string | null } | null = null;

async function load(): Promise<AlertFile> {
  try {
    const p = join(process.cwd(), "public", "data", "market-alerts.json");
    return JSON.parse(await readFile(p, "utf-8")) as AlertFile;
  } catch {
    return { asOf: null, alerts: [] };
  }
}

async function ensure() {
  if (cache) return cache;
  const f = await load();
  const byTicker = new Map<string, MarketAlert[]>();
  for (const a of f.alerts ?? []) {
    if (!a.stockCode) continue;
    if (!byTicker.has(a.stockCode)) byTicker.set(a.stockCode, []);
    byTicker.get(a.stockCode)!.push(a);
  }
  cache = { byTicker, asOf: f.asOf };
  return cache;
}

/** 종목의 활성 시장경보를 위험도 높은 순으로 반환. 없으면 빈 배열. */
export async function getActiveAlerts(stockCode: string): Promise<MarketAlert[]> {
  const c = await ensure();
  return (c.byTicker.get(stockCode) ?? [])
    .filter((a) => a.isActive)
    .sort((a, b) => (SEVERITY[b.type] ?? 0) - (SEVERITY[a.type] ?? 0));
}

/** 전체 활성 경보 보유 종목 코드 집합. */
export async function getAlertedTickers(): Promise<Set<string>> {
  const c = await ensure();
  const set = new Set<string>();
  for (const [code, arr] of c.byTicker.entries()) {
    if (arr.some((a) => a.isActive)) set.add(code);
  }
  return set;
}
