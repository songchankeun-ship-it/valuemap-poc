// 지표 점수 → 초보자용 한 줄 해석/주의 단일 소스.
// BeginnerReading.tsx와 종목 상세 지표 카드(MetricInsightCards.tsx)가 동일 문구를 쓰도록
// 순수 함수로 분리한다. ⚠️ 표시 문구만 정의 — 점수 계산식(score.ts/metrics.ts)은 건드리지 않는다.

export type ReadingTone = "good" | "watch" | "caution";

export interface Reading {
  label: string;
  score: number;
  emoji: string;
  meaning: string; // 점수의 의미 (한 줄)
  action: string; // 어떤 행동(확인)을 해야 하는지
  tone: ReadingTone;
}

export interface StockShape {
  momentum: number;
  flow: number;
  value: number;
  vol: number;
  per: number;
  pbr: number;
  roe: number;
}

export function readMomentum(score: number): Reading {
  const r: Reading = {
    label: "추세",
    score,
    emoji: "📈",
    meaning: "",
    action: "",
    tone: "watch",
  };
  if (score >= 80) {
    r.meaning = "최근 몇 달간 주가가 크게 오른 편이에요";
    r.action = "이미 많이 오른 구간 — 무엇 때문에 올랐는지(실적·뉴스·테마) 급등 이유부터 확인";
    r.tone = "caution";
  } else if (score >= 60) {
    r.meaning = "최근 주가 흐름이 꾸준히 좋은 편이에요";
    r.action = "상승세가 이어지는 중 — 무엇이 올렸는지와 계속될 근거가 있는지 확인";
    r.tone = "good";
  } else if (score >= 40) {
    r.meaning = "최근 주가 흐름은 특별한 방향 없이 밋밋해요";
    r.action = "뚜렷한 추세가 없음 — 다른 세 지표에서 볼 이유가 있는지 확인";
    r.tone = "watch";
  } else {
    r.meaning = "최근 주가 흐름이 힘을 잃고 약해진 상태예요";
    r.action = "하락 흐름일 수 있음 — 반등할 근거와 더 빠질 위험을 함께 확인";
    r.tone = "caution";
  }
  return r;
}

export function readFlow(score: number): Reading {
  const r: Reading = { label: "거래활성도", score, emoji: "💰", meaning: "", action: "", tone: "watch" };
  if (score >= 70) {
    r.meaning = "거래량이 평소보다 눈에 띄게 늘었어요";
    r.action = "거래와 관심이 몰린 상태 — 어떤 이슈인지 공시·뉴스·수급 변화 확인";
    r.tone = "good";
  } else if (score >= 40) {
    r.meaning = "거래량은 평소와 비슷한 보통 수준이에요";
    r.action = "특별히 몰리거나 빠지는 신호는 없음 — 다른 지표로 판단";
    r.tone = "watch";
  } else {
    r.meaning = "거래량이 평소보다 줄어든 상태예요";
    r.action = "시장 관심이 식은 편 — 거래량이 다시 살아나는 신호가 있는지 확인";
    r.tone = "caution";
  }
  return r;
}

export function readValue(score: number, per: number, pbr: number): Reading {
  const r: Reading = { label: "밸류", score, emoji: "🏷️", meaning: "", action: "", tone: "watch" };
  if (score >= 70) {
    r.meaning = `PER ${per.toFixed(1)} · PBR ${pbr.toFixed(2)} — 전체 종목 중에서는 싸 보이는 편이에요`;
    r.action = "싸 보이는 데는 이유가 있을 수 있음 — 실적 부진·산업 비선호·일시 악재인지 확인";
    r.tone = "good";
  } else if (score >= 40) {
    r.meaning = `PER ${per.toFixed(1)} · PBR ${pbr.toFixed(2)} — 전체 종목과 비슷한 보통 수준이에요`;
    r.action = "특별히 싸지도 비싸지도 않음 — 다른 지표로 판단";
    r.tone = "watch";
  } else {
    r.meaning = `PER ${per.toFixed(1)} · PBR ${pbr.toFixed(2)} — 전체 종목 중에서는 비싼 편이에요`;
    r.action = "성장 기대가 미리 반영된 가격일 수 있음 — 그만한 성장 근거가 있는지 확인";
    r.tone = "caution";
  }
  return r;
}

export function readVol(score: number): Reading {
  const r: Reading = { label: "위험조정", score, emoji: "⚖️", meaning: "", action: "", tone: "watch" };
  if (score >= 70) {
    r.meaning = "관측 기간엔 주가 출렁임 대비 수익 효율이 좋은 편이었어요";
    r.action = "안전 점수가 아님 · 출렁임이 작다는 뜻도 아님 — 실제 일간 변동·최대낙폭도 함께 확인";
    r.tone = "good";
  } else if (score >= 40) {
    r.meaning = "출렁임과 수익률이 무난하게 균형을 이룬 편이에요";
    r.action = "특별히 안정적이지도 위험하지도 않음 — 다른 지표로 판단";
    r.tone = "watch";
  } else {
    r.meaning = "주가 출렁임(변동성)이 큰 편이에요";
    r.action = "오르내림 폭이 큰 구간 — 실제 일간 변동·최대낙폭과 본인이 견딜 범위를 함께 확인";
    r.tone = "caution";
  }
  return r;
}

/** 종목 4지표 → 한 줄 해석 배열(추세·거래활성도·밸류·위험조정 순). */
export function readingsOf(s: StockShape): Reading[] {
  return [
    readMomentum(s.momentum),
    readFlow(s.flow),
    readValue(s.value, s.per, s.pbr),
    readVol(s.vol),
  ];
}

/** 종목의 점수 패턴에 따라 '이 종목 볼 때 먼저 확인할 3가지' 생성 */
export function getChecklistByPattern(s: StockShape): { headline: string; items: string[] } {
  const strong = [
    { k: "M", v: s.momentum, label: "추세" },
    { k: "F", v: s.flow, label: "거래활성도" },
    { k: "V", v: s.value, label: "밸류" },
    { k: "Vo", v: s.vol, label: "위험조정" },
  ].filter((x) => x.v >= 70);

  const weak = [
    { k: "M", v: s.momentum, label: "추세" },
    { k: "F", v: s.flow, label: "거래활성도" },
    { k: "V", v: s.value, label: "밸류" },
    { k: "Vo", v: s.vol, label: "위험조정" },
  ].filter((x) => x.v < 40);

  const hasMomentum = strong.find((x) => x.k === "M");
  const hasValue = strong.find((x) => x.k === "V");
  const hasFlow = strong.find((x) => x.k === "F");
  const weakValue = weak.find((x) => x.k === "V");

  // 패턴별 헤드라인 + 체크리스트
  if (hasMomentum && weakValue) {
    return {
      headline: "추세형 종목 — 최근 주가 흐름이 강해 눈에 띄었지만, 밸류(가격 부담) 지표는 약한 편이에요",
      items: [
        "최근 급등 이유 (실적 개선? 뉴스 모멘텀? 테마 부각?)",
        "PER · PBR이 풀 평균보다 높은 이유가 정당한지",
        "다음 실적 발표 일정과 시장 컨센서스",
      ],
    };
  }
  if (hasValue && hasMomentum) {
    return {
      headline: "균형형 종목 — 값이 싼 편(밸류)이면서 주가 흐름도 좋아 함께 눈에 띈 종목이에요",
      items: [
        "왜 시장이 이제서야 주목하는지 (재평가 이유)",
        "ROE가 안정적인지 (실적 받쳐주는지)",
        "비슷한 업종 PER · PBR과 비교했을 때 위치",
      ],
    };
  }
  if (hasValue) {
    return {
      headline: "저평가형 종목 — 값이 싼 편(밸류)이라 눈에 띄었지만, 주가 흐름은 아직 약한 편이에요",
      items: [
        "왜 싼지 (단기 악재? 산업 비선호? 구조적 부진?)",
        "실적이 개선 추세인지 (단순히 싸기만 한 게 아닌지)",
        "배당수익률이 받쳐주는지",
      ],
    };
  }
  if (hasFlow && hasMomentum) {
    return {
      headline: "관심 집중 종목 — 거래량과 주가가 함께 늘며 시장의 관심이 쏠려 눈에 띈 종목이에요",
      items: [
        "최근 공시/뉴스 (자기주식 취득? 임원·주요주주 보유 변동? 대형 계약?)",
        "거래 급증이 일시적인지 추세적인지",
        "상승이 이미 진행된 구간일 수 있어 원인·지속 가능성 확인 필요",
      ],
    };
  }
  if (strong.length === 0) {
    return {
      headline: "관망형 종목 — 네 지표 모두 중립이라, 지금은 뚜렷한 이유보다 지켜볼 단계에 가까워요",
      items: [
        "왜 이 종목을 보는지 본인 이유 정리",
        "촉매 (실적·공시·테마)가 있는지 점검",
        "지금 살펴볼 시점인지 다음 분기를 기다릴지",
      ],
    };
  }
  // 1개만 강한 경우
  return {
    headline: `${strong[0].label} 지표만 강세 — 다른 세 지표는 평이해서, 이 강점 하나로 눈에 띈 종목이에요`,
    items: [
      `${strong[0].label}만으로 매력적인지 본인 판단`,
      "약한 지표가 곧 따라올 가능성이 있는지",
      "이 종목보다 더 균형 잡힌 후보가 있는지 비교",
    ],
  };
}
