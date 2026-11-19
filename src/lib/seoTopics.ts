import { realStockPool, type RealStock } from "@/lib/realStocks";
import { sectorOf } from "@/lib/sector";

export interface SeoTopic {
  slug: string;
  title: string;
  h1: string;
  shortLabel: string;
  category: string;
  description: string;
  intro: string;
  selectionLabel: string;
  filterNote: string;
  nextCheck?: string;
  primaryMetric: string;
  keywords: string[];
  stocksHref: string;
  stockSelector: () => RealStock[];
}

const TOPIC_LIMIT = 12;

function byComposite(a: RealStock, b: RealStock): number {
  return (b.compositeScore ?? 0) - (a.compositeScore ?? 0);
}

function takeTop(stocks: RealStock[]): RealStock[] {
  return stocks.slice(0, TOPIC_LIMIT);
}

function matchesAnyTheme(stock: RealStock, terms: readonly string[]): boolean {
  return stock.themes.some((theme) => terms.some((term) => theme.includes(term)));
}

function sectorStocks(sector: string): RealStock[] {
  return takeTop(realStockPool.filter((stock) => sectorOf(stock.themes, stock.ticker) === sector).sort(byComposite));
}

function exactThemeStocks(theme: string): RealStock[] {
  return takeTop(realStockPool.filter((stock) => stock.themes.includes(theme)).sort(byComposite));
}

export const MIN_TOPIC_STOCKS = 5;

export const seoTopics: SeoTopic[] = [
  {
    slug: "undervalued-stocks",
    title: "저평가 주식 탐색 | PER·PBR·밸류 점수",
    h1: "저평가 주식 탐색",
    shortLabel: "저평가 주식",
    category: "가치",
    description:
      "PER, PBR, ROE와 오른스코어 밸류 점수를 함께 보며 저평가 가능성이 있는 한국 주식 후보를 탐색합니다.",
    intro:
      "밸류 점수가 높고 PER·PBR 값이 확인되는 종목을 우선 보여줍니다. 업종 구조 차이와 일회성 이익을 함께 확인해야 합니다.",
    selectionLabel: "밸류 점수 높은 순",
    filterNote: "PER·PBR 값이 0보다 큰 종목 중 밸류 점수와 종합 점수를 함께 봅니다.",
    primaryMetric: "밸류",
    keywords: ["저평가 주식", "저평가 종목", "가치주", "PER PBR 비교", "한국 저평가 주식"],
    stocksHref: "/stocks",
    stockSelector: () =>
      takeTop(
        realStockPool
          .filter((stock) => stock.per > 0 && stock.pbr > 0)
          .sort((a, b) => b.value - a.value || (b.compositeScore ?? 0) - (a.compositeScore ?? 0) || a.per - b.per),
      ),
  },
  {
    slug: "dividend-stocks",
    title: "배당주 탐색 | 배당수익률·밸류·위험조정",
    h1: "배당주 탐색",
    shortLabel: "배당주",
    category: "배당",
    description:
      "배당수익률이 확인되는 한국 주식을 밸류, 위험조정, 종합 점수와 함께 비교합니다.",
    intro:
      "배당수익률이 높은 종목을 먼저 보되, 배당이 높다는 이유만으로 안정적이라고 단정하지 않습니다. 가격 하락, 이익 지속성, 업종 특성을 같이 봅니다.",
    selectionLabel: "배당수익률 높은 순",
    filterNote: "배당수익률이 0보다 큰 종목을 대상으로 배당률과 위험조정 점수를 함께 표시합니다.",
    primaryMetric: "배당수익률",
    keywords: ["배당주", "배당수익률 높은 주식", "고배당주", "한국 배당주", "배당 종목"],
    stocksHref: "/stocks",
    stockSelector: () =>
      takeTop(
        realStockPool
          .filter((stock) => stock.dividendYield > 0)
          .sort((a, b) => b.dividendYield - a.dividendYield || b.vol - a.vol || byComposite(a, b)),
      ),
  },
  {
    slug: "low-per-stocks",
    title: `저PER 종목 찾기 | ${realStockPool.length}개 한국 주식 PER 비교`,
    h1: "저PER 종목 찾기",
    shortLabel: "저PER 종목",
    category: "가치",
    description:
      `한국 주식 ${realStockPool.length}개에서 PER이 0보다 큰 종목을 낮은 순으로 비교합니다. PBR·ROE·밸류 점수와 함께 낮은 PER의 배경과 다음 확인 순서를 점검하세요.`,
    intro:
      `분석 대상 ${realStockPool.length}개 중 PER이 0보다 큰 종목을 낮은 순으로 보여줍니다. 낮은 PER은 이익 대비 가격이 낮다는 뜻이지만 업황 둔화나 일회성 이익의 결과일 수도 있으므로, PBR과 ROE를 다음 순서로 확인하세요.`,
    selectionLabel: "PER 낮은 순",
    filterNote: "PER이 0보다 큰 종목 중 낮은 PER을 우선 정렬하고, 밸류 점수로 보조 정렬합니다.",
    primaryMetric: "PER",
    keywords: ["저PER 종목", "저 per 종목", "PER 낮은 종목", "저PER 주식", "PER 낮은 주식", "PER 비교"],
    stocksHref: "/stocks",
    stockSelector: () =>
      takeTop(realStockPool.filter((stock) => stock.per > 0).sort((a, b) => a.per - b.per || b.value - a.value)),
  },
  {
    slug: "low-pbr-stocks",
    title: "PBR 낮은 종목 탐색 | 저PBR 주식 비교",
    h1: "PBR 낮은 종목 탐색",
    shortLabel: "PBR 낮은 종목",
    category: "가치",
    description:
      "PBR 값이 낮은 종목을 ROE, PER, 밸류 점수와 함께 비교해 자산가치 대비 가격을 점검합니다.",
    intro:
      "PBR이 낮다는 사실만으로 저평가를 뜻하지는 않습니다. 자본 효율, 업종 특성, 실적 흐름을 함께 봐야 합니다.",
    selectionLabel: "PBR 낮은 순",
    filterNote: "PBR이 0보다 큰 종목 중 낮은 PBR을 우선 정렬하고, ROE와 밸류 점수를 함께 표시합니다.",
    primaryMetric: "PBR",
    keywords: ["PBR 낮은 종목", "저PBR 주식", "PBR 낮은 주식", "PBR 비교", "자산가치 주식"],
    stocksHref: "/stocks",
    stockSelector: () =>
      takeTop(realStockPool.filter((stock) => stock.pbr > 0).sort((a, b) => a.pbr - b.pbr || b.roe - a.roe)),
  },
  {
    slug: "high-roe-stocks",
    title: "ROE 높은 종목 탐색 | 수익성 주식 비교",
    h1: "ROE 높은 종목 탐색",
    shortLabel: "ROE 높은 종목",
    category: "수익성",
    description:
      "ROE가 높은 한국 주식을 PER, PBR, 종합 점수와 함께 비교해 수익성과 가격 부담을 동시에 봅니다.",
    intro:
      "ROE는 자기자본 대비 이익 창출력을 보여주지만, 부채 구조와 일회성 이익의 영향을 받을 수 있습니다. 가격 부담 지표와 함께 보는 것이 안전합니다.",
    selectionLabel: "ROE 높은 순",
    filterNote: "ROE가 0보다 큰 종목을 대상으로 수익성, PER, PBR, 종합 점수를 함께 표시합니다.",
    primaryMetric: "ROE",
    keywords: ["ROE 높은 종목", "ROE 높은 주식", "수익성 좋은 주식", "ROE 비교", "한국 수익성 주식"],
    stocksHref: "/stocks",
    stockSelector: () =>
      takeTop(realStockPool.filter((stock) => stock.roe > 0).sort((a, b) => b.roe - a.roe || byComposite(a, b))),
  },
  {
    slug: "battery-stocks",
    title: "2차전지 관련주 탐색 | 배터리 테마 종목",
    h1: "2차전지 관련주 탐색",
    shortLabel: "2차전지 관련주",
    category: "테마",
    description:
      "2차전지, 배터리, 전기차 테마 종목을 추세, 거래활성도, 밸류, 위험조정 지표로 비교합니다.",
    intro:
      "2차전지 관련주는 업황과 가격 변동성이 함께 커질 수 있습니다. 테마 노출뿐 아니라 밸류와 위험조정 점수를 같이 확인하세요.",
    selectionLabel: "테마 내 종합 점수 높은 순",
    filterNote: "2차전지·배터리·전기차 테마가 붙은 종목을 대상으로 정렬합니다.",
    primaryMetric: "종합 점수",
    keywords: ["2차전지 관련주", "배터리 관련주", "전기차 배터리 관련주", "2차전지 테마주", "배터리 주식"],
    stocksHref: `/stocks?theme=${encodeURIComponent("2차전지")}`,
    stockSelector: () =>
      takeTop(
        realStockPool
          .filter((stock) => matchesAnyTheme(stock, ["2차전지", "배터리", "전기차"]))
          .sort(byComposite),
      ),
  },
  {
    slug: "semiconductor-stocks",
    title: "반도체 관련주 탐색 | HBM·소재 테마 종목",
    h1: "반도체 관련주 탐색",
    shortLabel: "반도체 관련주",
    category: "테마",
    description:
      "반도체, HBM, 반도체 소재 테마 종목을 추세, 거래활성도, 밸류, 위험조정 지표로 비교합니다.",
    intro:
      "반도체 관련주는 사이클과 수급 영향을 크게 받습니다. 테마명만 보지 말고 가격 흐름, 거래활성도, 밸류 부담을 함께 점검하세요.",
    selectionLabel: "테마 내 종합 점수 높은 순",
    filterNote: "반도체·HBM·DDR5·반도체 소재 테마가 붙은 종목을 대상으로 정렬합니다.",
    primaryMetric: "종합 점수",
    keywords: ["반도체 관련주", "HBM 관련주", "반도체 소재 관련주", "반도체 테마주", "한국 반도체 주식"],
    stocksHref: `/stocks?theme=${encodeURIComponent("반도체")}`,
    stockSelector: () =>
      takeTop(
        realStockPool
          .filter((stock) => matchesAnyTheme(stock, ["반도체", "HBM", "DDR5"]))
          .sort(byComposite),
      ),
  },
  {
    slug: "bio-stocks",
    title: "바이오 관련주 탐색 | 제약·바이오 테마 종목",
    h1: "바이오 관련주 탐색",
    shortLabel: "바이오 관련주",
    category: "테마",
    description:
      "바이오, 제약 테마 종목을 추세, 거래활성도, 밸류, 위험조정 지표로 비교합니다.",
    intro:
      "바이오·제약 관련주는 임상 결과와 파이프라인 기대가 가격을 크게 흔들 수 있습니다. 테마 노출뿐 아니라 밸류와 위험조정 점수, 실적 지속성을 함께 확인하세요.",
    selectionLabel: "테마 내 종합 점수 높은 순",
    filterNote: "바이오·제약 테마가 붙은 종목을 대상으로 종합 점수 순으로 정렬합니다.",
    primaryMetric: "종합 점수",
    keywords: ["바이오 관련주", "제약 관련주", "바이오 테마주", "신약 관련주", "한국 바이오 주식"],
    stocksHref: `/stocks?theme=${encodeURIComponent("바이오")}`,
    stockSelector: () =>
      takeTop(
        realStockPool
          .filter((stock) => matchesAnyTheme(stock, ["바이오", "제약"]))
          .sort(byComposite),
      ),
  },
  {
    slug: "shipbuilding-stocks",
    title: "조선 관련주 탐색 | 조선·조선기자재 테마 종목",
    h1: "조선 관련주 탐색",
    shortLabel: "조선 관련주",
    category: "테마",
    description:
      "조선, 조선기자재 테마 종목을 추세, 거래활성도, 밸류, 위험조정 지표로 비교합니다.",
    intro:
      "조선 관련주는 수주 사이클과 선가, 환율에 민감합니다. 테마명만 보지 말고 가격 흐름, 거래활성도, 밸류 부담을 함께 점검하세요.",
    selectionLabel: "테마 내 종합 점수 높은 순",
    filterNote: "조선·조선기자재 테마가 붙은 종목을 대상으로 종합 점수 순으로 정렬합니다.",
    primaryMetric: "종합 점수",
    keywords: ["조선 관련주", "조선주", "조선기자재 관련주", "조선 테마주", "한국 조선 주식"],
    stocksHref: `/stocks?theme=${encodeURIComponent("조선")}`,
    stockSelector: () =>
      takeTop(
        realStockPool
          .filter((stock) => matchesAnyTheme(stock, ["조선"]))
          .sort(byComposite),
      ),
  },
  {
    slug: "trading-activity-increase-stocks",
    title: "거래량 증가 종목 | 5일·20일 거래활성도 비교",
    h1: "거래량 증가 종목 탐색",
    shortLabel: "거래량 증가 종목",
    category: "거래활성도",
    description: "최근 5거래일 평균 거래량이 20거래일 평균을 웃도는 한국 주식을 거래량 비율로 비교합니다.",
    intro: "평소보다 거래가 활발해진 종목을 찾습니다. 거래활성도는 체결 수량의 변화이며 매수 우위나 주가 방향을 보여주지 않습니다.",
    selectionLabel: "5일 ÷ 20일 평균 거래량 비율 높은 순",
    filterNote: "유효한 5일·20일 평균 거래량과 1배 초과 비율이 확인되는 종목을 비율 높은 순으로 표시합니다.",
    nextCheck: "공시나 지수 편입 등 거래량이 달라진 계기를 찾고, 하루에 거래가 몰렸는지 일별 차트에서 확인하세요.",
    primaryMetric: "거래량 비율",
    keywords: ["거래량 증가 종목", "거래활성도", "5일 20일 평균 거래량"],
    stocksHref: "/stocks",
    stockSelector: () => takeTop(realStockPool
      .filter((stock) => {
        const { recent5dAvg = 0, recent20dAvg = 0, ratio = 0 } = stock.flowStats ?? {};
        return [recent5dAvg, recent20dAvg, ratio].every(Number.isFinite)
          && recent5dAvg > 0 && recent20dAvg > 0 && ratio > 1;
      })
      .sort((a, b) => (b.flowStats?.ratio ?? 0) - (a.flowStats?.ratio ?? 0) || byComposite(a, b))),
  },
  {
    slug: "trend-strength-stocks",
    title: "주가 추세 강한 종목 | 1개월·3개월 가격 흐름",
    h1: "주가 추세가 강한 종목 탐색",
    shortLabel: "주가 추세 강한 종목",
    category: "가격 흐름",
    description: "1개월과 3개월 가격 변화율이 모두 양수인 한국 주식을 오른스코어 추세 점수로 비교합니다.",
    intro: "서로 다른 두 기간에서 가격 흐름이 같은 방향이었던 종목을 모았습니다. 기간의 시작점을 바꾸면 비교 결과도 달라질 수 있습니다.",
    selectionLabel: "추세 점수 높은 순",
    filterNote: "1개월·3개월 가격 변화율이 모두 양수인 종목을 추세 점수 순으로 정렬합니다.",
    nextCheck: "가격 차트에서 최근 상승이 특정 거래일에 집중됐는지 보고, 같은 업종의 흐름과 비교하세요.",
    primaryMetric: "추세 점수",
    keywords: ["주가 추세 강한 종목", "추세 점수", "주가 흐름 비교"],
    stocksHref: "/stocks",
    stockSelector: () => takeTop(realStockPool
      .filter((stock) => (stock.returns?.r1m ?? 0) > 0 && (stock.returns?.r3m ?? 0) > 0)
      .sort((a, b) => b.momentum - a.momentum || byComposite(a, b))),
  },
  {
    slug: "risk-adjusted-strength-stocks",
    title: "위험조정 점수 높은 종목 | 수익률과 변동성 비교",
    h1: "위험조정 점수가 높은 종목 탐색",
    shortLabel: "위험조정 강도",
    category: "가격 흐름",
    description: "수익률과 변동성 근거가 확인되는 한국 주식을 위험조정 점수로 비교하고 최대 낙폭을 확인합니다.",
    intro: "변동성을 함께 고려했을 때 과거 가격 흐름이 두드러진 종목을 봅니다. 위험조정 점수가 높아도 큰 낙폭을 겪을 수 있습니다.",
    selectionLabel: "위험조정 점수 높은 순",
    filterNote: "관측일과 양의 변동성, 양의 샤프 값이 확인되는 종목을 위험조정 점수 순으로 정렬합니다.",
    nextCheck: "금융·가격 지표에서 관측 기간과 최대 낙폭을 확인하고, 그 기간에 급락 구간이 있었는지 살펴보세요.",
    primaryMetric: "위험조정 점수",
    keywords: ["위험조정 점수 높은 종목", "위험조정 수익률 비교", "샤프 비율"],
    stocksHref: "/stocks",
    stockSelector: () => takeTop(realStockPool
      .filter((stock) => {
        const { days = 0, annualStd = 0, sharpe = 0 } = stock.volStats ?? {};
        return [days, annualStd, sharpe].every(Number.isFinite) && days > 0 && annualStd > 0 && sharpe > 0;
      })
      .sort((a, b) => b.vol - a.vol || byComposite(a, b))),
  },
  {
    slug: "financial-sector-stocks",
    title: "금융주 비교 | 은행·증권·보험 종목",
    h1: "금융 업종 종목 비교",
    shortLabel: "금융주",
    category: "업종",
    description: "오른스코어 금융 업종 종목의 PBR, ROE, 배당수익률을 비교하고 사업 유형별로 확인할 지표를 살펴봅니다.",
    intro: "금융 분류에는 은행뿐 아니라 증권·보험 등 사업 구조가 다른 종목도 들어갑니다. 같은 PBR도 자본 활용 방식에 따라 의미가 달라집니다.",
    selectionLabel: "금융 업종 내 종합 점수 높은 순",
    filterNote: "테마 기반 업종 분류가 금융인 종목을 종합 점수 순으로 정렬합니다.",
    nextCheck: "은행은 연체율과 순이자마진, 증권은 수수료·운용손익, 보험은 지급여력 지표를 해당 기업 공시에서 확인하세요.",
    primaryMetric: "종합 점수",
    keywords: ["금융주 비교", "금융 업종 종목"],
    stocksHref: `/stocks?sector=${encodeURIComponent("금융")}`,
    stockSelector: () => sectorStocks("금융"),
  },
  {
    slug: "automotive-sector-stocks",
    title: "자동차주 비교 | 완성차·자동차부품 종목",
    h1: "자동차 업종 종목 비교",
    shortLabel: "자동차주",
    category: "업종",
    description: "자동차 업종으로 분류된 한국 완성차·부품 종목의 밸류와 주가 흐름을 함께 살펴봅니다.",
    intro: "완성차와 부품사는 같은 판매 사이클에서도 매출과 원가가 달라지는 시점이 다릅니다. 테마 기반 분류는 각 회사의 자동차 매출 비중을 보여주지 않습니다.",
    selectionLabel: "자동차 업종 내 종합 점수 높은 순",
    filterNote: "테마 기반 업종 분류가 자동차인 종목을 종합 점수 순으로 정렬합니다.",
    nextCheck: "완성차는 지역별 판매량과 제품 구성, 부품사는 고객사별 매출 비중과 납품 단가 변화를 확인하세요.",
    primaryMetric: "종합 점수",
    keywords: ["자동차주 비교", "자동차부품 주식"],
    stocksHref: `/stocks?sector=${encodeURIComponent("자동차")}`,
    stockSelector: () => sectorStocks("자동차"),
  },
  {
    slug: "defense-stocks",
    title: "방산 관련주 비교 | 국내 방산 테마 종목",
    h1: "방산 관련주 탐색",
    shortLabel: "방산 관련주",
    category: "테마",
    description: "방산주 태그가 붙은 국내 종목을 비교하고 수주 공시에서 계약과 매출 인식 시점을 확인합니다.",
    intro: "방산 태그는 사업 노출의 단서입니다. 수출 협의, 계약 체결, 실제 납품은 서로 다른 단계라서 같은 테마 안에서도 실적 반영 시점이 다릅니다.",
    selectionLabel: "방산주 태그 내 종합 점수 높은 순",
    filterNote: "방산주 태그가 있는 종목만 포함해 종합 점수 순으로 정렬합니다.",
    nextCheck: "단일판매·공급계약 공시에서 계약 금액과 기간을 확인하고, 방산 부문 매출에서 해당 계약이 차지하는 비중을 살펴보세요.",
    primaryMetric: "종합 점수",
    keywords: ["방산 관련주", "방산 테마 종목"],
    stocksHref: `/stocks?theme=${encodeURIComponent("방산주")}`,
    stockSelector: () => exactThemeStocks("방산주"),
  },
  {
    slug: "game-stocks",
    title: "게임주 비교 | 국내 게임 테마 주식",
    h1: "게임 관련주 탐색",
    shortLabel: "게임 관련주",
    category: "테마",
    description: "게임 태그가 붙은 한국 주식을 비교하고 신작 출시 일정과 기존 게임 매출의 비중을 점검합니다.",
    intro: "신작 기대가 반영된 주가와 실제 게임 매출은 시점이 다를 수 있습니다. 게임 태그만으로 개발사와 퍼블리셔의 수익 구조를 구분할 수 없습니다.",
    selectionLabel: "게임 태그 내 종합 점수 높은 순",
    filterNote: "게임 태그가 있는 종목만 포함해 종합 점수 순으로 정렬합니다.",
    nextCheck: "출시 일정 변경 여부를 확인하고 실적 발표에서 주요 타이틀 매출과 마케팅비의 흐름을 같이 보세요.",
    primaryMetric: "종합 점수",
    keywords: ["게임주 비교", "게임 관련주"],
    stocksHref: `/stocks?theme=${encodeURIComponent("게임")}`,
    stockSelector: () => exactThemeStocks("게임"),
  },
  {
    slug: "materials-sector-stocks",
    title: "소재·철강·화학주 비교 | 원재료와 제품 가격 점검",
    h1: "소재·철강·화학 업종 종목 비교",
    shortLabel: "소재·철강·화학주",
    category: "업종",
    description: "소재·철강·화학으로 분류된 한국 종목의 가격 부담을 비교하고 주력 제품과 원재료 노출을 점검합니다.",
    intro: "제품 가격이 올라도 원재료 비용이 더 빠르게 오르면 수익성이 나빠질 수 있습니다. 이 분류는 테마 기반이며 제품별 노출을 직접 측정하지 않습니다.",
    selectionLabel: "소재·철강·화학 업종 내 종합 점수 높은 순",
    filterNote: "테마 기반 업종 분류가 소재·철강·화학인 종목을 종합 점수 순으로 정렬합니다.",
    nextCheck: "사업보고서의 주요 제품과 원재료 항목에서 단가 변화를 보고, 최근 분기 영업이익률과 함께 확인하세요.",
    primaryMetric: "종합 점수",
    keywords: ["소재 철강 화학 주식", "철강 화학 업종 비교"],
    stocksHref: `/stocks?sector=${encodeURIComponent("소재·철강·화학")}`,
    stockSelector: () => sectorStocks("소재·철강·화학"),
  },
];

const realTickers = new Set(realStockPool.map((stock) => stock.ticker));

function hasTopicCoverage(topic: SeoTopic): boolean {
  const tickers = topic.stockSelector().map((stock) => stock.ticker);
  return tickers.every((ticker) => realTickers.has(ticker)) && new Set(tickers).size >= MIN_TOPIC_STOCKS;
}

export function getSeoTopic(slug: string): SeoTopic | undefined {
  return seoTopics.find((topic) => topic.slug === slug && hasTopicCoverage(topic));
}

export function featuredSeoTopics(): SeoTopic[] {
  return seoTopics.filter(hasTopicCoverage);
}
