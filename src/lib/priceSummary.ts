// 종목 가격 시계열에서 파생하는 텍스트 요약(접근성/SEO fallback 전용).
//
// 목적: 종목 상세의 주가 차트는 인터랙티브 SVG 클라이언트 컴포넌트라
//   next/dynamic({ ssr:false })로 지연 로드된다 → 검색엔진·스크린리더·비JS 환경에는
//   차트 제목만 있고 내용 요약이 없어 "빈 섹션"처럼 보인다.
//   이 헬퍼는 이미 받은 종가 배열에서만 계산해(새 데이터/API 없음) 서버 렌더 텍스트를 만든다.
//
// 원칙:
//  - 존재하는 종가/날짜만 사용. 차트 이벤트(공시·급등 구간명 등)를 지어내지 않는다.
//  - 값이 부족하면 해당 항목을 null로 반환(graceful).
//  - 투자 자문 표현 없이 관찰된 수치만 기술.
import type { PricePoint } from "./priceHistory";

// 대략적인 영업일 환산(달력 3개월 ≈ 63거래일, 1개월 ≈ 21거래일).
export const TRADING_DAYS_3M = 63;
export const TRADING_DAYS_1M = 21;

export interface PriceSummary {
  /** 표시 가능한 구간 전체 등락률 %(첫 종가 대비 마지막 종가). 2점 이상이면 항상 존재. */
  fullReturnPct: number | null;
  /** 최근 3개월(약 63거래일) 등락률 %. 데이터가 부족하면 null. */
  return3mPct: number | null;
  /** 최근 1개월(약 21거래일) 등락률 %. 데이터가 부족하면 null. */
  return1mPct: number | null;
  /** 표시 구간 내 고점 대비 최대 낙폭 %(음수). 계산 불가 시 null. */
  maxDrawdownPct: number | null;
  /** 마지막 종가(원). */
  lastClose: number | null;
  /** 시작 거래일 YYYY-MM-DD. */
  fromDate: string | null;
  /** 마지막 거래일 YYYY-MM-DD. */
  toDate: string | null;
  /** 표시 구간 거래일 수. */
  tradingDays: number;
}

function pctChange(fromClose: number, toClose: number): number | null {
  if (!(fromClose > 0) || !Number.isFinite(toClose)) return null;
  return ((toClose - fromClose) / fromClose) * 100;
}

/**
 * 가격 시계열에서 텍스트 요약을 계산한다. 새 데이터 없이 종가 배열만 사용.
 */
export function computePriceSummary(points: PricePoint[]): PriceSummary {
  const n = points.length;
  const empty: PriceSummary = {
    fullReturnPct: null,
    return3mPct: null,
    return1mPct: null,
    maxDrawdownPct: null,
    lastClose: null,
    fromDate: null,
    toDate: null,
    tradingDays: n,
  };
  if (n < 2) return empty;

  const first = points[0];
  const last = points[n - 1];

  // 최근 N거래일 등락률 — 충분한 이력이 있을 때만.
  const return3mPct =
    n - 1 >= TRADING_DAYS_3M ? pctChange(points[n - 1 - TRADING_DAYS_3M].c, last.c) : null;
  const return1mPct =
    n - 1 >= TRADING_DAYS_1M ? pctChange(points[n - 1 - TRADING_DAYS_1M].c, last.c) : null;

  // 표시 구간 고점 대비 최대 낙폭(음수). 종가 기준.
  let peak = points[0].c;
  let maxDd = 0;
  for (let i = 1; i < n; i++) {
    const c = points[i].c;
    if (c > peak) peak = c;
    if (peak > 0) {
      const dd = (c - peak) / peak;
      if (dd < maxDd) maxDd = dd;
    }
  }

  return {
    fullReturnPct: pctChange(first.c, last.c),
    return3mPct,
    return1mPct,
    maxDrawdownPct: maxDd < 0 ? maxDd * 100 : null,
    lastClose: Number.isFinite(last.c) ? last.c : null,
    fromDate: first.d ?? null,
    toDate: last.d ?? null,
    tradingDays: n,
  };
}

/** +12.3% / -4.5% 형태의 부호 포함 퍼센트 문자열. */
export function signedPctText(pct: number | null): string | null {
  if (pct === null || !Number.isFinite(pct)) return null;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}
