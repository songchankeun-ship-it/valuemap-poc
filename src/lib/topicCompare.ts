const PUBLIC_TICKER_RE = /^\d{6}$/;

export const TOPIC_COMPARE_LIMIT = 3;

export type TopicCompareStart = {
  tickers: string[];
  href: string;
};

export function buildTopicCompareStart(
  candidates: ReadonlyArray<{ ticker: string }>,
): TopicCompareStart | null {
  const tickers: string[] = [];

  for (const candidate of candidates) {
    if (!PUBLIC_TICKER_RE.test(candidate.ticker) || tickers.includes(candidate.ticker)) continue;
    tickers.push(candidate.ticker);
    if (tickers.length === TOPIC_COMPARE_LIMIT) break;
  }

  if (tickers.length < 2) return null;

  const params = new URLSearchParams({ stocks: tickers.join(",") });
  return { tickers, href: `/compare?${params.toString()}` };
}
