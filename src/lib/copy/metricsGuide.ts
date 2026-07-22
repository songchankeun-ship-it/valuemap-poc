import type { Locale } from "@/lib/i18n";

/**
 * 지표 가이드(/guide/metrics) 표시 카피 단일 소스 (다국어 v2).
 * ko = 기존 한국어 그대로, en = 충실 번역. 화면은 useLanguage()로 로케일만 바꿔 읽는다.
 *
 * 주의(보수적·비자문):
 * - "탐색 우선순위" → "research priority", "매수·매도 신호가 아닙니다" → "not a buy or sell signal",
 *   "실험 지표" → "experimental metric". 매수/매도/추천/수익 보장 표현 금지.
 * - 출처명(KRX/Naver/yfinance/FinanceDataReader/DART), 날짜, 숫자, 코드 식별자
 *   (compute_metrics.py, metrics.ts), 산식 버전 문자열(Metrics 2.4), GitHub URL은 원형 유지.
 *
 * 지표별 id/anchor와 color 클래스는 화면 쪽 상수로 고정하고, 여기서는 표시 텍스트만 둔다.
 * count(전체 풀 종목 수)는 서버에서 계산해 prop으로 받아 detailFn/valueNoteFn에 주입한다.
 */

export interface MetricCopy {
  /** 화면의 METRIC_META id와 매칭하는 키 (display 아님). */
  key: "momentum" | "flow" | "value" | "vol";
  name: string;
  desc: string;
  calc: string;
  /** count를 주입해 상세 문구를 만든다(밸류만 사용, 그 외는 무시). */
  detail: (count: number) => string;
  high: string;
  low: string;
}

interface MetricsGuideCopy {
  backHome: string;
  headerTitle: string;
  headerLead: string;
  navLabel: string;
  notInvestmentAdvice: {
    leadStrong: string;
    body: (count: number) => string;
  };
  reviewPoints: {
    title: string;
    items: (count: number) => readonly string[];
  };
  seoFaq: {
    title: string;
    note: string;
    items: readonly { question: string; answer: string }[];
  };
  metrics: readonly MetricCopy[];
  metricSection: {
    calcSummary: string;
    highTitle: string;
    lowTitle: string;
  };
  composite: {
    title: string;
    body: string;
    bodyStrong: string;
    bodyTail: string;
    note: string;
    noteStrong: string;
    noteTail: string;
  };
  commonBasis: {
    title: string;
    items: (count: number) => readonly string[];
    versionPrefix: string;
    appliedPrefix: string;
    samePolicy: string;
    changelogLink: string;
    codeIntro: string;
    codeGenerator: string;
    codeReference: string;
    codeNote: string;
  };
  footer: {
    sourcePrefix: string;
    body: (count: number) => string;
  };
  glossary: {
    title: string;
    note: string;
    items: readonly { term: string; def: string }[];
  };
}

export const metricsGuideCopy: Record<Locale, MetricsGuideCopy> = {
  ko: {
    backHome: "← 홈으로",
    headerTitle: "지표 가이드",
    headerLead:
      "오른스코어는 한 종목을 네 각도로 봅니다. 각 지표가 어떻게 계산되고 무엇을 의미하는지 모두 공개합니다.",
    navLabel: "바로 가기:",
    notInvestmentAdvice: {
      leadStrong: "이 도구는 투자 추천이 아닙니다.",
      body: () =>
        "자체 지표는 어떤 종목을 더 자세히 들여다볼지를 정하는 탐색 우선순위에 도움을 주는 신호이며, 매수·매도 판단의 근거가 아닙니다. 모든 투자 결정과 책임은 사용자 본인에게 있습니다.",
    },
    reviewPoints: {
      title: "읽기 전 검토 포인트",
      items: (count: number) => [
        "종합 점수는 네 지표를 똑같은 비중으로 평균합니다. 추세 · 거래활성도 · 밸류 · 위험조정 4지표를 각각 25%씩 동일 가중으로 더해 평균한 값이라, 한 지표만 아주 높아도 나머지가 평범하면 종합 점수는 중간대에 머뭅니다. 종목 상세의 점수 근거 보기에서 각 지표가 종합 점수에 얼마나 기여했는지 확인할 수 있습니다.",
        "점수와 순위는 다릅니다. 점수는 0~100 비교 척도이며, 추세·밸류는 현재 유니버스 안에서의 백분위라 종목 구성이 바뀌면 값도 달라집니다(고정된 절대 점수가 아닙니다). 상대순위는 전체 풀에서 몇 번째인지를 나타냅니다. 같은 52점이라도 분포에 따라 순위는 달라지므로 둘을 같은 의미로 보면 안 됩니다. 종목 상세는 점수와 상대순위를 분리해 표시합니다.",
        `밸류 점수의 기준에 주의하세요. 밸류는 전체 ${count}개 풀 분위라 업종 차이를 보정하지 않습니다 — 금융·지주사처럼 구조적으로 저PER·저PBR인 업종이 상위에 몰릴 수 있습니다. 종목 상세의 업종 대비 밸류는 같은 업종 안에서 다시 본 별도 참고 지표이며, 종합 점수에는 포함되지 않습니다.`,
      ],
    },
    seoFaq: {
      title: "주식 지표 FAQ",
      note: "PER·PBR·ROE 같은 재무 지표는 단독 결론이 아니라 종목을 더 볼지 정하는 출발점입니다.",
      items: [
        {
          question: "PER이 낮으면 저평가 주식인가요?",
          answer:
            "PER이 낮은 종목은 이익 대비 가격이 낮다는 뜻이지만, 업황 부진이나 일회성 이익 때문에 낮아 보일 수도 있습니다. 오른스코어는 PER을 PBR, ROE, 추세, 거래활성도와 함께 확인합니다.",
        },
        {
          question: "PBR이 낮은 종목은 어떻게 봐야 하나요?",
          answer:
            "PBR은 순자산 대비 주가를 보는 지표입니다. 낮은 PBR은 저평가 단서일 수 있지만, 자산 효율이나 성장성이 낮은 경우도 있어 ROE와 업종 특성을 같이 봐야 합니다.",
        },
        {
          question: "ROE가 높으면 좋은 기업인가요?",
          answer:
            "ROE는 자기자본 대비 이익 창출력을 보여줍니다. 다만 부채 구조나 일회성 이익의 영향을 받을 수 있어 PER·PBR·배당수익률, 최근 실적 변화와 함께 보는 편이 안전합니다.",
        },
        {
          question: "배당수익률 높은 주식은 무조건 안정적인가요?",
          answer:
            "배당수익률은 현금 배당의 단서지만 주가 하락으로 높아 보일 수도 있습니다. 배당 지속 가능성, 이익 흐름, 재무 상태를 함께 확인해야 합니다.",
        },
        {
          question: "위험조정 점수는 무엇인가요?",
          answer:
            "위험조정 점수는 관측 기간의 '과거 수익-변동성 효율'(수익을 변동성으로 나눈 효율)을 본 지표입니다. 점수가 높아도 안전(저위험)하다는 뜻이나 향후 하락 위험이 작다는 뜻은 아니며, 과거 흐름을 해석하는 참고 신호입니다. 실제 위험은 종목 상세의 '위험 상세'에서 절대 변동성·최대낙폭으로 함께 확인하세요.",
        },
      ],
    },
    metrics: [
      {
        key: "momentum",
        name: "추세 (모멘텀)",
        desc: "최근 1개월·3개월·6개월 수익률을 가중평균한 추세 지표.",
        calc: "1개월(30%) + 3개월(40%) + 6개월(30%) 가중평균 수익률을 구한 뒤, 전체 종목 내 백분위(0~100)로 환산. 상위일수록 100에 가까움.",
        detail: () =>
          "수익률 산정: 수정종가 기준 · 기간: 1·3·6개월(약 21·63·126거래일) · 고정 구간 매핑 대신 전체 백분위를 써 고점 포화(여러 종목이 100점) 문제를 제거.",
        high: "최근 추세가 강한 상태. 다만 상승폭이 커져 변동성이 확대될 수 있어 원인·지속 가능성 확인이 필요합니다.",
        low: "최근 흐름이 부진합니다. 저평가 여부는 재무·공시로 별도 확인하세요.",
      },
      {
        key: "flow",
        name: "거래활성도",
        desc: "최근 거래량 변화로 측정한 시장 관심도 지표.",
        calc: "최근 5일 평균 거래량 / 20일 평균 거래량 비율. 1배 = 50점, 2배 = 75점, 3배+ = 100점.",
        detail: () =>
          "기준: 최근 5거래일 vs 20거래일 평균 거래량 · 한계: 거래대금·가격 방향·수급(외국인/기관)은 미반영(순수 거래량 변화).",
        high: "거래량이 평소보다 증가 — 이슈·뉴스·공시·수급 변화 여부 확인 필요.",
        low: "거래량이 평소보다 줄어든 상태. 관심도 낮음 또는 횡보 중.",
      },
      {
        key: "value",
        name: "밸류",
        desc: "전체 풀 안에서의 상대적 저평가 정도 (PER·PBR 분위).",
        calc: "PER 분위(낮을수록 점수↑) + PBR 분위 평균. 100 = 풀에서 가장 저PER·저PBR.",
        detail: (count: number) =>
          `분위 기준: 전체 ${count}개 종목 풀 · 한계: 업종 차이 미보정(금융·지주사가 구조적으로 상위에 몰릴 수 있음) — 업종 분위 보정 개발 중.`,
        high: "전체 풀에서 상대적으로 저평가된 위치. 단, 이유 있는 저평가일 수 있습니다.",
        low: "전체 풀에서 상대적으로 고평가. 성장 기대치가 가격에 이미 반영됐을 수 있습니다.",
      },
      {
        key: "vol",
        name: "위험조정 · 과거 수익-변동성 효율",
        desc: "과거 수익을 변동성으로 나눈 효율 (Sharpe 유사) — 안전(저위험) 점수가 아닙니다.",
        calc: "(연간 수익 - 무위험률 3.5%) / 연간 변동성. -2~+2 범위를 0~100점으로 매핑.",
        detail: () =>
          "기간: 최근 1년(약 252거래일) · 수익률: 수정종가 일별 · 무위험률: 연 3.5% · 최소 관측치 미달 시 중립 처리. 절대 변동성·최대낙폭은 종목 상세의 '위험 상세'에 별도 표시.",
        high: "관측 기간 변동성 대비 수익 효율이 양호했던 구간입니다. 과거 기준이며 안전이나 향후 수익을 보장하지 않습니다.",
        low: "변동성 대비 수익 효율이 부진. 흔들림은 큰데 결과가 못 따라간 상태일 수 있습니다.",
      },
    ],
    metricSection: {
      calcSummary: "계산 방법 펼치기 ▾",
      highTitle: "점수가 높을 때 (70~100)",
      lowTitle: "점수가 낮을 때 (0~30)",
    },
    composite: {
      title: "종합 점수",
      body: "위 네 지표의 단순 평균입니다. 종합 점수가 높다는 건 ",
      bodyStrong: '"네 각도에서 모두 우호적인 상태"',
      bodyTail: "로 해석할 수 있다는 뜻입니다.",
      note: "종합 점수는 매수 점수가 아니라 ",
      noteStrong: "탐색 우선순위",
      noteTail: "입니다. 어떤 종목을 더 자세히 들여다볼지 정하는 데 활용하세요. 점수 100인 종목이 항상 좋은 투자라는 보장은 없습니다.",
    },
    commonBasis: {
      title: "계산 공통 기준",
      items: (count: number) => [
        "가격은 수정종가(액면분할·배당락 반영) 기준으로 계산합니다.",
        "결측·거래정지 구간은 가능한 데이터만 사용하고, 최소 관측치 미달 시 중립(50점)으로 처리합니다.",
        "무위험률은 연 3.5%를 단순 적용합니다 (정밀 기준일 보정은 추후 반영).",
        `종합 점수의 밸류는 전체 ${count}개 기준 분위입니다. 종목 상세의 업종 대비 밸류는 별도 참고 지표로, 종합 점수에는 포함되지 않습니다.`,
        "점수는 실험 지표입니다 — 백테스트 검증이 진행 중이라 참고용입니다.",
      ],
      versionPrefix: "산식 버전: ",
      appliedPrefix: " · 적용 ",
      samePolicy: ". 이 페이지의 설명은 실제 운영 계산식과 동일합니다.",
      changelogLink: "산식 변경 이력 보기",
      codeIntro: "계산 코드 공개(산식 검증용) — ",
      codeGenerator: " (실제 데이터 생성기) · ",
      codeReference: " (참조 구현). 점수는 ",
      codeNote: "이며 매수·매도 신호가 아닙니다.",
    },
    footer: {
      sourcePrefix: "데이터 출처:",
      body: (count: number) =>
        ` KRX 상장 종목 가격·거래량(Naver Finance 전달, FinanceDataReader 수집), Naver Finance PER·PBR·ROE, yfinance 보조 필드. 권리 검토 중인 소스는 기존 무료 베타 범위를 확대하지 않습니다. ${count}개 종목.`,
    },
    glossary: {
      title: "용어 한눈에",
      note: "화면 공간이 좁은 표 머리글·칩·배지에서는 ‘종합점수’처럼 붙여 쓰기도 하지만 뜻은 같습니다. 모든 용어는 참고 지표이며 매수·매도 신호가 아닙니다.",
      items: [
        { term: "종합 점수", def: "네 지표(추세·거래활성도·밸류·위험조정)를 각 25%씩 똑같이 평균한 값입니다. 어떤 종목을 더 볼지 정하는 참고 지표이며, 매수·매도 신호가 아닙니다." },
        { term: "추세 (모멘텀)", def: "최근 1·3·6개월 수익률을 가중평균해 흐름의 강도를 본 지표입니다." },
        { term: "거래활성도", def: "최근 거래량이 평소보다 얼마나 늘었는지로 시장 관심도를 본 지표입니다. 방향(상승·하락)을 뜻하지는 않습니다." },
        { term: "밸류 (저평가)", def: "PER·PBR을 전체 종목과 견줘 상대적으로 싼 편인지 본 지표입니다." },
        { term: "위험조정 (변동성조정)", def: "수익을 변동성으로 나눠, 흔들림 대비 성과가 어땠는지 본 지표입니다." },
        { term: "데이터 기준일", def: "화면의 점수·가격이 어느 날짜 데이터를 기준으로 하는지 나타냅니다. 영업일 마감 후 갱신됩니다." },
        { term: "공시 신호", def: "DART에 올라온 자기주식·보유 변동·정정·계약·증자 같은 공시를 분류해 보여주는 참고 정보입니다. 호재·악재를 단정하지 않습니다." },
        { term: "관심 종목", def: "따로 저장해 두고 변화를 지켜보는 종목 목록입니다." },
        { term: "비교", def: "고른 종목들의 점수·PER·PBR·수익률·위험을 나란히 놓고 살펴보는 기능입니다." },
        { term: "주의", def: "호재·악재를 단정하는 게 아니라, 확인해 볼 한계나 유의점을 짚어 주는 안내입니다." },
      ],
    },
  },
  en: {
    backHome: "← Home",
    headerTitle: "Metric guide",
    headerLead:
      "OrnScore looks at a stock from four angles. We fully disclose how each metric is calculated and what it means.",
    navLabel: "Jump to:",
    notInvestmentAdvice: {
      leadStrong: "This tool is not investment advice.",
      body: () =>
        "Our metrics are signals that help set a research priority — which stocks to look at more closely — and are not a basis for buy or sell decisions. All investment decisions and responsibility rest with you.",
    },
    reviewPoints: {
      title: "Points to review before reading",
      items: (count: number) => [
        "The composite score averages the four metrics with equal weight. Trend, trading activity, valuation, and risk-adjusted are each weighted 25% and averaged, so even if one metric is very high, the composite stays mid-range when the others are average. In a stock's detail page, See score basis shows how much each metric contributed to the composite.",
        "Score and rank are different. The score is a comparative 0–100 scale, and the trend and valuation metrics are percentiles within the current universe, so their values shift if the pool changes (it is not a fixed absolute score). The relative rank shows where a stock places within the full pool. The same 52 points can rank differently depending on the distribution, so the two should not be read as the same thing. Stock detail pages show score and relative rank separately.",
        `Note the basis of the valuation score. Valuation is a percentile within the full pool of ${count} stocks, so it does not adjust for sector differences — sectors that are structurally low-PER/low-PBR, such as financials and holding companies, can cluster near the top. The in-sector valuation on a stock's detail page is a separate reference metric viewed within the same sector and is not included in the composite score.`,
      ],
    },
    seoFaq: {
      title: "Stock metric FAQ",
      note: "Financial metrics such as PER, PBR, and ROE are starting points for research, not standalone conclusions.",
      items: [
        {
          question: "Does a low PER mean a stock is undervalued?",
          answer:
            "A low PER means the price is low relative to earnings, but it can also reflect weak industry conditions or one-off earnings. OrnScore reads PER together with PBR, ROE, trend, and trading activity.",
        },
        {
          question: "How should I read a low PBR stock?",
          answer:
            "PBR compares price with book value. A low PBR can be an undervaluation clue, but low asset efficiency or weak growth can also explain it, so ROE and sector context matter.",
        },
        {
          question: "Is a high ROE always good?",
          answer:
            "ROE shows profit generated per unit of equity. It can be affected by leverage or one-off gains, so compare it with PER, PBR, dividend yield, and recent earnings changes.",
        },
        {
          question: "Are high dividend-yield stocks always stable?",
          answer:
            "Dividend yield is a cash-return clue, but it can look high after a price decline. Check dividend sustainability, earnings flow, and financial condition together.",
        },
        {
          question: "What is a risk-adjusted score?",
          answer:
            "The risk-adjusted score reads past return-to-volatility efficiency (return divided by volatility) over the observed period. A high score does not mean the stock is safe (low-risk) or that future downside risk is small; it is a historical reference signal. Check the actual risk via absolute volatility and max drawdown in the stock's Risk detail.",
        },
      ],
    },
    metrics: [
      {
        key: "momentum",
        name: "Trend (Momentum)",
        desc: "A trend metric that takes a weighted average of 1-, 3-, and 6-month returns.",
        calc: "Compute a weighted-average return of 1 month (30%) + 3 months (40%) + 6 months (30%), then convert it to a percentile (0–100) within all stocks. The higher the rank, the closer to 100.",
        detail: () =>
          "Returns: based on adjusted close · Periods: 1/3/6 months (about 21/63/126 trading days) · Uses the full percentile instead of fixed-band mapping to remove top saturation (many stocks scoring 100).",
        high: "A recently strong trend. That said, a large run-up can widen volatility, so check the cause and whether it is likely to continue.",
        low: "Recent movement is weak. Check separately via financials and disclosures whether it is undervalued.",
      },
      {
        key: "flow",
        name: "Trading activity",
        desc: "A market-interest metric measured from recent changes in trading volume.",
        calc: "Ratio of the 5-day average volume to the 20-day average volume. 1x = 50 points, 2x = 75 points, 3x+ = 100 points.",
        detail: () =>
          "Basis: average volume of the last 5 vs. 20 trading days · Limit: does not reflect traded value, price direction, or flows (foreign/institutional) — only pure volume change.",
        high: "Volume is higher than usual — check for any issues, news, disclosures, or changes in flows.",
        low: "Volume is lower than usual. Low interest, or moving sideways.",
      },
      {
        key: "value",
        name: "Valuation",
        desc: "Relative degree of undervaluation within the full pool (PER·PBR percentile).",
        calc: "Average of the PER percentile (lower → higher score) and the PBR percentile. 100 = the lowest PER and PBR in the pool.",
        detail: (count: number) =>
          `Percentile basis: the full pool of ${count} stocks · Limit: no sector adjustment (financials and holding companies can structurally cluster near the top) — sector-percentile adjustment is in development.`,
        high: "Relatively undervalued within the full pool. Note that it may be undervalued for a reason.",
        low: "Relatively overvalued within the full pool. Growth expectations may already be reflected in the price.",
      },
      {
        key: "vol",
        name: "Risk-adjusted · past return-to-volatility efficiency",
        desc: "Past return divided by volatility (Sharpe-like) — not a safety (low-risk) score.",
        calc: "(Annual return − risk-free rate 3.5%) / annual volatility. Maps the −2 to +2 range onto 0–100 points.",
        detail: () =>
          "Period: the last 1 year (about 252 trading days) · Returns: daily adjusted close · Risk-free rate: 3.5% per year · Treated as neutral when below the minimum number of observations. Absolute volatility and max drawdown are shown separately in the stock's Risk detail.",
        high: "A stretch where return-to-volatility efficiency was favorable over the observed period. This is historical and does not guarantee safety or future returns.",
        low: "Return-to-volatility efficiency was weak. The swings may have been large while the result failed to keep up.",
      },
    ],
    metricSection: {
      calcSummary: "Show calculation method ▾",
      highTitle: "When the score is high (70–100)",
      lowTitle: "When the score is low (0–30)",
    },
    composite: {
      title: "Composite score",
      body: "A simple average of the four metrics above. A high composite score can be read as ",
      bodyStrong: '"favorable from all four angles."',
      bodyTail: "",
      note: "The composite score is not a buy score but a ",
      noteStrong: "research priority",
      noteTail: ". Use it to decide which stocks to look at more closely. A stock scoring 100 is not guaranteed to be a good investment.",
    },
    commonBasis: {
      title: "Common calculation basis",
      items: (count: number) => [
        "Prices are calculated on an adjusted-close basis (reflecting splits and ex-dividend).",
        "For missing or trading-halt periods, only available data is used, and below the minimum number of observations it is treated as neutral (50 points).",
        "The risk-free rate is applied simply at 3.5% per year (precise reference-date adjustment is a later task).",
        `The valuation in the composite score is a percentile based on all ${count} stocks. The in-sector valuation on a stock's detail page is a separate reference metric and is not included in the composite score.`,
        "The score is an experimental metric — backtest validation is in progress, so it is for reference only.",
      ],
      versionPrefix: "Formula version: ",
      appliedPrefix: " · applied ",
      samePolicy: ". The explanations on this page match the actual production formulas.",
      changelogLink: "View formula change history",
      codeIntro: "Calculation code published (for formula verification) — ",
      codeGenerator: " (the actual data generator) · ",
      codeReference: " (reference implementation). The score is a ",
      codeNote: " and is not a buy or sell signal.",
    },
    footer: {
      sourcePrefix: "Data sources:",
      body: (count: number) =>
        ` KRX-listed price and volume (Delivered via Naver Finance and collected by FinanceDataReader), Naver Finance PER·PBR·ROE, and yfinance supplementary fields. Sources under rights review are not expanded beyond the existing free beta. ${count} stocks.`,
    },
    glossary: {
      title: "Glossary at a glance",
      note: "In space-constrained tables, chips, and badges the Korean term may appear without a space, but the meaning is the same. Every term is a reference metric, not a buy or sell signal.",
      items: [
        { term: "Composite score", def: "The equal-weighted average (25% each) of the four metrics — trend, trading activity, valuation, and risk-adjusted. It's a reference for what to look at next, not a buy or sell signal." },
        { term: "Trend (Momentum)", def: "A weighted average of recent 1-, 3-, and 6-month returns that gauges how strong the recent move is." },
        { term: "Trading activity", def: "How much recent volume has risen versus usual, as a read on market interest. It does not imply direction (up or down)." },
        { term: "Valuation (undervaluation)", def: "How cheap a stock looks on PER and PBR relative to the whole pool." },
        { term: "Risk-adjusted (Volatility-adjusted)", def: "Return divided by volatility — how the payoff looked relative to the swings." },
        { term: "Data as of", def: "The date the on-screen scores and prices are based on. Updated after market close on business days." },
        { term: "Disclosure signals", def: "DART filings — treasury stock, holdings changes, corrections, contracts, capital raises — sorted for reference. It does not judge good or bad news." },
        { term: "Watchlist", def: "A saved list of stocks you keep an eye on for changes." },
        { term: "Compare", def: "View the scores, PER/PBR, returns, and risk of the stocks you pick side by side." },
        { term: "Caution", def: "A note pointing out limits or things to check — not a verdict of good or bad news." },
      ],
    },
  },
};
