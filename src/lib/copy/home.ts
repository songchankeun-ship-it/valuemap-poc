// 홈(/) 히어로 아래 섹션 카피 — ko/en. 시장 스냅샷·오늘 후보·공시 신호·핵심 기능·
// 사용 방법·데이터 출처 푸터를 다국어로. 종목명·업종·공시 원문(corpName/reportNm/
// signalLabel)·숫자는 원형 유지(스코프상 시장·공시 데이터는 한국어 원문 허용).
// 금융 카피는 양 언어 모두 보수적·비자문(매수/매도/추천/수익보장 금지).
import type { Locale } from "@/lib/i18n";

// 4지표 키 — 강점 칩·막대 라벨을 로케일 인식으로 렌더하기 위해 서버는 key+값만 넘긴다.
export type MetricKey = "momentum" | "flow" | "value" | "vol";

// 후보 카드 "주의" 문구 종류 — 서버가 원시 점수로 분기(key)만 정하고 문장은 여기서 현지화.
export type RiskKind =
  | "surgeXl"
  | "surgeL"
  | "surgeVol"
  | "surge"
  | "volHigh"
  | "valueLow"
  | "default";

export interface StrongMetric {
  key: MetricKey;
  value: number;
}

export const homeCopy = {
  ko: {
    metricLabels: {
      momentum: "추세",
      flow: "거래활성도",
      value: "밸류",
      vol: "위험조정",
    } as Record<MetricKey, string>,
    countStock: "개",
    countCase: "건",
    snapshot: {
      heading: "오늘의 시장 상태",
      sub: "장마감 데이터 요약",
      cards: {
        total: { title: "분석 종목", sub: "실데이터 기반" },
        strong: { title: "종합 80+ 후보", sub: "여러 지표에서 강점 확인" },
        spike: { title: "거래활성도 급증", sub: "평소보다 거래 관심 증가" },
        signal: { title: "공시 신호", sub: "DART · 최신 200건 내 · 신호 기준" },
      },
    },
    topCandidate: {
      heading: "오늘 먼저 볼 후보",
      stepEyebrow: "먼저 볼 것",
      tag: "3개만 먼저",
      intro:
        "점수와 거래활성도, 공시 신호를 함께 보고 먼저 확인할 후보를 추렸어요.",
      rankCriteria:
        "번호는 오늘 후보 안의 표시 순서예요. 매수·매도 추천이 아니라 확인 순서입니다.",
      rankBadgeAria: (n: number) => `오늘 후보 순위 ${n}위`,
      empty: "표시할 후보 데이터를 준비 중입니다. 잠시 후 다시 확인해 주세요.",
      footer:
        "점수는 탐색 우선순위입니다. 공시와 재무를 함께 확인하세요.",
      strength: "강점",
      caution: "주의",
      firstCheck: "먼저 확인할 것",
      viewStock: "상세 보기",
      ctaCompare: "비교",
      ctaSave: "담기",
      compareToday: "오늘 후보 3개 비교",
      // 카드별 "왜 후보인지" 근거 — 강한 지표의 전체 풀 상대순위로 종목마다 다르게(점수 계산 없음, 표시 파생).
      reason: (label: string, rank: number, topPct: number) =>
        `${label} 점수 상위 ${rank}위(상위 ${topPct}%)로 후보에 올랐어요.`,
      noReason: "데이터가 준비 중이라 근거를 아직 표시할 수 없어요.",
      guide: {
        heading: "무엇부터 보면 될까요?",
        steps: [
          { title: "근거 확인", body: "카드 근거와 상세로 왜 후보인지 봐요." },
          { title: "비교", body: "관심 가는 후보를 담아 나란히 비교해요." },
          { title: "담기", body: "관심에 담으면 변화를 이어서 확인해요." },
        ],
      },
      checkpoints: ["최근 공시 원문", "실적·재무 변화"],
      risk: {
        surgeXl: "최근 상승폭이 매우 커서 급등 사유와 과열 여부 함께 확인 필요",
        surgeL: "단기 상승폭이 큰 편이라 급등 사유와 변동성 확인 필요",
        surgeVol: "상승폭이 커진 데다 변동성도 높아 사유·시점 함께 검토 필요",
        surge: "최근 상승폭이 커서 급등 사유 확인 필요",
        volHigh: "변동성이 큰 편이라 비중·시점 분할 검토 필요",
        valueLow: "밸류 지표가 낮아 고평가 여부 원문 재무 확인 필요",
        default: "점수를 만든 지표가 원문에서도 확인되는지 함께 보세요.",
      } as Record<RiskKind, string>,
    },
    disclosure: {
      heading: "오늘 먼저 볼 공시 신호",
      stepEyebrow: "그다음 확인",
      viewAll: "전체 보기 →",
      introA: "자기주식, 보유 변동, 정정공시, 계약, 자금조달 관련 공시를 ",
      introStrong: "DART 최신 200건 내",
      introB: "에서 자동 분류해 확인할 신호를 정리합니다.",
      policyLabel: "표시 정책",
      policyA: "홈에는 ",
      policyStrongPrefix: "분석 대상 ",
      policyStrongSuffix: "종목",
      policyB: "에 해당하는 공시만 우선 표시합니다. 전체 시장 공시는 ",
      policyLink: "공시 신호 페이지",
      policyC: "에서 범위를 바꿔 볼 수 있습니다.",
      footer:
        "공시 신호의 숫자는 좋고 나쁨을 가리는 점수가 아니라 분류 신뢰도입니다. 실제 영향은 원문 공시에서 직접 확인해야 합니다.",
      emptyLine:
        "오늘은 분석 대상 종목에서 새로 잡힌 공시 신호가 없습니다. 전체 시장 공시는 공시 신호 페이지에서 범위를 넓혀 볼 수 있어요.",
      autoClassified: "자동분류",
      outOfUniverse: "분석 대상 외",
      checkLabel: "확인 포인트",
      viewStock: "종목 보기",
      dartOriginal: "DART 원문 ↗",
      check: {
        treasury_buy: "자기주식 취득 규모와 목적을 원문에서 확인하세요.",
        insider_buy: "보유 변동의 매수·매도 방향과 규모를 본문에서 확인하세요.",
        correction: "정정 사유와 변경된 수치를 원문에서 확인하세요.",
        single_contract: "계약 규모와 직전 매출 대비 비율을 원문에서 확인하세요.",
        capital_raise: "발행 규모와 자금 사용 목적을 원문에서 확인하세요.",
        default: "공시 원문에서 세부 내용을 확인하세요.",
      } as Record<string, string>,
    },
    myStocks: {
      heading: "내 종목 이어보기",
      sub: "관심·최근 본 종목",
      stepEyebrow: "먼저 볼 것",
      nextPrompt: "다음",
      nextCandidates: "오늘의 후보",
      nextDisclosures: "공시 신호",
      watchlistLabel: "관심",
      recentLabel: "최근 본",
      loading: "내 종목을 불러오는 중…",
      emptyLine: "아직 담아둔 관심 종목이 없어요. 종목을 살펴보다 눈에 띄는 종목을 담아두면, 다음 방문부터 여기서 바로 이어볼 수 있어요.",
      emptyExplore: "종목 탐색",
      emptyWatchlist: "관심 종목 페이지",
      viewAll: "관심 종목 전체 →",
      scoreLabel: "점수",
      scoreAria: (n: number) => `종합점수 ${n}점`,
      changeAria: (n: number) => `등락률 ${n >= 0 ? "+" : ""}${n.toFixed(2)}%`,
    },
    features: {
      heading: "오른스코어 핵심 기능",
      sub: "점수 · 공시 · 실험실",
      cards: {
        today: {
          title: "오늘의 후보",
          body: "종합 점수를 기준으로 오늘 먼저 확인할 종목을 빠르게 좁힙니다.",
          statPrefix: "종합 80↑ ",
          cta: "후보 보기",
        },
        signal: {
          title: "공시 신호",
          body: "자사주, 보유변동, 대형계약, 손익정정, 유증/CB를 신호로 분류합니다.",
          statPrefix: "최근 ",
          cta: "신호 보기",
        },
        backtest: {
          title: "실험실",
          body: "백테스트는 현재 점수 검증이 아니라 과거 조건을 단순 적용한 참고 시뮬레이션입니다.",
          stat: "참고용 시뮬레이션",
          cta: "실험실 보기",
        },
      },
    },
    howItWorks: {
      heading: "오른스코어는 이렇게 사용하세요",
      sub: "점수로 좁히고, 이유를 보고, 원문으로 검증하는 3단계입니다.",
      start: "종목 탐색 시작하기 →",
      steps: [
        { title: "오늘 후보 확인", body: "종합 점수와 급변 지표로 오늘 먼저 볼 종목을 좁힙니다." },
        { title: "이유 확인", body: "추세·거래활성도·밸류·위험조정 지표를 나눠 보며 근거를 점검합니다." },
        { title: "원문 검증", body: "공시·재무·차트를 함께 확인하고 최종 판단은 직접 합니다." },
      ],
    },
    dataSource: {
      label: "데이터 출처:",
      bodyA:
        "KRX 일별 종가 (FinanceDataReader), Naver Finance PER/PBR/ROE, yfinance 보조 지표, DART 공시 실데이터. ",
      bodyMid: "개 종목 · 매일 갱신 · 데이터 기준 ",
      bodyEnd: " 장마감.",
      about: "서비스 소개",
      terms: "이용약관",
      privacy: "개인정보처리방침",
    },
  },
  en: {
    metricLabels: {
      momentum: "Trend",
      flow: "Trading activity",
      value: "Value",
      vol: "Risk-adjusted",
    } as Record<MetricKey, string>,
    countStock: "",
    countCase: "",
    snapshot: {
      heading: "Today's market status",
      sub: "Market-close data summary",
      cards: {
        total: { title: "Analyzed stocks", sub: "Based on real data" },
        strong: { title: "Composite 80+ candidates", sub: "Strengths across several metrics" },
        spike: { title: "Trading-activity spikes", sub: "More trading interest than usual" },
        signal: { title: "Disclosure signals", sub: "DART · within latest 200 filings · signal basis" },
      },
    },
    topCandidate: {
      heading: "Candidates to check first today",
      stepEyebrow: "First check",
      tag: "Top 3 first",
      intro:
        "Candidates are narrowed using scores, trading activity, and disclosure signals.",
      rankCriteria:
        "Numbers are today's check order. This is not a buy or sell recommendation.",
      rankBadgeAria: (n: number) => `Today's candidate rank #${n}`,
      empty: "Candidate data is being prepared. Please check back shortly.",
      footer:
        "Scores are a research priority, not advice. Check disclosures and financials too.",
      strength: "Strengths",
      caution: "Caution",
      firstCheck: "Check first",
      viewStock: "View details",
      ctaCompare: "Compare",
      ctaSave: "Save",
      compareToday: "Compare 3 candidates",
      // Per-card reason — differentiated by the strongest metric's rank within the full pool (display-only, no scoring).
      reason: (label: string, rank: number, topPct: number) =>
        `Ranked #${rank} in ${label} (top ${topPct}%) among analyzed stocks.`,
      noReason: "Evidence isn't available yet while data is being prepared.",
      guide: {
        heading: "Where to start?",
        steps: [
          { title: "Check the basis", body: "See why it's a candidate via the card and detail." },
          { title: "Compare", body: "Add candidates you like and compare side by side." },
          { title: "Save", body: "Save to your watchlist to keep tracking changes." },
        ],
      },
      checkpoints: ["Recent disclosures", "Financial changes"],
      risk: {
        surgeXl: "The recent rise is very large — check the reason for the surge and whether it is overheated.",
        surgeL: "The short-term rise is large — check the reason for the surge and its volatility.",
        surgeVol: "The rise is large and volatility is high — review the reason and timing together.",
        surge: "The recent rise is large — check the reason behind the surge.",
        volHigh: "Volatility is high — consider splitting position size and timing.",
        valueLow: "The value metric is low — check the original financials for possible overvaluation.",
        default: "Check that the metrics behind the score hold up in the original filings.",
      } as Record<RiskKind, string>,
    },
    disclosure: {
      heading: "Disclosure signals to check first today",
      stepEyebrow: "Then check",
      viewAll: "View all →",
      introA: "Treasury stock, holding changes, corrections, contracts, and financing disclosures are ",
      introStrong: "automatically classified within DART's latest 200 filings",
      introB: " into signals worth checking.",
      policyLabel: "Display policy",
      policyA: "The home page first shows only disclosures for the ",
      policyStrongPrefix: "",
      policyStrongSuffix: " analyzed stocks",
      policyB: ". You can change the scope to the whole market on the ",
      policyLink: "Disclosures page",
      policyC: ".",
      footer:
        "The number on a disclosure signal is classification confidence, not a good/bad score. Check the actual impact directly in the original disclosure.",
      emptyLine:
        "No new disclosure signals came up in the analyzed stocks today. You can widen the scope to the whole market on the Disclosures page.",
      autoClassified: "Auto-classified",
      outOfUniverse: "Not in coverage",
      checkLabel: "What to check",
      viewStock: "View stock",
      dartOriginal: "DART original ↗",
      check: {
        treasury_buy: "Check the size and purpose of the treasury-stock purchase in the original.",
        insider_buy: "Check the buy/sell direction and size of the holding change in the body.",
        correction: "Check the reason for the correction and the changed figures in the original.",
        single_contract: "Check the contract size and its ratio to recent revenue in the original.",
        capital_raise: "Check the issuance size and the purpose of the funds in the original.",
        default: "Check the details in the original disclosure.",
      } as Record<string, string>,
    },
    myStocks: {
      heading: "Pick up where you left off",
      sub: "Watchlist · recently viewed",
      stepEyebrow: "First check",
      nextPrompt: "Next",
      nextCandidates: "Today's candidates",
      nextDisclosures: "Disclosure signals",
      watchlistLabel: "Watching",
      recentLabel: "Recent",
      loading: "Loading your stocks…",
      emptyLine: "You haven't saved any stocks yet. Add ones that catch your eye while exploring, and they'll be waiting right here on your next visit.",
      emptyExplore: "Explore stocks",
      emptyWatchlist: "Watchlist page",
      viewAll: "All watchlist →",
      scoreLabel: "Score",
      scoreAria: (n: number) => `Composite score ${n}`,
      changeAria: (n: number) => `Change ${n >= 0 ? "+" : ""}${n.toFixed(2)}%`,
    },
    features: {
      heading: "OrnScore core features",
      sub: "Scores · disclosures · lab",
      cards: {
        today: {
          title: "Today's candidates",
          body: "Quickly narrow down the stocks to check first today, based on the composite score.",
          statPrefix: "Composite 80+ · ",
          cta: "View candidates",
        },
        signal: {
          title: "Disclosure signals",
          body: "Classifies treasury stock, holding changes, large contracts, P&L corrections, and rights/CB issues into signals.",
          statPrefix: "Recent ",
          cta: "View signals",
        },
        backtest: {
          title: "Lab",
          body: "Backtests are reference simulations using past conditions, not validation of today's score.",
          stat: "Reference simulation",
          cta: "Open lab",
        },
      },
    },
    howItWorks: {
      heading: "How to use OrnScore",
      sub: "Three steps: narrow by score, see the reasons, verify in the original.",
      start: "Start exploring stocks →",
      steps: [
        { title: "Check today's candidates", body: "Narrow today's stocks to check first using the composite score and rapid-change metrics." },
        { title: "See the reasons", body: "Review the trend, trading-activity, value, and risk-adjusted metrics separately to check the basis." },
        { title: "Verify the original", body: "Check disclosures, financials, and charts together, and make the final call yourself." },
      ],
    },
    dataSource: {
      label: "Data sources:",
      bodyA:
        "KRX daily close (FinanceDataReader), Naver Finance PER/PBR/ROE, yfinance auxiliary metrics, DART disclosure data. ",
      bodyMid: " stocks · updated daily · data as of ",
      bodyEnd: " market close.",
      about: "About",
      terms: "Terms",
      privacy: "Privacy Policy",
    },
  },
} as const satisfies Record<Locale, unknown>;
