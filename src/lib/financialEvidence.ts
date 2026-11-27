export type ValuationBasis = "measured" | "three-factors" | "unavailable";

export function valuationBasisOf({ per, pbr, valueNA }: {
  per?: number | null;
  pbr?: number | null;
  valueNA?: boolean;
}): ValuationBasis {
  if (valueNA) return "three-factors";
  return typeof per === "number" && Number.isFinite(per) && per > 0 &&
    typeof pbr === "number" && Number.isFinite(pbr) && pbr > 0 ? "measured" : "unavailable";
}

export const financialEvidenceCopy = {
  ko: {
    noValue: "계산 불가",
    noValueDetail: "유효한 PER·PBR이 없어 밸류를 계산할 수 없어요.",
    threeFactors: "밸류 제외 · 3개 지표 기준",
    threeFactorDetail: "밸류를 제외하고 추세·거래활성도·위험조정의 평균으로 표시합니다.",
    financialPeriod: "재무 기준 기간 미확인",
    financialSources: "수집 경로: PER·PBR·ROE 네이버 금융 · 배당수익률 yfinance",
    priceBasis: "가격·점수 스냅샷",
    priceSource: "가격 수집: 네이버 금융 전달 · FinanceDataReader",
    unverifiedCloseDate: "종가 기준일 미확인",
  },
  en: {
    noValue: "Not calculated",
    noValueDetail: "Valuation needs valid P/E and P/B inputs.",
    threeFactors: "3 factors · valuation excluded",
    threeFactorDetail: "The composite reflects the average of trend, trading activity and risk-adjusted performance.",
    financialPeriod: "Financial reporting period unverified",
    financialSources: "Collection sources: P/E, P/B and ROE from Naver Finance; dividend yield via yfinance",
    priceBasis: "Price and score snapshot",
    priceSource: "Prices: Naver Finance via FinanceDataReader",
    unverifiedCloseDate: "Close date unverified",
  },
} as const;
