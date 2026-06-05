// 자체 지표 4종 계산 — 베이스라인 구현
// 모멘텀 · 자금흐름 · 밸류 · 변동성조정 + 종합(composite) + 소외(neglect)
//
// 모든 점수는 0~100으로 정규화. 100에 가까울수록 "지금 매수 매력적"이라는 방향.
//
// 운영에서는 batch 잡(Airflow/Cron)이 매일 장마감 후 모든 종목에 대해
// computeStockMetrics()를 호출하고 결과를 daily_stock_metrics에 저장.
// 테마 지표는 stock_themes 가중평균으로 집계.

export interface PriceSeries {
  /** 가장 오래된 → 가장 최근 순으로 정렬된 종가 배열 */
  closes: number[];
  /** closes와 동일 길이의 거래량 배열 (선택) */
  volumes?: number[];
}

export interface FundamentalSnapshot {
  per: number | null;
  pbr: number | null;
  dividendYield: number | null;
}

export interface InvestorFlow {
  /** 최근 N일간 외국인 순매수 합계 (원) */
  foreignNetSum: number;
  /** 연기금 순매수 합계 */
  pensionNetSum: number;
  /** 시가총액 (분모) */
  marketCap: number;
}

export interface PeerStats {
  /** 동일 테마/섹터 종목들의 PER 평균 */
  peerPerAvg: number;
  /** 동일 테마/섹터 종목들의 PBR 평균 */
  peerPbrAvg: number;
}

// ---------- 모멘텀 ----------

/**
 * 1M:3M:6M = 0.4:0.3:0.3 가중 평균 수익률을 -50%~+50%로 클립한 후 0~100으로 정규화.
 */
export function momentumScore(prices: PriceSeries): number {
  const r1 = returnPct(prices.closes, 21);
  const r3 = returnPct(prices.closes, 63);
  const r6 = returnPct(prices.closes, 126);

  if (r1 === null || r3 === null || r6 === null) return 50;

  const weighted = r1 * 0.4 + r3 * 0.3 + r6 * 0.3;
  return clipNormalize(weighted, -0.5, 0.5);
}

// ---------- 자금흐름 ----------

/**
 * (외국인 + 연기금) 순매수 / 시가총액 비율을 0~100으로 정규화.
 * 0.5% 이상 유입이면 80점, 1% 이상이면 100점에 근접.
 */
export function flowScore(flow: InvestorFlow): number {
  if (flow.marketCap <= 0) return 50;
  const ratio = (flow.foreignNetSum + flow.pensionNetSum) / flow.marketCap;
  return clipNormalize(ratio, -0.01, 0.01);
}

// ---------- 밸류 (저평가) ----------

/**
 * peer 대비 PER·PBR이 낮을수록 높은 점수.
 * 두 지표 평균. 결측 시 50 반환.
 */
export function valueScore(fund: FundamentalSnapshot, peer: PeerStats): number {
  const parts: number[] = [];

  if (fund.per !== null && fund.per > 0 && peer.peerPerAvg > 0) {
    const ratio = fund.per / peer.peerPerAvg; // 1보다 작으면 저평가
    parts.push(clipNormalize(ratio, 0.4, 1.6, true)); // invert: 낮을수록 높은 점수
  }

  if (fund.pbr !== null && fund.pbr > 0 && peer.peerPbrAvg > 0) {
    const ratio = fund.pbr / peer.peerPbrAvg;
    parts.push(clipNormalize(ratio, 0.4, 1.6, true));
  }

  if (parts.length === 0) return 50;
  return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
}

// ---------- 변동성조정 수익률 ----------

/**
 * 평균 일간 수익률 / 표준편차 (= 일별 샤프 비율 비슷한 값) 를 정규화.
 * 0.05 이상이면 좋은 신호.
 */
export function volAdjustedScore(prices: PriceSeries): number {
  const closes = prices.closes.slice(-126); // 최근 6개월
  if (closes.length < 30) return 50;

  const daily: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    daily.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  const mean = daily.reduce((a, b) => a + b, 0) / daily.length;
  const variance = daily.reduce((s, x) => s + (x - mean) ** 2, 0) / daily.length;
  const std = Math.sqrt(variance);
  if (std === 0) return 50;
  const sharpeLike = mean / std;
  return clipNormalize(sharpeLike, -0.1, 0.1);
}

// ---------- 소외지수 (주달 호환 — 고점 대비 하락률) ----------

/**
 * 52주 최고가 대비 현재가의 하락률을 0~100 점수로.
 * 0% 하락 = 0점 (소외 안 됨), -50% 하락 = 100점 (매우 소외).
 */
export function neglectScore(prices: PriceSeries): number {
  const closes = prices.closes.slice(-252);
  if (closes.length === 0) return 50;
  const high = Math.max(...closes);
  const last = closes[closes.length - 1];
  if (high <= 0) return 50;
  const drop = (high - last) / high;
  return clipNormalize(drop, 0, 0.5);
}

// ---------- 종합 ----------

export function compositeScore(
  momentum: number,
  flow: number,
  value: number,
  vol: number,
  weights: { momentum: number; flow: number; value: number; vol: number } = {
    momentum: 0.25,
    flow: 0.25,
    value: 0.3,
    vol: 0.2,
  }
): number {
  return Math.round(
    momentum * weights.momentum +
      flow * weights.flow +
      value * weights.value +
      vol * weights.vol
  );
}

// ---------- 한 번에 ----------

export interface StockMetricsInput {
  prices: PriceSeries;
  fund: FundamentalSnapshot;
  peer: PeerStats;
  flow: InvestorFlow;
}

export function computeStockMetrics(input: StockMetricsInput) {
  const momentum = momentumScore(input.prices);
  const flow = flowScore(input.flow);
  const value = valueScore(input.fund, input.peer);
  const vol = volAdjustedScore(input.prices);
  const neglect = neglectScore(input.prices);
  const composite = compositeScore(momentum, flow, value, vol);

  return { momentum, flow, value, vol, neglect, composite };
}

// ---------- 유틸 ----------

function returnPct(closes: number[], lookbackDays: number): number | null {
  if (closes.length < lookbackDays + 1) return null;
  const recent = closes[closes.length - 1];
  const past = closes[closes.length - 1 - lookbackDays];
  if (past <= 0) return null;
  return (recent - past) / past;
}

/**
 * x를 [min, max] 구간으로 클립한 후 0~100으로 정규화.
 * invert=true면 작을수록 높은 점수.
 */
function clipNormalize(x: number, min: number, max: number, invert = false): number {
  const clipped = Math.max(min, Math.min(max, x));
  const ratio = (clipped - min) / (max - min);
  const score = invert ? 1 - ratio : ratio;
  return Math.round(score * 100);
}
