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

  // 한 줄 결론 — 강점/약점만 기술, 향후 가격 방향 예측 금지
  let summary: string;
  if (strong.length && weak.length) summary = `${strong.join("·")} 지표는 강하지만, ${weak.join("·")} 지표는 상대적으로 약한 상태입니다.`;
  else if (strong.length) summary = `${strong.join("·")} 지표가 강하고 나머지는 중립권입니다.`;
  else if (weak.length) summary = `두드러진 강점 지표 없이 ${weak.join("·")} 지표가 약한 상태입니다.`;
  else summary = "네 지표 모두 중간대로, 두드러진 신호가 적은 상태입니다.";

  // 주의점 — '확인' 톤만(공포·매도 언어 금지)
  let riskNote: string;
  if (surgeBig) riskNote = "최근 3개월 상승폭이 커서 급등 사유 확인이 먼저 필요합니다.";
  else if (surgeWarm) riskNote = "최근 상승폭이 다소 커서 급등 사유 확인이 필요합니다.";
  else if (voDown) riskNote = "위험조정 지표가 약해 변동성 확인이 필요합니다.";
  else if (weak.includes("거래활성도")) riskNote = "거래활성도가 약해 시장 관심 지속 여부 확인이 필요합니다.";
  else riskNote = "점수는 탐색 우선순위이므로 공시·실적을 함께 확인하세요.";

  return { type, summary, riskNote };
}
