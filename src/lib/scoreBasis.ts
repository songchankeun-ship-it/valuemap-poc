// 종합 점수 근거(설계서 2 §5.1~5.2) 표시 파생 — 순수 함수.
// 4지표 점수·실데이터(수익률/거래량 추세/PER·PBR·ROE·업종 상대/변동성·낙폭·Sharpe)를
// "왜 이 점수가 나왔는지" 근거 factor로 변환한다.
// ⚠️ 점수 계산식(score.ts/metrics.ts/sector.ts)은 절대 건드리지 않는다 — 표시 파생만.
// ⚠️ 없는 데이터는 지어내지 않고 missingNote("추후 데이터 축적 후 제공")로 분리한다.
// 강점/주의 문구는 metricReadings.ts 단일 소스를 재사용한다(중복 정의 금지).

import { compositeOf } from "./score";
import {
  readMomentum,
  readFlow,
  readValue,
  readVol,
  type Reading,
} from "./metricReadings";

export type BasisKind = "momentum" | "flow" | "value" | "vol";

export interface BasisFactor {
  /** 근거 항목명(예: "3개월 수익률"). */
  label: string;
  /** 실제 값 문자열(예: "+42.5%"). */
  value: string;
}

export interface BasisPart {
  label: string; // 추세 / 거래활성도 / 밸류 / 위험조정
  kind: BasisKind;
  /** 0~100 정수. 표시·해석용. */
  score: number;
  /** 종합점수 가중(%). 4지표 동일 가중 → 항상 25. */
  weightPct: number;
  /** 종합점수 기여 ≈ round(score*0.25). 반올림이라 합이 composite와 1점 차이 날 수 있어 표시는 "≈". */
  contributionPts: number;
  /** 전체 풀 내 상대순위(1~total). */
  rank: number;
  /** 상위 백분위(1~100, 작을수록 상위). */
  topPct: number;
  total: number;
  /** 점수를 만든 실데이터 근거(없으면 빈 배열 + missingNote). */
  factors: BasisFactor[];
  /** 강점/주의 한 줄 — metricReadings 단일 소스 재사용. */
  reading: Reading;
  /** factors가 비었을 때 정직한 결측 안내. */
  missingNote?: string;
  /** 근거는 있으나 일부 항목(예: 업종 상대 밸류)이 표본 부족일 때 보조 안내. */
  extraNote?: string;
}

export interface ScoreBasis {
  composite: number;
  parts: BasisPart[];
}

export interface MetricRank {
  rank: number;
  topPct: number;
}

export interface ScoreBasisInput {
  momentum: number;
  flow: number;
  value: number;
  vol: number;
  per: number;
  pbr: number;
  roe: number;
  total: number;
  returns?: { r1m?: number; r3m?: number; r6m?: number } | null;
  volStats?: { annualStd?: number; maxDrawdown?: number; sharpe?: number; days?: number } | null;
  flowStats?: { ratio?: number } | null;
  /** sectorValueScore() 결과(score<0이면 표본 부족). */
  sectorValue: { score: number; sector: string; peers: number };
  ranks: { momentum: MetricRank; flow: MetricRank; value: MetricRank; vol: MetricRank };
}

/** 부호 있는 퍼센트 문자열(없으면 null). */
function signedPct(n?: number | null): string | null {
  if (n == null || !Number.isFinite(n)) return null;
  return (n >= 0 ? "+" : "") + n.toFixed(1) + "%";
}

function buildPart(
  label: string,
  kind: BasisKind,
  rawScore: number,
  rank: MetricRank,
  total: number,
  factors: BasisFactor[],
  reading: Reading,
  missingNote?: string,
  extraNote?: string,
): BasisPart {
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  return {
    label,
    kind,
    score,
    weightPct: 25,
    contributionPts: Math.round(score * 0.25),
    rank: rank.rank,
    topPct: rank.topPct,
    total,
    factors,
    reading,
    missingNote: factors.length === 0 ? missingNote : undefined,
    extraNote,
  };
}

/**
 * 4지표 점수 + 실데이터 → 종합 점수 근거 구조.
 * 종합점수는 score.ts의 compositeOf(4지표 단순평균)와 동일 값.
 */
export function buildScoreBasis(input: ScoreBasisInput): ScoreBasis {
  const { momentum, flow, value, vol, per, pbr, roe, total, returns, volStats, flowStats, sectorValue, ranks } = input;

  // ── 추세: 존재하는 기간 수익률만 ──────────────────────────────
  const momFactors: BasisFactor[] = [];
  if (returns) {
    const r1m = signedPct(returns.r1m);
    const r3m = signedPct(returns.r3m);
    const r6m = signedPct(returns.r6m);
    if (r1m) momFactors.push({ label: "1개월 수익률", value: r1m });
    if (r3m) momFactors.push({ label: "3개월 수익률", value: r3m });
    if (r6m) momFactors.push({ label: "6개월 수익률", value: r6m });
  }
  const momMissing = "기간별(1·3·6개월) 수익률 데이터가 아직 없어 추후 데이터 축적 후 제공합니다.";

  // ── 거래활성도: 최근 5일/20일 평균 거래량 비율(실데이터, 거래대금 아님) ──────
  const flowFactors: BasisFactor[] = [];
  const ratio = flowStats?.ratio;
  if (ratio != null && Number.isFinite(ratio)) {
    const trend = ratio >= 1.1 ? "거래 늘어남" : ratio <= 0.9 ? "거래 줄어듦" : "거래 비슷";
    flowFactors.push({ label: "최근 5일/20일 평균 거래량", value: `${ratio.toFixed(2)}배 · ${trend}` });
  }
  const flowMissing = "세부 거래량 추세 데이터가 없어 추후 데이터 축적 후 제공합니다.";

  // ── 밸류: PER·PBR·ROE + 업종 상대(표본 충분할 때만) ──────────
  const valueFactors: BasisFactor[] = [];
  if (per > 0) valueFactors.push({ label: "PER(최근 실적)", value: per.toFixed(1) + "배" });
  if (pbr > 0) valueFactors.push({ label: "PBR", value: pbr.toFixed(2) + "배" });
  if (roe !== 0) valueFactors.push({ label: "ROE", value: roe.toFixed(1) + "%" });
  let valueExtra: string | undefined;
  if (sectorValue.score >= 0) {
    valueFactors.push({
      label: `업종(${sectorValue.sector}) 내 상대 밸류`,
      value: `${sectorValue.score}/100 · 피어 ${sectorValue.peers}개`,
    });
  } else {
    valueExtra = `같은 업종 비교 표본(PER·PBR 보유 ${sectorValue.peers}개)이 4개 미만이라 업종 내 상대 밸류는 추후 데이터 축적 후 제공합니다. 위 밸류 점수는 전체 풀 기준입니다.`;
  }
  const valueMissing = "PER·PBR이 결측(적자 등)이라 밸류 근거 수치를 표시할 수 없습니다.";

  // ── 위험조정: 변동성·낙폭·Sharpe 중 존재하는 값만 ─────────────
  const volFactors: BasisFactor[] = [];
  if (volStats) {
    if (volStats.annualStd != null && Number.isFinite(volStats.annualStd)) volFactors.push({ label: "연환산 변동성", value: volStats.annualStd.toFixed(1) + "%" });
    if (volStats.maxDrawdown != null && Number.isFinite(volStats.maxDrawdown)) volFactors.push({ label: "최대낙폭", value: volStats.maxDrawdown.toFixed(1) + "%" });
    if (volStats.sharpe != null && Number.isFinite(volStats.sharpe)) volFactors.push({ label: "Sharpe", value: volStats.sharpe.toFixed(2) });
  }
  const volMissing = "변동성·낙폭·Sharpe 통계가 아직 없어 추후 데이터 축적 후 제공합니다.";

  const parts: BasisPart[] = [
    buildPart("추세", "momentum", momentum, ranks.momentum, total, momFactors, readMomentum(momentum), momMissing),
    buildPart("거래활성도", "flow", flow, ranks.flow, total, flowFactors, readFlow(flow), flowMissing),
    buildPart("밸류", "value", value, ranks.value, total, valueFactors, readValue(value, per, pbr), valueMissing, valueExtra),
    buildPart("위험조정", "vol", vol, ranks.vol, total, volFactors, readVol(vol), volMissing),
  ];

  return {
    composite: Math.round(compositeOf({ momentum, flow, value, vol })),
    parts,
  };
}
