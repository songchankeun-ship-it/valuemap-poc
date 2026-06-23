// 홈 스냅샷 파생 지표 — 실데이터(stocks.json)에서 직접 계산한다.
// '거래활성도 급증' 전용 실데이터 소스가 아직 없어, 최근 거래대금 비율(flowStats.ratio,
// 최근 5일 평균 / 20일 평균)로 대체 추정한다. ratio가 결측이면 거래활성도 점수(flow)로 폴백.
// 실제 거래량 급증 데이터가 생기면 이 헬퍼만 교체하면 된다(파생 추정값임을 라벨로 명시).
import type { RealStock } from "./realStocks";

// 최근 거래대금이 평소(20일 평균)의 1.5배 이상이면 '거래 관심 증가'로 본다.
export const VOLUME_SPIKE_RATIO = 1.5;
// ratio 결측 시 폴백 기준: 거래활성도 점수 상위.
export const VOLUME_SPIKE_FLOW = 75;

/** 거래활성도 급증(파생 추정) 종목 수. */
export function volumeSpikeCount(pool: RealStock[]): number {
  return pool.filter((s) => {
    const r = s.flowStats?.ratio;
    if (typeof r === "number" && Number.isFinite(r)) return r >= VOLUME_SPIKE_RATIO;
    return s.flow >= VOLUME_SPIKE_FLOW;
  }).length;
}
