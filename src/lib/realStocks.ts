import stocksData from "../../public/data/stocks.json";
import type { MockStock } from "./mockData";

export interface RealStock extends MockStock {
  beta?: number | null;
  peg?: number | null;
  returns?: { r1m?: number; r3m?: number; r6m?: number; r1y?: number };
  volStats?: { annualReturn?: number; annualStd?: number; sharpe?: number; days?: number; maxDrawdown?: number; worstDay?: number };
  /**
   * 거래활성도(flow) 지표의 원시 근거. 계약 정본(SOURCE OF TRUTH):
   * 모든 값은 **주식 체결 수량(share volume, 거래량)** 기준이며 거래대금(turnover value, 원)이 아니다.
   * `recent5dAvg`/`recent20dAvg`는 최근 5/20거래일 **평균 거래량(주)**, `ratio` = 5일 ÷ 20일.
   * 필드명(`…Avg`)은 호환성을 위해 단위-중립으로 유지하되, 의미는 여기 한 곳에서만 정의한다.
   * 이 지표는 가격 방향(상승/하락)이나 매매 주체(외국인/기관 등)를 나타내지 않는다.
   */
  flowStats?: { recent5dAvg?: number; recent20dAvg?: number; ratio?: number };
  compositeScore?: number;
  market?: string;
  eps?: number;
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
  eps: s.eps ?? 0,
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

// ── 데이터 기준일 표기·신선도 공용 헬퍼 (전 화면 동일 포맷·동일 판정 보장) ──
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** YYYYMMDD → "MM.DD (요일)" — 홈 히어로 등 컴팩트 표기. */
export function formatBizDateShort(yyyymmdd?: string): string {
  if (yyyymmdd && /^\d{8}$/.test(yyyymmdd)) {
    const mo = yyyymmdd.slice(4, 6);
    const da = yyyymmdd.slice(6, 8);
    const d = new Date(Number(yyyymmdd.slice(0, 4)), Number(mo) - 1, Number(da));
    return `${mo}.${da} (${WEEKDAYS[d.getDay()]})`;
  }
  return "최근 거래일";
}

/** YYYYMMDD → "YYYY.MM.DD (요일)" — 헤더·오늘·푸터 등 정식 표기. */
export function formatBizDateLong(yyyymmdd?: string): string {
  if (yyyymmdd && /^\d{8}$/.test(yyyymmdd)) {
    const y = yyyymmdd.slice(0, 4);
    const mo = yyyymmdd.slice(4, 6);
    const da = yyyymmdd.slice(6, 8);
    const d = new Date(Number(y), Number(mo) - 1, Number(da));
    return `${y}.${mo}.${da} (${WEEKDAYS[d.getDay()]})`;
  }
  return "데이터 준비 중";
}

/** YYYYMMDD → "MM.DD(요일)" — 모바일 헤더용 초압축. */
export function formatBizDateMobile(yyyymmdd?: string): string {
  if (yyyymmdd && /^\d{8}$/.test(yyyymmdd)) {
    const mo = yyyymmdd.slice(4, 6);
    const da = yyyymmdd.slice(6, 8);
    const d = new Date(Number(yyyymmdd.slice(0, 4)), Number(mo) - 1, Number(da));
    return `${mo}.${da}(${WEEKDAYS[d.getDay()]})`;
  }
  return "-";
}

/** 데이터 기준일로부터 경과 영업일 수(월~금). 형식 불명 시 null. */
export function businessDaysSince(yyyymmdd?: string): number | null {
  if (!yyyymmdd || !/^\d{8}$/.test(yyyymmdd)) return null;
  const y = Number(yyyymmdd.slice(0, 4));
  const mo = Number(yyyymmdd.slice(4, 6));
  const da = Number(yyyymmdd.slice(6, 8));
  const dataDate = new Date(y, mo - 1, da);
  if (Number.isNaN(dataDate.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let days = 0;
  const cursor = new Date(dataDate);
  while (cursor < today) {
    cursor.setDate(cursor.getDate() + 1);
    const wd = cursor.getDay();
    if (wd !== 0 && wd !== 6) days += 1;
  }
  return days;
}

/** 데이터가 2영업일 이상 지났으면 stale로 간주 — 자동 갱신 지연·실패 경고용. */
export function isDataStale(yyyymmdd?: string): boolean {
  const d = businessDaysSince(yyyymmdd);
  return d !== null && d >= 2;
}
