import { Lightbulb, AlertTriangle, CheckCircle2 } from "lucide-react";

/**
 * 점수를 초보자가 이해할 수 있는 한 줄 행동 가이드로 번역.
 * - "이 종목은 좋아? 나빠?" 가 아니라 "뭘 더 확인해야 해?" 에 답한다.
 */

interface StockShape {
  momentum: number;
  flow: number;
  value: number;
  vol: number;
  per: number;
  pbr: number;
  roe: number;
}

interface Reading {
  label: string;
  score: number;
  emoji: string;
  meaning: string;        // 점수의 의미 (한 줄)
  action: string;         // 어떤 행동을 해야 하는지
  tone: "good" | "watch" | "caution";
}

function readMomentum(score: number): Reading {
  const r: Reading = {
    label: "추세",
    score,
    emoji: "📈",
    meaning: "",
    action: "",
    tone: "watch",
  };
  if (score >= 80) {
    r.meaning = "최근 많이 올랐습니다";
    r.action = "따라 사기 전, 급등 이유 (실적·뉴스·테마) 확인이 우선";
    r.tone = "caution";
  } else if (score >= 60) {
    r.meaning = "최근 흐름이 양호합니다";
    r.action = "추세는 살아 있지만 너무 늦지 않게 확인";
    r.tone = "good";
  } else if (score >= 40) {
    r.meaning = "최근 흐름은 평이합니다";
    r.action = "뚜렷한 추세가 없음 — 다른 지표에서 단서 찾기";
    r.tone = "watch";
  } else {
    r.meaning = "최근 흐름이 약합니다";
    r.action = "하락 추세일 수 있음 — 저가 매수일지 추가 하락일지 판단 필요";
    r.tone = "caution";
  }
  return r;
}

function readFlow(score: number): Reading {
  const r: Reading = { label: "거래활성도", score, emoji: "💰", meaning: "", action: "", tone: "watch" };
  if (score >= 70) {
    r.meaning = "거래량이 평소보다 늘었습니다";
    r.action = "시장의 관심이 모이는 중 — 어떤 이슈인지 공시·뉴스 확인";
    r.tone = "good";
  } else if (score >= 40) {
    r.meaning = "거래량은 평범한 편입니다";
    r.action = "특별한 자금 유입·이탈 신호는 없음";
    r.tone = "watch";
  } else {
    r.meaning = "거래량이 줄어들고 있습니다";
    r.action = "시장이 관심을 덜 갖는 중 — 회복 신호 기다리기";
    r.tone = "caution";
  }
  return r;
}

function readValue(score: number, per: number, pbr: number): Reading {
  const r: Reading = { label: "밸류", score, emoji: "🏷️", meaning: "", action: "", tone: "watch" };
  if (score >= 70) {
    r.meaning = `PER ${per.toFixed(1)} · PBR ${pbr.toFixed(2)} — 풀 내에서 싸 보입니다`;
    r.action = "왜 싼지 확인 (실적 부진? 산업 비선호? 일시 악재?)";
    r.tone = "good";
  } else if (score >= 40) {
    r.meaning = `PER ${per.toFixed(1)} · PBR ${pbr.toFixed(2)} — 보통 수준입니다`;
    r.action = "특별히 싸지도 비싸지도 않음";
    r.tone = "watch";
  } else {
    r.meaning = `PER ${per.toFixed(1)} · PBR ${pbr.toFixed(2)} — 풀 내에서 비싼 편입니다`;
    r.action = "성장 기대치가 반영된 가격일 수 있음 — 성장 근거 확인";
    r.tone = "caution";
  }
  return r;
}

function readVol(score: number): Reading {
  const r: Reading = { label: "위험조정", score, emoji: "⚖️", meaning: "", action: "", tone: "watch" };
  if (score >= 70) {
    r.meaning = "관측 기간엔 변동성 대비 수익률이 높았습니다";
    r.action = "절대 변동성이 낮다는 뜻은 아님 — 실제 일간 변동·최대낙폭도 함께 확인";
    r.tone = "good";
  } else if (score >= 40) {
    r.meaning = "변동성과 수익률이 평이한 균형입니다";
    r.action = "특별히 안정적이지도 위험하지도 않음";
    r.tone = "watch";
  } else {
    r.meaning = "변동성이 큰 편입니다";
    r.action = "출렁임 감내 가능한 비중으로 접근 권장";
    r.tone = "caution";
  }
  return r;
}

/** 종목의 점수 패턴에 따라 '이 종목 볼 때 먼저 확인할 3가지' 생성 */
function getChecklistByPattern(s: StockShape): { headline: string; items: string[] } {
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
      headline: "추세형 종목 — 가격 부담은 있는 편",
      items: [
        "최근 급등 이유 (실적 개선? 뉴스 모멘텀? 테마 부각?)",
        "PER · PBR이 풀 평균보다 높은 이유가 정당한지",
        "다음 실적 발표 일정과 시장 컨센서스",
      ],
    };
  }
  if (hasValue && hasMomentum) {
    return {
      headline: "균형형 종목 — 저평가 + 추세 동시 진행",
      items: [
        "왜 시장이 이제서야 주목하는지 (재평가 이유)",
        "ROE가 안정적인지 (실적 받쳐주는지)",
        "비슷한 업종 PER · PBR과 비교했을 때 위치",
      ],
    };
  }
  if (hasValue) {
    return {
      headline: "저평가형 종목 — 추세는 아직 약함",
      items: [
        "왜 싼지 (단기 악재? 산업 비선호? 구조적 부진?)",
        "실적이 개선 추세인지 (단순히 싸기만 한 게 아닌지)",
        "배당수익률이 받쳐주는지",
      ],
    };
  }
  if (hasFlow && hasMomentum) {
    return {
      headline: "관심 집중 종목 — 거래량 + 가격 동반",
      items: [
        "최근 공시/뉴스 (자기주식 취득? 임원·주요주주 보유 변동? 대형 계약?)",
        "거래 급증이 일시적인지 추세적인지",
        "고점 추격 위험 — 어디까지 사도 괜찮을지 본인 기준",
      ],
    };
  }
  if (strong.length === 0) {
    return {
      headline: "관망형 종목 — 네 지표 모두 중립",
      items: [
        "왜 이 종목을 보는지 본인 이유 정리",
        "촉매 (실적·공시·테마)가 있는지 점검",
        "지금이 진입 시점인지 다음 분기 기다릴지",
      ],
    };
  }
  // 1개만 강한 경우
  return {
    headline: `${strong[0].label} 단독 강세 — 다른 지표는 평이`,
    items: [
      `${strong[0].label}만으로 매력적인지 본인 판단`,
      "약한 지표가 곧 따라올 가능성이 있는지",
      "이 종목보다 더 균형 잡힌 후보가 있는지 비교",
    ],
  };
}

export function BeginnerReading({ s }: { s: StockShape }) {
  const readings: Reading[] = [
    readMomentum(s.momentum),
    readFlow(s.flow),
    readValue(s.value, s.per, s.pbr),
    readVol(s.vol),
  ];
  const checklist = getChecklistByPattern(s);

  const toneStyles: Record<Reading["tone"], string> = {
    good: "border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20",
    watch: "border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40",
    caution: "border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20",
  };

  const toneIcon: Record<Reading["tone"], React.ReactNode> = {
    good: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
    watch: <Lightbulb className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />,
    caution: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
  };

  return (
    <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex items-center justify-center">
          <Lightbulb className="w-4 h-4" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-sm md:text-base font-semibold text-zinc-900 dark:text-zinc-100">초보자 해석</h2>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">점수의 의미와 다음 행동을 한국어로 정리했어요</p>
        </div>
      </div>

      {/* 헤드라인 */}
      <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-md p-3 mb-3">
        <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1.5 uppercase tracking-wider">현재 이 종목은</div>
        <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug mb-2">{checklist.headline}</div>
        <div className="text-xs text-zinc-700 dark:text-zinc-300 mb-1.5">
          초보자는 이걸 먼저 확인하세요:
        </div>
        <div className="space-y-1">
          {checklist.items.map((item, i) => (
            <div key={i} className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed flex gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold shrink-0">{i + 1}.</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-zinc-200 dark:border-zinc-800">
          <a href="#disclosures" className="text-[11px] px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-blue-400 hover:text-blue-700 dark:hover:text-blue-400 transition">📋 관련 공시 확인</a>
          <a href="#financials" className="text-[11px] px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-blue-400 hover:text-blue-700 dark:hover:text-blue-400 transition">💰 재무 보기</a>
          <a href="#basis" className="text-[11px] px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-blue-400 hover:text-blue-700 dark:hover:text-blue-400 transition">📊 점수 근거</a>
        </div>
      </div>

      {/* 지표별 한 줄 해석 — 기본 접힘 */}
      <details className="mt-1">
        <summary className="text-xs text-blue-700 dark:text-blue-400 cursor-pointer select-none">지표별 상세 해석 펼치기 ▾</summary>
        <div className="space-y-1.5 mt-2">
        {readings.map((r) => (
          <div
            key={r.label}
            className={"border rounded-md p-2.5 " + toneStyles[r.tone]}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{r.emoji}</span>
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-10