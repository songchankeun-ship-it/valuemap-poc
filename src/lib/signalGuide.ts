// DART 5종 공시 신호 해석 가이드
// 핵심 원칙: '호재/악재' 단정하지 않음. 'X 신호 — 무엇을 확인해야 하는지' 만 제시.

export type SignalType =
  | "treasury_buy"
  | "insider_buy"
  | "correction"
  | "single_contract"
  | "capital_raise";

export interface SignalGuide {
  type: SignalType;
  korean: string;
  category: "주주환원" | "내부자 행동" | "정보 변경" | "사업 진행" | "자금 조달";
  oneLine: string;          // 한 줄 정의
  whyMatters: string;       // 왜 주목할 가치가 있는지
  checkPoints: string[];    // 무엇을 확인해야 하는지 (3개)
  pastPattern: string;      // 과거 일반적 패턴 (단정 X)
  cautionNote: string;      // 주의할 점
  emoji: string;
  tone: "neutral" | "watch" | "info";
}

export const SIGNAL_GUIDES: Record<SignalType, SignalGuide> = {
  treasury_buy: {
    type: "treasury_buy",
    korean: "자기주식 취득",
    category: "주주환원",
    oneLine: "회사가 자사 주식을 시장에서 매입한다는 공시입니다.",
    whyMatters: "회사가 현금을 들여 자사주를 산다는 건 (1) 주주환원 의지 표시, (2) 경영진이 현재 주가를 저평가로 본다는 신호일 수 있습니다. 매입 후 소각하면 유통주식 수가 줄어 EPS가 자동 개선됩니다.",
    checkPoints: [
      "취득 규모가 시가총액 대비 얼마나 큰지 (1% 이상이면 의미 있음)",
      "소각 계획이 있는지 (소각해야 진짜 주주환원)",
      "과거 자사주 매입 이력과 그때 주가 흐름",
    ],
    pastPattern: "발표 직후 단기 +2~5% 반응이 자주 있지만, 그 이상 상승은 회사 펀더멘털에 달려 있습니다. 자사주 매입만 보고 매수하는 건 위험.",
    cautionNote: "취득 결의일 뿐 실제 매입은 천천히 진행되며, 소각 약속이 있는지 확인해야 합니다. 매입한 자사주를 향후 임직원 보상으로 다시 푸는 경우도 있습니다.",
    emoji: "🏦",
    tone: "info",
  },

  insider_buy: {
    type: "insider_buy",
    korean: "임원·주요주주 보유 변동",
    category: "내부자 행동",
    oneLine: "임원이나 5% 이상 주주의 보유 주식 수가 바뀌어 제출된 '소유상황보고서'입니다. (제목만으로는 매수/매도를 알 수 없음)",
    whyMatters: "내부자는 외부보다 회사 사정을 잘 압니다. 다만 이 보고서는 매수뿐 아니라 매도·스톡옵션 행사·증여·직위 변경 등 다양한 사유로 제출됩니다. 따라서 '내부자 매수'로 단정하지 말고 먼저 방향(매수/매도)부터 확인해야 합니다.",
    checkPoints: [
      "보고 사유 — 장내매수인지 장내매도인지, 스톡옵션·증여인지 (가장 중요)",
      "누가 거래했는지 (CEO·이사회 의장이면 신뢰도 ↑, 사외이사·친인척은 ↓)",
      "변동 규모가 본인 보유분·발행주식 대비 의미 있는 비율인지",
    ],
    pastPattern: "CEO의 장내'매수'는 장기 보유 의지 사례가 많지만, 같은 양식으로 제출되는 '매도'·증여도 흔합니다. 방향을 확인하기 전엔 호재로 읽으면 안 됩니다.",
    cautionNote: "표시된 '분류 신뢰도(자동분류 확신도)'는 매수 신호가 아니라 보고서를 맞게 분류했다는 확신 정도이므로, 매수·매도 방향은 DART 원문의 '취득·처분 방법'에서 확인해야 합니다. 방향이 불명확한 경우에는 확신도를 낮춰 표시합니다.",
    emoji: "👤",
    tone: "watch",
  },

  correction: {
    type: "correction",
    korean: "정정공시",
    category: "정보 변경",
    oneLine: "이미 제출한 공시 내용을 수정한다는 공시입니다.",
    whyMatters: "정정 자체는 중립이지만, **무엇이 바뀌었는지**가 중요합니다. 실적·계약·자금 조달 같은 핵심 숫자의 정정이면 큰 의미가 있을 수 있고, 단순 오타 정정이면 무시해도 됩니다.",
    checkPoints: [
      "원문 vs 정정본 차이 (DART에서 두 공시 비교)",
      "정정 사유 — 단순 오기인지 실제 숫자 변경인지",
      "정정 발표 시점 — 분기 마감 직후 정정은 실적 관련 가능성 ↑",
    ],
    pastPattern: "실적 정정은 보통 시장 반응이 크고, 단순 표기 정정은 거의 무반응. 정정 후 주가가 크게 움직였다면 중요한 정정이었다는 사후 신호.",
    cautionNote: "정정이 잦은 회사는 공시 신뢰도가 떨어질 수 있으므로, 종목 자체의 신뢰도를 함께 점검해야 합니다.",
    emoji: "📝",
    tone: "watch",
  },

  single_contract: {
    type: "single_contract",
    korean: "단일판매·공급 계약",
    category: "사업 진행",
    oneLine: "단일 계약 규모가 직전 매출의 5% 이상이라 의무 공시된 큰 계약입니다.",
    whyMatters: "단일 계약이 매출의 5%를 넘는다는 건 향후 분기 실적이 가시화된다는 뜻. 특히 신규 거래처·신규 사업 영역이면 성장 단서가 될 수 있습니다.",
    checkPoints: [
      "계약 규모가 직전 연 매출의 몇 %인지 (10% 이상이면 의미 큼)",
      "계약 기간 — 일시 계약인지 장기 공급인지",
      "거래처 신용도와 마진율 추정 (저마진 양산 계약은 매출 ↑ ≠ 이익 ↑)",
    ],
    pastPattern: "발표일 +5~15% 반응이 흔하지만, 마진 정보가 부족하면 며칠 후 반락하는 경우도 잦음. 분기 실적 발표 전까지는 추가 확인이 필요.",
    cautionNote: "'계약 금액 = 이익'으로 단순 환산하지 마세요. 마진·거래처 정보가 빠질 수 있습니다.",
    emoji: "🤝",
    tone: "info",
  },

  capital_raise: {
    type: "capital_raise",
    korean: "유상증자·CB 발행",
    category: "자금 조달",
    oneLine: "회사가 새 주식 또는 전환사채를 발행해 자금을 조달한다는 공시입니다.",
    whyMatters: "신주 발행 = 기존 주주의 지분이 희석됩니다 (주가 하락 요인). 하지만 자금 용도가 명확하고 좋으면 (시설 투자·신사업) 중장기 호재일 수 있어 **자금 용도가 핵심**.",
    checkPoints: [
      "발행 규모 (시총 대비 % — 30% 이상이면 큰 희석)",
      "자금 용도 — 시설/R&D면 성장, 운영자금이면 자금난, 차입금 상환이면 위험 회피",
      "발행 가격 vs 현재가 (할인율이 크면 단기 매도 압박)",
    ],
    pastPattern: "발표 직후 -5~15% 하락이 흔하고, 락업 해제 시점에 추가 매물 출회. 단, 자금 용도가 명확한 성장 투자면 6개월~1년 후 반등하는 사례 다수.",
    cautionNote: "CB(전환사채)는 행사 가격에 도달하면 주식으로 전환될 수 있어 사실상 잠재 매물입니다. 발행 직후 주가가 하락하지 않았더라도 이후 전환 물량이 나올 수 있습니다.",
    emoji: "💸",
    tone: "watch",
  },
};

/** 신호 라벨로 가이드 조회 (한국어 라벨 → SignalGuide) */
export function findGuideByLabel(label: string): SignalGuide | null {
  for (const g of Object.values(SIGNAL_GUIDES)) {
    if (g.korean === label) return g;
  }
  // 부분 매칭 시도
  for (const g of Object.values(SIGNAL_GUIDES)) {
    if (label.includes(g.korean) || g.korean.includes(label)) return g;
  }
  return null;
}

/** 신호 타입으로 가이드 조회 */
export function findGuideByType(type: string): SignalGuide | null {
  return (SIGNAL_GUIDES as Record<string, SignalGuide>)[type] ?? null;
}
