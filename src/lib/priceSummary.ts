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

// ── 차트 마커 스캐폴드(브리프 P2 #5 / 고도화 #2) ──────────────────────────
//
// 브리프는 종목 상세 차트에 5종 레이어를 제안한다: 공시 마커 / 점수 급등·급락 마커 /
// 거래활성도(거래량) 급증 마커 / 최대낙폭 구간 / 3개월 급등 경고 구간.
// 그중 "이미 받은 종가·거래량 시계열만으로 진짜로 파생 가능한" 3종(최대낙폭 구간 ·
// 3개월 급등 구간 · 거래량 급증일)만 여기서 계산한다. 점수 마커(일별 점수 시계열=Supabase
// daily_scores 필요)·공시 마커(DART 공시일-가격일 정합 필요)는 이 파일 범위 밖 —
// 새 데이터 소스가 필요해 문서에 다음 작업으로 남긴다(마커를 지어내지 않는다).
//
// 원칙: 존재하는 d/c/v 값만 사용. 임계 미달·이력 부족 항목은 null/0/false로 반환(graceful).

/** 3개월(약 63거래일) 등락률이 이 값(%) 이상이면 "급등 구간"으로 표시(경고 아님, 확인 유도). */
export const SURGE_3M_THRESHOLD_PCT = 40;
/** 거래량 급증 판정: 직전 baseline 거래일 중앙값 대비 이 배수 이상. */
export const VOLUME_SPIKE_MULTIPLE = 3;
/** 거래량 급증 baseline 거래일 수(직전 N일 중앙값). */
export const VOLUME_SPIKE_BASELINE = 20;
/** 거래량 급증을 훑는 최근 구간 거래일 수(약 3개월). */
export const VOLUME_SPIKE_WINDOW = TRADING_DAYS_3M;

export interface ChartEvents {
  /** 최대낙폭 고점(peak) 거래일. 낙폭 없음이면 null. */
  maxDrawdownPeakDate: string | null;
  /** 최대낙폭 저점(trough) 거래일. 낙폭 없음이면 null. */
  maxDrawdownTroughDate: string | null;
  /** 3개월 급등 구간 — 임계 이상일 때만 존재, 아니면 null. */
  surge3m: { pct: number; fromDate: string | null; toDate: string | null } | null;
  /** 최근 구간 거래량 급증일 수. */
  volumeSpikeCount: number;
  /** 가장 최근 거래량 급증일. 없으면 null. */
  recentVolumeSpikeDate: string | null;
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * 가격/거래량 시계열에서 차트 마커 후보 이벤트를 파생한다(새 데이터 없이 d/c/v만 사용).
 * 실제 차트 오버레이는 후속 작업 — 이 순수 함수가 그 단일 소스가 되고, 지금은 텍스트로만 노출한다.
 */
export function computeChartEvents(points: PricePoint[]): ChartEvents {
  const n = points.length;
  const empty: ChartEvents = {
    maxDrawdownPeakDate: null,
    maxDrawdownTroughDate: null,
    surge3m: null,
    volumeSpikeCount: 0,
    recentVolumeSpikeDate: null,
  };
  if (n < 2) return empty;

  // 최대낙폭 고점/저점 거래일 — computePriceSummary 와 동일 규칙(종가 기준)으로 인덱스만 추적.
  let peak = points[0].c;
  let peakIdx = 0;
  let maxDd = 0;
  let bestPeakIdx: number | null = null;
  let bestTroughIdx: number | null = null;
  for (let i = 1; i < n; i++) {
    const c = points[i].c;
    if (c > peak) {
      peak = c;
      peakIdx = i;
    }
    if (peak > 0) {
      const dd = (c - peak) / peak;
      if (dd < maxDd) {
        maxDd = dd;
        bestPeakIdx = peakIdx;
        bestTroughIdx = i;
      }
    }
  }

  // 3개월 급등 구간 — 충분한 이력이 있고 임계 이상일 때만.
  let surge3m: ChartEvents["surge3m"] = null;
  if (n - 1 >= TRADING_DAYS_3M) {
    const fromIdx = n - 1 - TRADING_DAYS_3M;
    const pct = pctChange(points[fromIdx].c, points[n - 1].c);
    if (pct !== null && pct >= SURGE_3M_THRESHOLD_PCT) {
      surge3m = { pct, fromDate: points[fromIdx].d ?? null, toDate: points[n - 1].d ?? null };
    }
  }

  // 거래량 급증일 — 최근 구간에서 직전 baseline 중앙값 대비 배수 이상인 날.
  let volumeSpikeCount = 0;
  let recentVolumeSpikeDate: string | null = null;
  const start = Math.max(VOLUME_SPIKE_BASELINE, n - VOLUME_SPIKE_WINDOW);
  for (let i = start; i < n; i++) {
    const base = median(
      points.slice(i - VOLUME_SPIKE_BASELINE, i).map((p) => p.v).filter((v) => Number.isFinite(v) && v > 0),
    );
    const v = points[i].v;
    if (base > 0 && Number.isFinite(v) && v >= base * VOLUME_SPIKE_MULTIPLE) {
      volumeSpikeCount++;
      recentVolumeSpikeDate = points[i].d ?? recentVolumeSpikeDate;
    }
  }

  return {
    maxDrawdownPeakDate: bestPeakIdx !== null ? points[bestPeakIdx].d ?? null : null,
    maxDrawdownTroughDate: bestTroughIdx !== null ? points[bestTroughIdx].d ?? null : null,
    surge3m,
    volumeSpikeCount,
    recentVolumeSpikeDate,
  };
}
