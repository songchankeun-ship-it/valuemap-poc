// 종목 지표 조합 → 비자문 '현재 결론' 분류. 설계서 §6.3 표 기반.
// 추천·미래가격 언어 금지 — '확인 후보'·'우선 확인'·'급등 사유 확인' 톤만 사용.

export interface ConclusionInput {
  momentum: number; // 추세
  flow: number;     // 거래활성도
  value: number;    // 밸류
  vol: number;      // 위험조정
  surge3m?: number | null; // 최근 3개월(약 63거래일) 등락률 %
}

export interface ConclusionResult {
  type: string;     // 종목 유형 문구
  summary: string;  // 한 줄 결론(강점·약점만, 방향 예측 금지)
  riskNote: string; // 주의점(확인 톤)
  nextHref: "#summary" | "#financials" | "#disclosures";
}

// 페이지의 강점(>=70)·주의(<50) 기준과 동일하게 맞춤.
const STRONG = 70;
const WEAK = 50;

const LABELS = { momentum: "추세", flow: "거래활성도", value: "밸류", vol: "위험조정" } as const;
type MetricKey = keyof typeof LABELS;

export function classifyConclusion({ momentum, flow, value, vol, surge3m }: ConclusionInput): ConclusionResult {
  const vals: Record<MetricKey, number> = { momentum, flow, value, vol };
  const mUp = momentum >= STRONG, fUp = flow >= STRONG, vUp = value >= STRONG, voUp = vol >= STRONG;
  const mUpNot = momentum < STRONG, voDown = vol < WEAK;
  const surgeBig = typeof surge3m === "number" && surge3m >= 80;
  const surgeWarm = typeof surge3m === "number" && surge3m >= 50;

  const keys = Object.keys(LABELS) as MetricKey[];
  const strong = keys.filter((k) => vals[k] >= STRONG).map((k) => LABELS[k]);
  const weak = keys.filter((k) => vals[k] < WEAK).map((k) => LABELS[k]);

  // 유형 결정 — 보수적 우선순위(설계서 §6.3)
  let type: string;
  if (mUp && fUp && vUp && voUp) type = "균형형 우선 확인 후보";
  else if (mUp && vUp) type = "저평가 + 추세 동시 진행 후보";
  else if (mUp && fUp) type = "시장 관심 급증 후보";
  else if (mUp && (surgeBig || voDown)) type = "과열 주의 후보";
  else if (vUp && mUpNot) type = "저평가 대기 후보";
  else if (fUp && mUpNot && !vUp) type = "단기 이슈 확인 후보";
  else if (voDown) type = "변동성 주의 후보";
  else type = "균형형 우선 확인 후보";

  // 한 줄 결론 — 강점/약점만 기술, 향후 가격 방향 예측 금지.
  // 초보자가 '왜 확인 후보로 떴는지'를 이해하도록 강점이 목록에 올린 이유임을 함께 설명한다.
  let summary: string;
  if (strong.length && weak.length) summary = `${strong.join("·")} 지표는 강하지만 ${weak.join("·")} 지표는 약한 편이에요. 강점이 이 종목을 후보로 올린 이유이고, 약한 지표는 발목을 잡을 요인이 없는지 함께 확인할 부분이에요.`;
  else if (strong.length) summary = `${strong.join("·")} 지표가 강하고 나머지는 중립권이에요. 이 강점이 종목이 눈에 띈 이유이니, 그 강점이 정당한지부터 확인해 보세요.`;
  else if (weak.length) summary = `두드러진 강점 지표 없이 ${weak.join("·")} 지표가 약한 상태예요. 지금은 확인할 근거보다 지켜볼 요인이 더 많은 편이에요.`;
  else summary = "네 지표 모두 중간대라 두드러진 신호가 적어요. 특정 강점보다는 공시·실적 같은 촉매가 생기는지 지켜볼 단계예요.";

  // 주의점 — '확인' 톤만(공포·매도 언어 금지). 무엇을 먼저 확인할지까지 안내한다.
  let riskNote: string;
  let nextHref: ConclusionResult["nextHref"];
  if (surgeBig) {
    riskNote = "최근 3개월 상승폭이 커요. 실적·뉴스·테마 중 무엇이 움직임을 만들었는지 차트에서 급등 구간부터 확인하세요.";
    nextHref = "#summary";
  } else if (surgeWarm) {
    riskNote = "최근 상승폭이 다소 커요. 차트에서 상승 구간과 거래량이 함께 이어졌는지 먼저 보세요.";
    nextHref = "#summary";
  } else if (voDown) {
    riskNote = "위험조정 지표가 약해요. 실제 주가 출렁임과 최대낙폭이 감당 가능한 범위인지 먼저 보세요.";
    nextHref = "#summary";
  } else if (flow < WEAK) {
    riskNote = "거래활성도가 약해요. 최근 5일 평균 거래량이 20일 평균보다 다시 강해지는지 먼저 보세요.";
    nextHref = "#summary";
  } else if (value < WEAK) {
    riskNote = "밸류 지표가 약해요. 현재 PER·PBR 부담이 최근 실적으로 설명되는지 먼저 보세요.";
    nextHref = "#financials";
  } else if (momentum < WEAK) {
    riskNote = "추세 지표가 약해요. 최근 1개월·3개월 흐름이 멈추거나 돌아서는지 먼저 보세요.";
    nextHref = "#summary";
  } else {
    riskNote = "점수만으로 판단하지 말고, 최근 공시에 새 실적·계약·자금조달 변화가 있는지 먼저 보세요.";
    nextHref = "#disclosures";
  }

  return { type, summary, riskNote, nextHref };
}
