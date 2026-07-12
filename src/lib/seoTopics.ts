import { realStockPool, type RealStock } from "@/lib/realStocks";

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
    title: "PER 낮은 종목 탐색 | 저PER 주식 비교",
    h1: "PER 낮은 종목 탐색",
    shortLabel: "PER 낮은 종목",
    category: "가치",
    description:
      "PER 값이 낮은 종목을 PBR, ROE, 밸류 점수와 함께 비교해 숫자의 배경을 확인합니다.",
    intro:
      "PER이 낮은 종목은 이익 대비 가격이 낮아 보일 수 있지만, 업황 둔화나 일회성 이익 때문에 낮아질 수도 있습니다. ROE와 PBR을 같이 확인하세요.",
    selectionLabel: "PER 낮은 순",
    filterNote: "PER이 0보다 큰 종목 중 낮은 PER을 우선 정렬하고, 밸류 점수로 보조 정렬합니다.",
    primaryMetric: "PER",
    keywords: ["PER 낮은 종목", "저PER 주식", "PER 낮은 주식", "PER 비교", "가치주 스크리닝"],
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
];

export function getSeoTopic(slug: string): SeoTopic | undefined {
  return seoTopics.find((topic) => topic.slug === slug);
}

export function featuredSeoTopics(): SeoTopic[] {
  return seoTopics;
}
