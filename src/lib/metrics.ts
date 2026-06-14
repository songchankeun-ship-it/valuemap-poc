// 자체 지표 4종 — 실제 운영 산식 (데이터 생성기 scripts/compute_metrics.py 와 동일).
//
// 산식 버전: Metrics v2.3
// 적용일: 2026-06-14
//
// ⚠ 모든 점수(0~100)는 '지금 더 자세히 볼 종목'을 고르는 탐색 우선순위이며,
//    매수·매도 신호가 아닙니다. 점수가 높다고 매수 추천이 아닙니다.
//
// 운영: 영업일 장마감 후 배치(scripts/compute_metrics.py)가 KRX 일별 종가로 전 종목 점수를
//       계산해 public/data/stocks.json 에 저장합니다. 아래 TS는 그 파이썬 산식의 1:1 참조 구현입니다.
//
// ── 4지표 요약 ─────────────────────────────────────────────
//  추세(momentum)   : 1·3·6개월 가중수익률(30·40·30%) → 전체 유니버스 백분위(0~100)
//  거래활성도(flow) : 최근 5일 평균 거래량 / 20일 평균 거래량 비율 → 매핑(1배=50,2배=75,3배+=100)
//  밸류(value)      : 전체 유니버스 PER·PBR 백분위 평균(저PER·저PBR일수록 100)
//  위험대비(vol)    : 최근 1년 (연환산수익 − 무위험 3.5%) / 연환산변동성 → 50 + 샤프×25
//  종합(composite)  : 네 지표 단순 평균 (가중치 없음)
// ───────────────────────────────────────────────────────────

export interface PriceSeries {
  /** 가장 오래된 → 가장 최근 순으로 정렬된 종가 배열 */
  closes: number[];
  /** closes와 동일 길이의 거래량 배열 (거래활성도 계산에 사용) */
  volumes?: number[];
}

// ---------- 추세 (모멘텀) ----------

/**
 * 1·3·6개월 수익률을 30·40·30%로 가중평균한 '원시 추세값'(%).
 * 최종 점수 = 이 값을 전체 유니버스에서 백분위(0~100)로 환산한 결과.
 * (고정 구간 매핑은 고점 포화 — 여러 종목이 100점 — 문제가 있어 백분위로 대체)
 */
export function momentumRaw(prices: PriceSeries): number | null {
  const r1 = returnPct(prices.closes, 20);
  const r3 = returnPct(prices.closes, 60);
  const r6 = returnPct(prices.closes, 120);
  if (r1 === null || r3 === null || r6 === null) return null;
  return 0.3 * r1 + 0.4 * r3 + 0.3 * r6;
}

/** 원시값 배열 → 백분위 점수(0~100). 운영에서 전 종목 momentumRaw에 적용. */
export function toPercentile(raw: number, allRaws: number[]): number {
  if (allRaws.length === 0) return 50;
  const below = allRaws.filter((v) => v < raw).length;
  return Math.round((below / allRaws.length) * 100);
}

// ---------- 거래활성도 ----------

/**
 * 최근 5일 평균 거래량 / 20일 평균 거래량.
 * 매핑: <0.5→10, 0.5~1배→10~50, 1~3배→50~100(1배=50,2배=75), 3배+→100.
 * ⚠ 거래대금·가격 방향·수급 주체(외국인/기관)는 미반영 — 순수 '거래량 변화'.
 */
export function flowScore(volumes: number[]): number {
  if (volumes.length < 20) return 50;
  const r5 = avg(volumes.slice(-5));
  const r20 = avg(volumes.slice(-20));
  if (r20 === 0) return 50;
  const ratio = r5 / r20;
  let score: number;
  if (ratio < 0.5) score = 10;
  else if (ratio < 1.0) score = 10 + (ratio - 0.5) * 80;
  else if (ratio < 3.0) score = 50 + (ratio - 1.0) * 25;
  else score = 100;
  return Math.round(Math.max(0, Math.min(100, score)) * 10) / 10;
}

// ---------- 밸류 (저평가) ----------

/**
 * 전체 유니버스 PER·PBR 백분위 평균. 저PER·저PBR일수록 100에 가까움.
 * peerPer = 정렬된 전체 PER 배열, peerPbr = 정렬된 전체 PBR 배열.
 * ⚠ 업종 차이 미보정(전체 풀 기준). 종목 상세의 '업종 대비 밸류'는 별도 참고 지표.
 */
export function valueScore(per: number, pbr: number, peerPer: number[], peerPbr: number[]): number {
  if (per <= 0 || pbr <= 0 || peerPer.length === 0 || peerPbr.length === 0) return 50;
  const perRank = peerPer.filter((p) => p < per).length / peerPer.length;
  const pbrRank = peerPbr.filter((p) => p < pbr).length / peerPbr.length;
  return Math.round(((1 - perRank) * 100 + (1 - pbrRank) * 100) / 2);
}

// ---------- 위험대비 (변동성조정 수익률) ----------

/**
 * 최근 1년(약 252거래일) 일간 수익률의 연환산 (수익 − 무위험 3.5%) / 변동성.
 * 점수 = 50 + 샤프×25, 0~100 클립. (샤프 −2 → 0점, +2 → 100점)
 */
export function volScore(prices: PriceSeries): number {
  const closes = prices.closes.slice(-252);
  if (closes.length < 60) return 50;
  const daily: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0) daily.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  if (daily.length < 2) return 50;
  const mean = avg(daily);
  const variance = daily.reduce((s, x) => s + (x - mean) ** 2, 0) / daily.length;
  const std = Math.sqrt(variance);
  if (std === 0) return 50;
  const annualReturn = mean * 252;
  const annualStd = std * Math.sqrt(252);
  const sharpe = (annualReturn - 0.035) / annualStd;
  return Math.round(Math.max(0, Math.min(100, 50 + sharpe * 25)) * 10) / 10;
}

// ---------- 종합 ----------

/** 네 지표 단순 평균(가중치 없음). 업종 대비 밸류는 종합에 포함되지 않음(별도 참고). */
export function compositeScore(momentum: number, flow: number, value: number, vol: number): number {
  return Math.round(((momentum + flow + value + vol) / 4) * 10) / 10;
}

// ---------- 유틸 ----------

function avg(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

/** lookbackDays 거래일 전 대비 수익률(%). */
function returnPct(closes: number[], lookbackDays: number): number | null {
  if (closes.length <= lookbackDays) return null;
  const recent = closes[closes.length - 1];
  const past = closes[closes.length - 1 - lookbackDays];
  if (past <= 0) return null;
  return ((recent - past) / past) * 100;
}
