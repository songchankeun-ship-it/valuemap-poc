import { classifyRoute, type CampaignSource } from "./routeAnalytics";

export const PACKET_CAMPAIGN = "threads" satisfies CampaignSource;

export const PACKET_FORMATS = [
  { id: "neutral-comparison", label: "중립 비교", routeKind: "compare_pair", downstreamEvent: "compare_curated_interactive_open", action: "인터랙티브 비교 열기" },
  { id: "screen-and-check", label: "조건 탐색 후 확인", routeKind: "topic", downstreamEvent: "topic_stock_open", action: "후보의 종목 상세 열기" },
  { id: "activity-change", label: "거래량 변화", routeKind: "today", downstreamEvent: "watchlist_toggle", action: "검토한 거래량 후보를 관심종목에 저장하기" },
] as const;

const SCORE_LABELS = [
  ["momentum", "추세"], ["flow", "거래활성도"], ["value", "밸류"], ["volScore", "위험조정"],
] as const;

type Stock = {
  ticker: string;
  name: string;
  per?: number | null;
  roe?: number | null;
  valueNA?: boolean;
  momentum?: number | null;
  flow?: number | null;
  value?: number | null;
  volScore?: number | null;
  flowStats?: { ratio?: number | null } | null;
};
type Snapshot = { asOfBusinessDate: string; metricsVersion: string; stocks: readonly Stock[] };
type Pair = { slug: string; a: string; b: string };
type Format = (typeof PACKET_FORMATS)[number];

export const PROHIBITED_DRAFT_LANGUAGE = /전망|예측|목표\s*(?:가|주가)|급등|지금\s*당장|서두|놓치지|매수|매도|추천|최고|최대|최상|최강|압도|무조건|확실|보장/i;

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

export function buildGrowthContent(snapshot: Snapshot, pairs: readonly Pair[], activityTickers: readonly string[]) {
  const { asOfBusinessDate, metricsVersion, stocks } = snapshot;
  if (!/^\d{8}$/.test(asOfBusinessDate)) throw new Error("Missing stock snapshot date");
  const date = asOfBusinessDate.replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3");
  const byTicker = new Map(stocks.map((stock) => [stock.ticker, stock]));
  const comparisons = pairs.flatMap((pair) => {
    const a = byTicker.get(pair.a);
    const b = byTicker.get(pair.b);
    if (!a || !b) return [];
    const contrast = SCORE_LABELS.flatMap(([key, label]) => {
      const left = a[key];
      const right = b[key];
      return finite(left) && finite(right) ? [{ label, left, right, gap: Math.abs(left - right) }] : [];
    }).sort((first, second) => second.gap - first.gap)[0];
    return contrast ? [{ pair, a, b, contrast }] : [];
  });
  const lowPer = stocks.flatMap((stock) =>
    finite(stock.per) && stock.per > 0 && finite(stock.roe) && !stock.valueNA
      ? [{ ...stock, per: stock.per, roe: stock.roe }] : [],
  ).sort((a, b) => a.per - b.per || a.ticker.localeCompare(b.ticker, "en"));
  const activity = activityTickers.flatMap((ticker) => {
    const stock = byTicker.get(ticker);
    const ratio = stock?.flowStats?.ratio;
    return stock && finite(ratio) && ratio > 1 ? [{ stock, ratio }] : [];
  });
  if (comparisons.length < 2 || lowPer.length < 2) {
    throw new Error("Current stock snapshot cannot support two drafts per format");
  }

  function draft(format: Format, index: number, path: string, finding: string, limitation: string, nextCheck: string) {
    const url = new URL(path, "https://ornscore.com");
    url.searchParams.set("ref", PACKET_CAMPAIGN);
    const props = classifyRoute(url.pathname, url.search);
    if (url.origin !== "https://ornscore.com" || url.hash || props?.campaign !== PACKET_CAMPAIGN || props.routeKind !== format.routeKind) {
      throw new Error("Invalid growth packet destination");
    }
    const text = [`${date} 데이터 기준`, finding, limitation, nextCheck, url.href].join("\n");
    if (PROHIBITED_DRAFT_LANGUAGE.test(text)) throw new Error("Growth packet draft violates language guardrails");
    return { id: `${format.id}-${index + 1}`, format: format.id, action: format.action, url: url.href, text };
  }

  const activityDrafts = [0, 1].map((index) => {
    const candidate = activity[index];
    if (candidate) {
      const { stock, ratio } = candidate;
      return draft(PACKET_FORMATS[2], index, "/today",
        `${stock.name}의 최근 5거래일 평균 거래량은 20거래일 평균의 ${ratio.toFixed(2)}배입니다.`,
        "거래량 비율만으로 가격 방향이나 거래 주체를 알기 어렵습니다.",
        index === 0 ? "종목 상세에서 거래량이 늘어난 날의 공시 원문을 확인한 뒤, 다시 볼 후보를 관심종목에 저장해 보세요." : "종목 상세에서 거래량이 늘어난 날의 종가 흐름을 확인한 뒤, 다시 볼 후보를 관심종목에 저장해 보세요.");
    }
    if (index === 0) {
      return draft(PACKET_FORMATS[2], index, "/today",
        `오늘 화면의 거래량 급증 후보 ${activityTickers.length}종목 중 거래량 증가를 비율로 확인할 수 있는 종목은 ${activity.length}개입니다.`,
        "거래활성도 점수로 뽑힌 후보는 거래량 비율을 별도로 확인해야 합니다.",
        "오늘 화면에서 후보가 있으면 종목 상세의 거래량 근거를 확인한 뒤, 다시 볼 후보를 관심종목에 저장해 보세요.");
    }
    const ratioCoverage = stocks.filter(({ flowStats }) => finite(flowStats?.ratio) && flowStats.ratio >= 0).length;
    return draft(PACKET_FORMATS[2], index, "/today",
      `전체 ${stocks.length}종목 중 5거래일과 20거래일 평균 거래량의 비율이 기록된 종목은 ${ratioCoverage}개입니다.`,
      "비율이 비어 있는 종목은 이 데이터만으로 거래량 변화를 판단하기 어렵습니다.",
      "오늘 화면에서 후보가 있으면 종목 상세의 거래량과 종가 흐름을 확인한 뒤, 다시 볼 후보를 관심종목에 저장해 보세요.");
  });

  const start = Number(asOfBusinessDate) % comparisons.length;
  const drafts = [
    ...[comparisons[start], comparisons[(start + 1) % comparisons.length]].map(({ pair, a, b, contrast }, index) =>
      draft(PACKET_FORMATS[0], index, `/compare/${pair.slug}`,
        `${contrast.label} 점수는 ${a.name} ${Math.round(contrast.left)}점, ${b.name} ${Math.round(contrast.right)}점입니다.`,
        "이 점수만으로 두 기업의 실적 차이를 설명하기는 어렵습니다.",
        index === 0 ? "최근 분기 매출 변동 요인을 공시 원문에서 확인해 보세요." : "최근 분기 영업이익 변동 요인을 공시 원문에서 확인해 보세요."),
    ),
    ...lowPer.slice(0, 2).map((stock, index) =>
      draft(PACKET_FORMATS[1], index, "/topics/low-per-stocks",
        `양수 PER로 추린 후보 중 ${stock.name}의 PER은 ${stock.per.toFixed(1)}배, ROE는 ${stock.roe.toFixed(1)}%입니다.`,
        "PER은 일회성 이익의 영향을 받을 수 있습니다.",
        index === 0 ? "종목 상세에서 최근 분기 이익에 일회성 항목이 있는지 확인해 보세요." : "종목 상세에서 최근 분기 영업이익이 이어졌는지 확인해 보세요."),
    ),
    ...activityDrafts,
  ];
  return {
    asOfBusinessDate: date, metricsVersion, universeCount: stocks.length,
    coverage: { comparisonPairs: comparisons.length, lowPerStocks: lowPer.length, activityStocks: activity.length },
    drafts,
  };
}

export type GrowthPacket = ReturnType<typeof buildGrowthContent>;
