// 홈 스냅샷 파생 지표 — 실데이터(stocks.json)에서 직접 계산한다.
// '거래활성도 급증' 전용 실데이터 소스가 아직 없어, 최근 거래대금 비율(flowStats.ratio,
// 최근 5일 평균 / 20일 평균)로 대체 추정한다. ratio가 결측이면 거래활성도 점수(flow)로 폴백.
// 실제 거래량 급증 데이터가 생기면 이 헬퍼만 교체하면 된다(파생 추정값임을 라벨로 명시).
import type { RealStock } from "./realStocks";
import { isSuspect } from "./dataQuality";

// 최근 거래대금이 평소(20일 평균)의 1.5배 이상이면 '거래 관심 증가'로 본다.
export const VOLUME_SPIKE_RATIO = 1.5;
// ratio 결측 시 폴백 기준: 거래활성도 점수 상위.
export const VOLUME_SPIKE_FLOW = 75;

/** 거래활성도 급증(파생 추정) 단일 판정식 — ratio 우선, 결측 시 flow 폴백.
 *  급증 개념을 세는 모든 곳이 이 하나의 필터만 재사용하도록 한다(임계값 중복 금지). */
export function isActivitySurge(s: RealStock): boolean {
  const r = s.flowStats?.ratio;
  if (typeof r === "number" && Number.isFinite(r)) return r >= VOLUME_SPIKE_RATIO;
  return s.flow >= VOLUME_SPIKE_FLOW;
}

/** 거래활성도 급증(파생 추정) 종목 수 — 전체 풀 기준(이상데이터 포함). */
export function volumeSpikeCount(pool: RealStock[]): number {
  return pool.filter(isActivitySurge).length;
}

/** 거래활성도 급증 단일 결과 — 필터·목록·개수를 한 객체가 소유한다.
 *  count는 items.length로만 파생되므로, 이 결과를 쓰는 요약 카드·브리핑 숫자·표시 목록이
 *  절대 서로 다른 집단을 가리킬 수 없다. */
export interface ActivitySurgeResult {
  /** 급증으로 판정된 종목 전체(거래활성도 내림차순 정렬). */
  readonly items: RealStock[];
  /** items.length와 항상 동일 — 별도 재계산 금지. */
  readonly count: number;
}

/** /today 거래활성도 급증의 단일 소스.
 *  이상데이터(isSuspect)는 후보 집단과 동일하게 제외하고, 거래활성도 순으로 정렬한다.
 *  요약 KPI·브리핑 숫자·표시 목록은 모두 이 결과 하나만 소비해야 한다. */
export function activitySurge(pool: RealStock[]): ActivitySurgeResult {
  const items = pool
    .filter((s) => !isSuspect(s) && isActivitySurge(s))
    .sort((a, b) => b.flow - a.flow);
  return { items, count: items.length };
}
