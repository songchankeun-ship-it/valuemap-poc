/**
 * 다국어 v2 — /today (오늘 탐색 대시보드) 화면의 "크롬"(UI 라벨/버튼/안내) 문구.
 * ko = 현재 한국어 그대로(동작 불변), en = 보수적·비자문(non-advisory) 번역.
 * 종목명/티커/업종/테마/출처(KRX·Naver·DART)/날짜/숫자 등 데이터값은 절대 번역하지 않는다(소스 그대로).
 *
 * 금융 카피는 양 언어 모두 보수적·비자문 톤을 유지한다(매수/매도/추천/수익보장 금지).
 */
import type { Locale } from "@/lib/i18n";

// 4지표 라벨 — note/reason 문구 안에서 쓰는 지표명.
// 주의: StockCandidateCard(타 화면 소유)의 4지표 막대 라벨은 한국어 그대로이므로,
// 시각 일관성을 위해 note 문구에서도 동일한 한국어 라벨을 유지한다.
const METRIC = {
  ko: { momentum: "추세", flow: "거래활성도", value: "밸류", vol: "위험조정" },
  en: { momentum: "추세", flow: "거래활성도", value: "밸류", vol: "위험조정" },
} as const;

export const todayCopy = {
  ko: {
    // ── 페이지 헤더 ──
    eyebrow: "오늘",
    headerDesc: "오늘 먼저 살펴볼 종목과 신호를 점수로 정리한 탐색 대시보드입니다. 매수·매도 추천이 아니라 확인할 순서를 제안합니다.",
    closedNoticePrefix: "오늘은 휴장일입니다 — 가장 최근 거래일 ",
    closedNoticeSuffix: " 장마감 데이터를 보여드립니다.",
    stalePrefix: "자동 갱신이 지연되어 ",
    staleBold: "마지막 정상 데이터",
    staleSuffix: "를 보여드립니다 — 최신이 아닐 수 있어요.",

    // ── 오늘 한 줄 요약(변화 중심 · 첫 문장) ──
    // 변화 데이터가 있으면 변화를, 없으면 현재 강점 기준임을 솔직히 밝힌다(가짜 변화 금지).
    // basis = 실제 비교 기준 라벨(전 거래일 / N거래일 전 / 최근 저장 데이터). "전일"이라 단정하지 않는다.
    summaryWithDeltas: (basis: string) => `${basis} 달라진 후보와 공시 신호를 정리했습니다. 변화가 큰 종목부터 확인하세요.`,
    summaryNoDeltas: "아직 비교할 최근 변화 데이터가 없어, 오늘은 현재 강점이 큰 후보를 기준으로 정리했습니다.",
    // 변화 데이터가 없을 때 후보 목록이 '변화'가 아니라 '현재 강점'임을 명시.
    strengthFallbackNote: "최근 변화 데이터가 없어 아래 후보는 현재 강점(점수·지표) 기준입니다 — 변화가 아닙니다.",
    noChangeNote: (basis: string) => `${basis} 뚜렷한 변화가 없어 아래 후보는 현재 강점(점수·지표) 기준입니다.`,
    signalsStrengthNote: "아래 목록은 최근 변화가 아니라 현재 강점(점수·지표) 기준입니다.",
    disclosureHeading: "확인할 공시 신호",

    // ── 오늘 확인 순서(재방문 스캔 순서 안내) ──
    routine: {
      title: "오늘 확인 순서",
      items: [
        { label: "내 종목·관심 변화", href: "/watchlist" },
        { label: "오늘의 Top3·신호", href: "#today-top3" },
        { label: "공시 확인", href: "/disclosures" },
      ],
      note: "매수·매도 추천이 아니라 오늘 살펴볼 순서예요.",
    },

    // ── 신호별 종목 섹션 ──
    signalsHeading: "신호별 종목",
    exploreAll: "전체 탐색 →",

    sections: {
      composite: {
        title: "종합 점수 상위",
        caption: "여러 지표에서 강점이 확인된 후보 (Top 3 다음 순위)",
        footnote: "점수는 같은 분석 풀 안의 상대 위치이며 미래 수익률을 의미하지 않습니다.",
      },
      volume: {
        title: "거래활성도 급증",
        caption: "평소보다 거래량·관심이 늘어난 종목 (파생 추정 · 가격 방향/매매 주체 아님)",
        footnote: "거래 관심 증가는 단기 테마성일 수 있어 지속성은 원문·차트로 확인하세요.",
      },
      value: {
        title: "밸류 매력",
        caption: "같은 풀에서 PER·PBR이 낮은 편 — 이유 있는 저평가일 수 있음",
        footnote: "싸 보이는 데는 이유가 있을 수 있으니 실적·재무를 함께 확인하세요.",
      },
      momentum: {
        title: "추세 강함",
        caption: "최근 1·3·6개월 가격 흐름이 상대적으로 강한 종목",
        footnote: "단기 급등 후 변동성이 커질 수 있어 상승 원인·지속 가능성을 함께 확인하세요.",
      },
      overheated: {
        title: "과열 주의",
        caption: "최근 단기 상승폭이 큰 종목 — 급등 사유 확인 필요",
        footnote: "상승폭이 크다고 매수 신호가 아니며, 급등 사유와 차익실현 위험을 살펴보세요.",
      },
      disclosure: {
        title: "최근 공시 있음",
        caption: "최근 DART 공시 신호가 분류된 분석 대상 종목",
        footnote: "공시 분류는 호재/악재 판단이 아니라 확인할 신호이며, 실제 영향은 원문에서 확인하세요.",
      },
    },

    // ── Top 3 ──
    top3Title: "오늘의 Top 3",
    top3Caption: "종합점수 상위 · 탐색 우선순위",
    top3Desc:
      "여러 지표에서 상대적으로 강점이 확인된 오늘의 탐색 우선 후보입니다. 매수 추천이 아니라 먼저 살펴볼 순서를 제안합니다.",
    top3Empty: "표시할 후보 데이터를 준비 중입니다. 잠시 후 다시 확인해 주세요.",

    // ── SignalSection 빈 상태 ──
    sectionEmpty: "아직 해당하는 종목이 없습니다. 데이터가 갱신되면 다시 채워집니다.",

    // ── 오늘의 브리핑 ──
    briefingTitle: "오늘의 브리핑",
    briefingAsOfSuffix: " 기준",
    briefingMoveLabel: (n: number) => `최근 거래일 등락 (${n}종목)`,
    briefingUp: (n: number) => `상승 ${n}`,
    briefingDownFlat: (down: number, flat: number) => `/ 하락 ${down} / 보합 ${flat}`,
    briefingStrongLabel: "종합 80+ 종목",
    briefingCountSuffix: "개",
    briefingFlowLabel: "거래활성도 급증",
    briefingSignalLabel: "공시 신호",
    briefingSignalCountSuffix: "건",
    aiThemeSummary: "AI 테마 요약",
    notAdvice: "투자 추천 아님",
    breadthLine: (pct: number) => `최근 거래일 상승 비율 ${pct}% · 영업일 장마감 후 갱신.`,

    // ── 최근 장마감 변화 ── (캡션은 실제 비교 기준을 컴포넌트에서 basis 라벨로 렌더)
    changeTitle: "최근 장마감 변화",
    newEntrants: "🆕 오늘 종합 80+ 신규 편입",
    dropouts: "↘ 오늘 종합 80+ 이탈",
    rankRisers: (basis: string) => `↑ ${basis} 순위 상승 (5단계+)`,
    bigMovers: "📊 점수 급변 종목",
    rankStepSuffix: "단계",
    watchHint: "관심 종목으로 등록하면 이런 변화를 알림으로 받을 수 있어요 (현재는 이메일 발송, 카카오톡 알림 준비 중 · 설정 > 알림).",

    // ── 체크리스트 ──
    checklistTitle: "후보를 볼 때 체크리스트",
    checklistDesc: "아래 후보는 매수 추천이 아니라 직접 확인할 우선순위입니다. 종목을 열기 전에 스스로 점검해 보세요.",
    checklist: [
      { before: "종목 상세와 ", strong: "DART 원문 공시", after: "를 직접 확인했나요?" },
      { before: "최근 단기 급등 여부와 ", strong: "상승 원인·지속 가능성", after: "을 살펴봤나요?" },
      { before: "저평가(저PER·저PBR)라면 ", strong: "그럴 만한 이유", after: "가 있는지 점검했나요?" },
      { before: "종합 점수는 등급이 아니라 ", strong: "탐색 우선순위", after: "일 뿐임을 기억했나요?" },
      { before: "분산과 비중은 ", strong: "스스로", after: " 결정했나요?" },
    ],
    checklistNote: "이 체크리스트는 학습용 안내이며 특정 종목의 매수·매도를 권하지 않습니다.",

    // ── 푸터 출처 ──
    sourceNote:
      "본 페이지는 KRX 일별 종가(FinanceDataReader), Naver Finance 재무 지표, DART 공시 실데이터를 기반으로 자동 생성됩니다. 영업일 마감 후 자동 갱신. 본 도구는 투자 추천이 아니라 탐색 우선순위를 제시하는 분석 도구입니다.",

    // ── 동적 신호 문구(reason/note) ──
    reason: {
      compositeDouble: (a: string, av: number, b: string, bv: number) => `${a} ${av} + ${b} ${bv} 강세`,
      compositeSingle: (a: string, av: number) => `${a} ${av} 단독 강세`,
      compositeNeutral: (top: string, tv: number) => `${top} ${tv} (네 지표 모두 중립권)`,
      valueDefault: (per: string, pbr: string) => `PER ${per} · PBR ${pbr}`,
      valueLowPer: "저PER",
      valueLowPbr: "저PBR",
      valueRoe: (roe: string) => `ROE ${roe}%`,
      momAllUp: (r6: string) => `1·3·6개월 모두 상승 (6M ${r6})`,
      momRebound: (r1: string) => `최근 1개월 급반등 (${r1})`,
      mom6m: (r6: string) => `6개월 ${r6} 흐름`,
      momFallback: "최근 가격 흐름 강함",
      volumeNote: (flow: number) => `거래활성도 ${flow} · 거래 관심 증가`,
      overheatedNote: (r3m: number) => `최근 3개월 +${r3m}% · 단기 과열 여부 확인 필요`,
      disclosureNote: (label: string) => `${label} · 공시 원문 확인 권장`,
      riskHigh150: "최근 상승폭이 매우 커서 급등 사유와 과열 여부 함께 확인 필요",
      riskHigh120: "단기 상승폭이 큰 편이라 급등 사유와 변동성 확인 필요",
      riskHighVol: "상승폭이 커진 데다 변동성도 높아 사유·시점 함께 검토 필요",
      riskHigh: "최근 상승폭이 커서 급등 사유 확인 필요",
      riskVol: "변동성이 큰 편이라 비중·시점 분할 검토 필요",
      riskValue: "밸류 지표가 낮아 고평가 여부 원문 재무 확인 필요",
      riskDefault: "점수 근거가 된 지표와 원문 공시·재무를 함께 확인 필요",
    },
    metric: METRIC.ko,
  },

  en: {
    // ── Page header ──
    eyebrow: "Today",
    headerDesc: "A research dashboard that organizes today's stocks and signals to review first, by score. Not buy or sell advice — just a suggested order to check.",
    closedNoticePrefix: "The market is closed today — showing market-close data from the most recent trading day ",
    closedNoticeSuffix: ".",
    stalePrefix: "Automatic update is delayed, so we are showing the ",
    staleBold: "last good data",
    staleSuffix: " — it may not be the latest.",

    // ── One-line daily summary (change-first · first sentence) ──
    // When change data exists, describe the change against its actual basis; otherwise say plainly
    // that the list is by current strength (never fabricate a previous-day delta).
    // basis = the actual comparison label (previous trading day / N trading days ago / recent stored data).
    summaryWithDeltas: (basis: string) => `We've gathered the candidates and disclosure signals that changed ${basis}. Start with the biggest movers.`,
    summaryNoDeltas: "There's no recent change data to compare yet, so today's list is ordered by current strength, not by change.",
    strengthFallbackNote: "No recent change data, so the candidates below reflect current strength (score/metrics) — not change.",
    noChangeNote: (basis: string) => `No notable change ${basis}, so the candidates below reflect current strength (score/metrics).`,
    signalsStrengthNote: "The lists below reflect current strength (score/metrics), not recent change.",
    disclosureHeading: "Disclosure signals to check",

    // ── Today's check order (returning-user scan order) ──
    routine: {
      title: "Today's check order",
      items: [
        { label: "Your stocks & watchlist changes", href: "/watchlist" },
        { label: "Today's Top 3 & signals", href: "#today-top3" },
        { label: "Check disclosures", href: "/disclosures" },
      ],
      note: "Not buy or sell advice — just an order to look through today.",
    },

    // ── Signal sections ──
    signalsHeading: "Stocks by signal",
    exploreAll: "Explore all →",

    sections: {
      composite: {
        title: "Top composite score",
        caption: "Candidates with strengths across several metrics (ranked after the Top 3)",
        footnote: "Scores are a relative position within the same analysis pool and do not imply future returns.",
      },
      volume: {
        title: "Trading activity surge",
        caption: "Stocks with higher-than-usual trading volume and interest (derived estimate; not price direction or buyer identity)",
        footnote: "Rising trading interest can be short-lived and theme-driven; check the source and chart for durability.",
      },
      value: {
        title: "Valuation appeal",
        caption: "Lower PER/PBR within the same pool — may be undervalued for a reason",
        footnote: "Looking cheap can have a reason; review earnings and financials together.",
      },
      momentum: {
        title: "Strong trend",
        caption: "Stocks with relatively strong 1/3/6-month price action",
        footnote: "Volatility can rise after a short-term run-up; check the cause and durability of the move.",
      },
      overheated: {
        title: "Overheating caution",
        caption: "Stocks with large recent short-term gains — check the reason for the surge",
        footnote: "A large gain is not a buy signal; review the reason for the surge and profit-taking risk.",
      },
      disclosure: {
        title: "Recent disclosures",
        caption: "Analyzed stocks with recently classified DART disclosure signals",
        footnote: "Disclosure classification is a signal to check, not a good/bad verdict; confirm the actual impact in the source.",
      },
    },

    // ── Top 3 ──
    top3Title: "Today's Top 3",
    top3Caption: "Top composite scores · research priority",
    top3Desc:
      "Today's research-priority candidates with relative strengths across several metrics. This is not a buy recommendation, just a suggested order to look at first.",
    top3Empty: "Candidate data is being prepared. Please check back shortly.",

    // ── SignalSection empty state ──
    sectionEmpty: "No matching stocks yet. This will be filled again once data is refreshed.",

    // ── Today's briefing ──
    briefingTitle: "Today's briefing",
    briefingAsOfSuffix: " basis",
    briefingMoveLabel: (n: number) => `Latest trading day change (${n} stocks)`,
    briefingUp: (n: number) => `Up ${n}`,
    briefingDownFlat: (down: number, flat: number) => `/ Down ${down} / Flat ${flat}`,
    briefingStrongLabel: "Composite 80+ stocks",
    briefingCountSuffix: "",
    briefingFlowLabel: "Trading activity surge",
    briefingSignalLabel: "Disclosure signals",
    briefingSignalCountSuffix: "",
    aiThemeSummary: "AI theme summary",
    notAdvice: "Not investment advice",
    breadthLine: (pct: number) => `Latest trading day advance ratio ${pct}% · Updated after market close on business days.`,

    // ── Recent market-close changes ── (caption rendered from the actual basis label in the component)
    changeTitle: "Recent market-close changes",
    newEntrants: "🆕 Newly entered composite 80+ today",
    dropouts: "↘ Dropped out of composite 80+ today",
    rankRisers: (basis: string) => `↑ Rank up ${basis} (5+ steps)`,
    bigMovers: "📊 Large score change",
    rankStepSuffix: " steps",
    watchHint: "Add to your watchlist to get these changes by alert (email for now; KakaoTalk alerts in the works · Settings > Alerts).",

    // ── Checklist ──
    checklistTitle: "Checklist before reviewing candidates",
    checklistDesc: "The candidates below are not buy recommendations but a priority order to verify yourself. Check these before opening a stock.",
    checklist: [
      { before: "Did you review the stock detail and the ", strong: "original DART disclosures", after: " yourself?" },
      { before: "Did you look at any recent short-term surge and the ", strong: "cause and durability of the rise", after: "?" },
      { before: "If it looks cheap (low PER/PBR), did you check whether there is ", strong: "a reason for it", after: "?" },
      { before: "Did you remember that the composite score is not a grade but a ", strong: "research priority", after: "?" },
      { before: "Did you decide diversification and position size ", strong: "yourself", after: "?" },
    ],
    checklistNote: "This checklist is educational guidance and does not recommend buying or selling any specific stock.",

    // ── Footer source note ──
    sourceNote:
      "This page is generated automatically from KRX daily close prices (FinanceDataReader), Naver Finance financial metrics, and real DART disclosure data. Updated automatically after market close on business days. This tool is not investment advice but an analysis tool that suggests research priorities.",

    // ── Dynamic signal text (reason/note) ──
    reason: {
      compositeDouble: (a: string, av: number, b: string, bv: number) => `Strong ${a} ${av} + ${b} ${bv}`,
      compositeSingle: (a: string, av: number) => `Strong ${a} ${av} alone`,
      compositeNeutral: (top: string, tv: number) => `${top} ${tv} (all four metrics neutral)`,
      valueDefault: (per: string, pbr: string) => `PER ${per} · PBR ${pbr}`,
      valueLowPer: "Low PER",
      valueLowPbr: "Low PBR",
      valueRoe: (roe: string) => `ROE ${roe}%`,
      momAllUp: (r6: string) => `Up over 1/3/6 months (6M ${r6})`,
      momRebound: (r1: string) => `Sharp 1-month rebound (${r1})`,
      mom6m: (r6: string) => `6-month ${r6} trend`,
      momFallback: "Strong recent price action",
      volumeNote: (flow: number) => `Trading activity ${flow} · rising trading interest`,
      overheatedNote: (r3m: number) => `+${r3m}% over 3 months · check for short-term overheating`,
      disclosureNote: (label: string) => `${label} · review the original disclosure`,
      riskHigh150: "The recent gain is very large; check the reason for the surge and whether it is overheated.",
      riskHigh120: "The short-term gain is large; check the reason for the surge and the volatility.",
      riskHighVol: "Gains have grown and volatility is high; review the reason and timing together.",
      riskHigh: "The recent gain is large; check the reason for the surge.",
      riskVol: "Volatility is high; consider splitting position size and timing.",
      riskValue: "The valuation metric is low; check the original financials for possible overvaluation.",
      riskDefault: "Check the metrics behind the score together with the original disclosures and financials.",
    },
    metric: METRIC.en,
  },
} as const satisfies Record<Locale, unknown>;
