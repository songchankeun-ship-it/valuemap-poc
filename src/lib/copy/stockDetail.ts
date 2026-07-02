/**
 * 다국어 v2 — /stock/[ticker] 종목 상세 화면의 모든 UI "크롬"(라벨/버튼/고지/탭) 문구.
 * 종목명·티커·업종명·출처명(KRX/Naver/DART/yfinance)·날짜·시세/공시 원시값은 번역하지 않는다.
 * 금융 문구는 한/영 모두 보수적·비자문(매수·매도·추천·수익 보장 금지)으로 유지한다.
 */
import type { Locale } from "@/lib/i18n";

export const stockDetailCopy = {
  ko: {
    // ── page.tsx (서버 → StockDetailIntro 클라이언트 자식) ──
    breadcrumbHome: "홈",
    breadcrumbStocks: "종목 탐색",
    tabs: {
      summary: "요약",
      financials: "재무",
      disclosures: "공시",
      basis: "점수 근거",
    },
    metricLabels: {
      momentum: "추세",
      flow: "거래활성도",
      value: "밸류",
      vol: "위험조정",
    },
    metricsSection: {
      title: "자체 지표 4종",
      poolPrefix: "전체",
      poolSuffix: "종목 대비",
      guideLink: "지표 가이드 →",
    },
    riskDetail: {
      title: "위험 상세",
      subtitle: "위험조정 점수와 별개",
      observedPrefix: "관측",
      observedSuffix: "거래일",
      reliabilityPrefix: "신뢰도",
      reliabilityNormal: "정상",
      reliabilityModerate: "보통",
      reliabilityLow: "낮음",
      reliabilityInsufficient: "부족",
      annualVol: "연환산 변동성",
      maxDrawdown: "최대낙폭",
      worstDay: "최악의 하루",
      note: "위험조정 점수가 높아도 절대 변동성이 낮거나 향후 하락 위험이 작다는 의미는 아닙니다.",
    },
    dataBasis: {
      title: "데이터 기준",
      price: "주가",
      marketClose: "장마감",
      universe: "분석 대상",
      universeSuffix: "종목",
      scoreCalc: "점수 산출일",
      formulaVersion: "산식 버전",
    },
    sectorValue: {
      titlePrefix: "업종 대비 밸류 ·",
      diffNote: "(위 밸류 점수와 기준 다름)",
      peerDescBefore: "같은 업종",
      peerDescMid: "곳(본인 포함) 중 PER·PBR 상대 위치 · 위 4지표 밸류는 전체",
      peerDescAfter: "종목 풀 기준",
      peerDescPoint: "점)",
      lowSample:
        "표본 작음 · 참고만 — 동종 비교 종목이 10개 미만이라 업종 내 위치는 참고용입니다. 충분한 표본이 모이면 강조 표시됩니다.",
      emptyBefore: "같은 업종 비교 표본(PER·PBR 보유 종목",
      emptyMid: "개)이 부족해 업종 내 상대 밸류는 아직 제공하지 않습니다. 위 4지표 밸류는 전체",
      emptyAfter:
        "종목 풀 기준이며, 업종 기준 보정은 후속 과제로 남겨둡니다.",
    },
    financials: {
      per: "PER(최근 실적)",
      pbr: "PBR",
      roe: "ROE",
      dividendYield: "배당수익률",
      perUnit: "배",
      pbrUnit: "배",
      note: "PER·PBR은 최근 실적(후행) 기준이며 현재가에 따라 매일 달라집니다. 향후 이익을 반영한 예상(Forward) PER과는 다릅니다. 적자(EPS 0 이하)·결측 종목은 밸류 점수를 임의값으로 채우지 않고 —로 표시합니다.",
      themesPrefix: "소속 테마",
    },
    basis: {
      warnTitle: "데이터 점검 필요",
    },
  },
  en: {
    breadcrumbHome: "Home",
    breadcrumbStocks: "Stocks",
    tabs: {
      summary: "Summary",
      financials: "Financials",
      disclosures: "Disclosures",
      basis: "Score basis",
    },
    metricLabels: {
      momentum: "Trend",
      flow: "Trading activity",
      value: "Value",
      vol: "Risk-adjusted",
    },
    metricsSection: {
      title: "4 in-house metrics",
      poolPrefix: "vs. all",
      poolSuffix: "stocks",
      guideLink: "Metrics guide →",
    },
    riskDetail: {
      title: "Risk detail",
      subtitle: "separate from the risk-adjusted score",
      observedPrefix: "Observed",
      observedSuffix: "trading days",
      reliabilityPrefix: "Reliability",
      reliabilityNormal: "Normal",
      reliabilityModerate: "Moderate",
      reliabilityLow: "Low",
      reliabilityInsufficient: "Insufficient",
      annualVol: "Annualized volatility",
      maxDrawdown: "Max drawdown",
      worstDay: "Worst day",
      note: "A high risk-adjusted score does not mean low absolute volatility or a small chance of future declines.",
    },
    dataBasis: {
      title: "Data basis",
      price: "Price",
      marketClose: "market close",
      universe: "Coverage",
      universeSuffix: "stocks",
      scoreCalc: "Score date",
      formulaVersion: "Formula version",
    },
    sectorValue: {
      titlePrefix: "Value vs. sector ·",
      diffNote: "(different basis from the Value score above)",
      peerDescBefore: "Relative PER/PBR position among",
      peerDescMid: "sector peers (this stock included) · the 4-metric Value above is based on the full pool of",
      peerDescAfter: "stocks ",
      peerDescPoint: ")",
      lowSample:
        "Small sample · reference only — fewer than 10 sector peers, so the in-sector position is for reference. It will be emphasized once enough peers are available.",
      emptyBefore: "Too few sector peers with PER/PBR data (",
      emptyMid: "stocks), so the in-sector relative value is not yet provided. The 4-metric Value above is based on the full pool of",
      emptyAfter:
        "stocks; sector-based adjustment is left as a follow-up task.",
    },
    financials: {
      per: "PER (trailing)",
      pbr: "PBR",
      roe: "ROE",
      dividendYield: "Dividend yield",
      perUnit: "x",
      pbrUnit: "x",
      note: "PER/PBR are based on trailing results and change daily with the current price. They differ from forward PER, which reflects expected future earnings. For loss-making (EPS ≤ 0) or missing stocks, the Value score is shown as — rather than filled with an arbitrary value.",
      themesPrefix: "Themes",
    },
    basis: {
      warnTitle: "Data check needed",
    },
  },
} as const satisfies Record<Locale, unknown>;

// ── StockConclusionHero ──
export const conclusionHeroCopy = {
  ko: {
    suspectBanner:
      "가격 데이터 검증 중 — 아래 점수는 임시 계산값이며, 공식 후보·순위에서 제외됩니다.",
    nextToCheck: "다음으로 확인할 것",
    disclaimerMain: "매수·매도 추천이 아닌 탐색 우선순위입니다.",
    disclaimerSub:
      "아직 실험 단계 지표라 향후 수익률을 의미하지 않아요 — 결정 전 공시·재무 근거를 함께 확인하세요.",
  },
  en: {
    suspectBanner:
      "Price data under review — the score below is a provisional estimate and is excluded from official candidates and rankings.",
    nextToCheck: "What to check next",
    disclaimerMain: "A research priority, not a buy/sell recommendation.",
    disclaimerSub:
      "It's still an experimental metric and doesn't imply future returns — check the disclosures and financials before deciding.",
  },
} as const satisfies Record<Locale, unknown>;

// ── PriorityScoreCard ──
export const priorityScoreCardCopy = {
  ko: {
    title: "탐색 우선도",
    rankLabel: "상대순위",
    rankParen: "(점수와 별개)",
    overallPrefix: "전체",
    sectorPrefix: "업종",
    rankSuffix: "위",
    scopeNote: (n: number) => `전체 ${n}종목 기준 상대순위 · 홈 후보 순위와 다를 수 있음`,
    badgeAriaLabel: "데이터 상태 배지",
    requiredDataPrefix: "필수 데이터",
    suspectPill: "이상값 점검 중 · 임시 점수",
    passPill: "이상값 점검 통과",
  },
  en: {
    title: "Research priority",
    rankLabel: "Relative rank",
    rankParen: "(separate from the score)",
    overallPrefix: "Overall",
    sectorPrefix: "Sector",
    rankSuffix: "",
    scopeNote: (n: number) => `Relative rank across all ${n} stocks · may differ from the home candidate order`,
    badgeAriaLabel: "Data status badges",
    requiredDataPrefix: "Required data",
    suspectPill: "Outlier check in progress · provisional score",
    passPill: "Passed outlier check",
  },
} as const satisfies Record<Locale, unknown>;

// ── ConclusionSummaryCard ──
export const conclusionSummaryCardCopy = {
  ko: {
    title: "현재 결론",
    suspectPrefix: "데이터 검증 중 · 임시 점수 — ",
  },
  en: {
    title: "Current read",
    suspectPrefix: "Data under review · provisional score — ",
  },
} as const satisfies Record<Locale, unknown>;

// ── StrengthWarningPanel ──
export const strengthWarningPanelCopy = {
  ko: {
    strengthTitle: "강점",
    strengthEmpty: "뚜렷한 강점 지표가 없습니다.",
    warningTitle: "주의 · 확인 필요",
    warningEmpty: "특이 주의 신호 없음.",
  },
  en: {
    strengthTitle: "Strengths",
    strengthEmpty: "No standout strength metric.",
    warningTitle: "Caution · to check",
    warningEmpty: "No notable caution signal.",
  },
} as const satisfies Record<Locale, unknown>;

// ── StockHeader ──
export const stockHeaderCopy = {
  ko: {
    asOfSuffix: "장마감 기준",
  },
  en: {
    asOfSuffix: "as of market close",
  },
} as const satisfies Record<Locale, unknown>;

// ── 가격 기준일 지연 안내(방어용) ──
// 정상(최신 배치 반영)일 때는 전 화면이 동일한 전역 기준일을 쓰고 이 문구는 쓰이지 않는다.
// 종목 주가가 전역 기준일보다 실제로 과거일 때만 명시(설계서 P0-1 B안). 매수/매도/수익 표현 없음.
export const priceBasisLagCopy = {
  ko: {
    servicePrefix: "전체 서비스 기준",
    stockMid: "장마감 · 이 종목 주가",
    stockSuffix: "기준(최신 배치 미반영)",
  },
  en: {
    servicePrefix: "Service-wide as of",
    stockMid: "market close · this stock's price as of",
    stockSuffix: "(not yet in the latest batch)",
  },
} as const satisfies Record<Locale, unknown>;

// ── StockDetailActionButtons ──
export const actionButtonsCopy = {
  ko: {
    navAriaLabel: "종목 상세 다음 확인 항목",
    disclosures: "공시 확인",
    financials: "재무 보기",
    basis: "점수 근거",
    sector: "업종 비교",
  },
  en: {
    navAriaLabel: "Next items to check for this stock",
    disclosures: "Disclosures",
    financials: "Financials",
    basis: "Score basis",
    sector: "Sector compare",
  },
} as const satisfies Record<Locale, unknown>;

// ── MetricInsightCards ──
export const metricInsightCardsCopy = {
  ko: {
    scoreLabel: "점수",
    rankPrefix: "전체 상대순위",
    rankSuffix: "위",
    topPctPrefix: "상위",
    bottomPctPrefix: "하위",
    valueNote:
      "주의: 밸류는 업종 보정 전 전체 풀 기준 · 금융·지주는 구조적으로 높게 나올 수 있음 — 업종 내 위치는 아래 ‘업종 대비 밸류’ 참고",
    interpretLabel: "해석:",
    cautionTag: "주의",
    confirmTag: "확인",
  },
  en: {
    scoreLabel: "Score",
    rankPrefix: "Overall rank",
    rankSuffix: "",
    topPctPrefix: "top",
    bottomPctPrefix: "bottom",
    valueNote:
      "Note: Value is on the full pool before sector adjustment · financials/holding companies can read structurally high — for the in-sector position see “Value vs. sector” below",
    interpretLabel: "Read:",
    cautionTag: "Caution",
    confirmTag: "Check",
  },
} as const satisfies Record<Locale, unknown>;

// ── ScoreBasisBreakdown ──
export const scoreBasisCopy = {
  ko: {
    title: "종합 점수 근거 보기",
    introBefore: "종합",
    introPoint: "점",
    introMid: "= 추세 · 거래활성도 · 밸류 · 위험조정",
    introWeight: "4지표를 동일 가중(각 25%)",
    introAfter:
      "으로 평균한 값입니다. 아래는 각 지표가 종합 점수에 얼마나, 왜 기여했는지 보여줍니다.",
    scoreVsRankBold: "점수와 순위는 다릅니다",
    scoreVsRankRest:
      "— 점수는 0~100 절대값이고, 순위는 다른 종목과 견준 상대 위치입니다.",
    footerBefore: "점수와 근거는",
    footerBold: "매수·매도 추천이 아닌 탐색 우선순위",
    footerMid: "입니다. 각 지표의 계산식은",
    footerLink: "지표 가이드",
    footerAfter: "에서 볼 수 있어요.",
    scoreLabel: "점수",
    contributionPrefix: "종합 기여 ≈",
    contributionPoint: "점",
    weightPrefix: "(가중",
    weightSuffix: "%)",
    rankPrefix: "전체 상대순위",
    rankSuffix: "위",
    topPctPrefix: "상위",
    bottomPctPrefix: "하위",
    interpretLabel: "해석:",
    cautionTag: "주의",
    confirmTag: "확인",
  },
  en: {
    title: "Score basis",
    introBefore: "Composite",
    introPoint: "pts",
    introMid: "= Trend · Trading activity · Value · Risk-adjusted,",
    introWeight: "4 metrics equally weighted (25% each)",
    introAfter:
      ". Below shows how much and why each metric contributed to the composite score.",
    scoreVsRankBold: "Score and rank differ",
    scoreVsRankRest:
      "— the score is an absolute 0–100 value, while the rank is the relative position against other stocks.",
    footerBefore: "The score and basis are a",
    footerBold: "research priority, not a buy/sell recommendation",
    footerMid: ". The formula for each metric is in the",
    footerLink: "metrics guide",
    footerAfter: ".",
    scoreLabel: "Score",
    contributionPrefix: "Composite contribution ≈",
    contributionPoint: "pts",
    weightPrefix: "(weight",
    weightSuffix: "%)",
    rankPrefix: "Overall rank",
    rankSuffix: "",
    topPctPrefix: "top",
    bottomPctPrefix: "bottom",
    interpretLabel: "Read:",
    cautionTag: "Caution",
    confirmTag: "Check",
  },
} as const satisfies Record<Locale, unknown>;

// ── SectorComparison ──
export const sectorComparisonCopy = {
  ko: {
    titlePrefix: "같은 업종 비교 ·",
    sectorAllLink: "업종 전체 →",
    emptyTitle: "같은 업종 비교 표본이 부족합니다.",
    emptySub:
      "분석 풀에 같은 업종 종목이 1곳뿐이라 상대 비교를 표시할 수 없어요.",
    currentTag: "현재",
    legend: "막대 = 종합점수 · 배지 = 업종 순위 · PER/등락 보조",
    sampleBefore: "종합점수 상위",
    sampleMid: "곳 — 같은 업종",
    sampleAfter:
      "곳(본인 포함) 중. 종합점수는 탐색 우선순위용 실험 지표입니다.",
    classNote:
      "업종 분류는 오른스코어 내부 분류 기준이며 공식 KRX 업종과 다를 수 있습니다.",
  },
  en: {
    titlePrefix: "Same-sector compare ·",
    sectorAllLink: "View sector →",
    emptyTitle: "Not enough same-sector peers.",
    emptySub:
      "Only one stock in this sector is in the analysis pool, so a relative comparison can't be shown.",
    currentTag: "This",
    legend: "Bar = composite score · badge = sector rank · PER/change as support",
    sampleBefore: "Top",
    sampleMid: "by composite score among",
    sampleAfter:
      "same-sector stocks (this stock included). The composite score is an experimental research-priority metric.",
    classNote:
      "Sector classification is OrnScore's internal grouping and may differ from official KRX sectors.",
  },
} as const satisfies Record<Locale, unknown>;

// ── BeginnerReading ──
export const beginnerReadingCopy = {
  ko: {
    heading: "초보자는 이렇게 보세요",
    subheading: "점수 → 공시 → 재무 순서로 확인할 항목을 정리했어요",
    currentLabel: "현재 이 종목은",
    firstCheckTitle: "먼저 확인할 것",
    firstCheckHint: "— 순서대로",
    specialTitle: "이 종목에서 특히 볼 것",
    nextTitle: "다음으로 확인하기",
    detailToggle: "지표별 상세 해석 펼치기 ▾",
    disclaimer:
      "⚠ 이 해석은 매수·매도 추천이 아닙니다. 점수 패턴을 보고 무엇을 더 확인할지 알려드리는 가이드입니다.",
    steps: [
      {
        step: "점수부터 본다",
        detail:
          "어떤 지표가 강하고 약한지 — 위 4지표 카드와 점수 근거에서 이유 확인",
      },
      {
        step: "공시를 확인한다",
        detail:
          "자기주식 취득·임원 보유 변동·대형 계약 등 점수에 안 잡히는 신호가 있는지",
      },
      {
        step: "재무로 검증한다",
        detail:
          "PER·PBR·ROE·배당이 점수와 어긋나지 않는지, 싸 보이는 데 이유가 있는지",
      },
    ],
  },
  en: {
    heading: "How beginners should read this",
    subheading: "Items to check, in order: score → disclosures → financials",
    currentLabel: "Right now, this stock is",
    firstCheckTitle: "Check first",
    firstCheckHint: "— in order",
    specialTitle: "What to watch especially for this stock",
    nextTitle: "What to check next",
    detailToggle: "Expand per-metric detail ▾",
    disclaimer:
      "⚠ This read is not a buy/sell recommendation. It's a guide that, from the score pattern, tells you what to check further.",
    steps: [
      {
        step: "Start with the score",
        detail:
          "Which metrics are strong or weak — see the reasons in the 4-metric cards and score basis above",
      },
      {
        step: "Check disclosures",
        detail:
          "Whether there are signals the score misses — buybacks, insider holding changes, large contracts, etc.",
      },
      {
        step: "Verify with financials",
        detail:
          "Whether PER/PBR/ROE/dividend conflict with the score, and whether there's a reason it looks cheap",
      },
    ],
  },
} as const satisfies Record<Locale, unknown>;

// ── StockDisclosures ──
export const stockDisclosuresCopy = {
  ko: {
    title: "DART 공시",
    sourceLive: "실시간",
    sourceLiveTitle: "DART에서 실시간으로 가져온 공시",
    sourceCache: "저장본",
    sourceCacheTitle: "최근에 가져와 저장해 둔 공시",
    sourceSample: "예시 표본",
    sourceSampleTitle: "실데이터 연결 전 보여주는 예시 표본",
    loadError: "공시 데이터를 가져오지 못했습니다.",
    summaryPrefix: "최근 90일",
    summaryDisclosures: "공시",
    summaryDisclosuresUnit: "건",
    summarySignals: "신호",
    summarySignalsUnit: "건",
    scopeNote:
      "최근 90일 내 최신 공시 일부입니다(최대 20건 수집 · 10건 표시) · 전체 공시 이력이 아닙니다.",
    collectedPrefix: "수집 기준",
    collectedUnknown: "수집 시각 미상",
    emptyTitle: "최근 90일간 접수된 DART 공시가 없습니다.",
    emptySub:
      "공시가 없다는 것은 호재도 악재도 아닙니다 — 단지 이 기간에 보고된 주요 공시가 없었다는 뜻이에요.",
    autoClassified: "유형 자동분류",
    dirBuy: "장내매수 단서",
    dirSell: "장내매도·처분 단서",
    dirCheck: "방향 확인 필요",
  },
  en: {
    title: "DART disclosures",
    sourceLive: "Live",
    sourceLiveTitle: "Disclosures fetched live from DART",
    sourceCache: "Cached",
    sourceCacheTitle: "Disclosures fetched recently and cached",
    sourceSample: "Sample",
    sourceSampleTitle: "Sample data shown before real data is connected",
    loadError: "Could not load disclosure data.",
    summaryPrefix: "Last 90 days",
    summaryDisclosures: "disclosures",
    summaryDisclosuresUnit: "",
    summarySignals: "signals",
    summarySignalsUnit: "",
    scopeNote:
      "A subset of recent disclosures within the last 90 days (up to 20 collected · 10 shown) · not the full disclosure history.",
    collectedPrefix: "Collected",
    collectedUnknown: "collection time unknown",
    emptyTitle: "No DART disclosures filed in the last 90 days.",
    emptySub:
      "No disclosures is neither good nor bad news — it simply means no major filings were reported in this period.",
    autoClassified: "auto-classified type",
    dirBuy: "on-market buy clue",
    dirSell: "on-market sell/disposal clue",
    dirCheck: "direction to confirm",
  },
} as const satisfies Record<Locale, unknown>;

// ── AiAnalysisCard ──
export const aiAnalysisCardCopy = {
  ko: {
    title: "AI 종합 분석",
    subtitle: "지표 4종 + 재무 + 공시를 통합한 분석 (1~3초)",
    runError: "분석 생성에 실패했습니다.",
    consentNotice:
      "AI 분석을 실행하면 선택한 종목 데이터와 입력 항목이 AI 처리업체 Anthropic(미국)으로 전송됩니다. 개인 메모·민감한 개인정보는 입력하지 마세요. AI 분석은 투자 추천이 아닌 참고용 요약입니다.",
    consentNoticeProcessor: "AI 처리업체 Anthropic(미국)",
    consentCheckboxBefore: "위 내용을 확인했으며, 데이터가",
    consentCheckboxProcessor: "Anthropic(미국)",
    consentCheckboxAfter: "으로 전송되는 것에 동의합니다.",
    btnRunning: "분석 생성 중…",
    btnNeedConsent: "동의 후 실행할 수 있어요",
    btnRun: "AI 분석 실행",
    resultDisclaimerBefore: "이 분석은 투자 판단을 돕기 위한",
    resultDisclaimerBold: "참고 정보",
    resultDisclaimerAfter:
      "이며, 매수·매도 추천이 아닙니다. 호재·리스크를 함께 확인하세요.",
    secScore: "자체 지표 해석",
    secFinancial: "재무 핵심",
    secTheme: "테마 맥락",
    secDisclosure: "최근 공시 시사점",
    positivesTitle: "호재 3",
    risksTitle: "리스크 3",
    footerSample: "사전 생성 샘플 (Claude 키 없음)",
    footerCache: "캐시된 결과 (24시간 유효)",
    footerModelPrefix: "모델:",
    footerCostPrefix: "비용 약",
    footerCostSuffix: "원",
    footerRemainingPrefix: "오늘",
    footerRemainingSuffix: "회 남음",
    rerun: "다시 실행",
    bottomDisclaimer:
      "본 분석은 일반 정보 제공·교육 목적이며 투자 권유가 아닙니다. 시세·재무·지표는 시뮬레이션 데이터를 포함할 수 있으며, 실제 매매는 본인 책임입니다.",
  },
  en: {
    title: "AI summary analysis",
    subtitle: "An analysis combining the 4 metrics + financials + disclosures (1–3s)",
    runError: "Failed to generate the analysis.",
    consentNotice:
      "Running AI analysis sends the selected stock data and your inputs to the AI processor Anthropic (USA). Do not enter personal notes or sensitive personal information. The AI analysis is a reference summary, not an investment recommendation.",
    consentNoticeProcessor: "AI processor Anthropic (USA)",
    consentCheckboxBefore: "I have read the above and consent to data being sent to",
    consentCheckboxProcessor: "Anthropic (USA)",
    consentCheckboxAfter: ".",
    btnRunning: "Generating analysis…",
    btnNeedConsent: "Consent required to run",
    btnRun: "Run AI analysis",
    resultDisclaimerBefore: "This analysis is",
    resultDisclaimerBold: "reference information",
    resultDisclaimerAfter:
      " to support your own judgment, not a buy/sell recommendation. Review the positives and risks together.",
    secScore: "Metric interpretation",
    secFinancial: "Financial highlights",
    secTheme: "Theme context",
    secDisclosure: "Recent disclosure takeaways",
    positivesTitle: "Top 3 positives",
    risksTitle: "Top 3 risks",
    footerSample: "Pre-generated sample (no Claude key)",
    footerCache: "Cached result (valid 24h)",
    footerModelPrefix: "Model:",
    footerCostPrefix: "cost ≈",
    footerCostSuffix: "KRW",
    footerRemainingPrefix: "",
    footerRemainingSuffix: "left today",
    rerun: "Run again",
    bottomDisclaimer:
      "This analysis is for general information and educational purposes and is not investment advice. Prices, financials, and metrics may include simulated data; actual trading is your own responsibility.",
  },
} as const satisfies Record<Locale, unknown>;
