export const GROWTH_SHARE_CAMPAIGN = "share" as const;

/**
 * Add the fixed share campaign marker without preserving a caller-provided ref.
 * The path stays same-origin and can be safely joined to window.location.origin.
 */
export function withGrowthShareRef(path: string): string {
  const url = new URL(path, "https://ornscore.com");
  url.searchParams.set("ref", GROWTH_SHARE_CAMPAIGN);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function stockSharePath(ticker: string): string {
  return withGrowthShareRef(`/stock/${ticker}`);
}

export function compareSharePath(tickers: readonly string[]): string {
  const query = tickers.join(",");
  return withGrowthShareRef(`/compare?stocks=${query}`);
}

export function curatedCompareSharePath(slug: string): string {
  return withGrowthShareRef(`/compare/${slug}`);
}
