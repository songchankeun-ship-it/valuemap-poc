import type { RecentView } from "./recentViews";

export const RECENT_COMPARE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function pickRecentCompareCandidate(
  currentTicker: string,
  recentViews: readonly RecentView[],
  now = Date.now(),
): RecentView | null {
  const seen = new Set<string>();
  for (const view of recentViews) {
    if (seen.has(view.ticker)) continue;
    seen.add(view.ticker);
    if (view.ticker === currentTicker) continue;
    if (!Number.isFinite(view.viewedAt) || now - view.viewedAt > RECENT_COMPARE_MAX_AGE_MS) continue;
    return view;
  }
  return null;
}

export function recentCompareHref(currentTicker: string, peerTicker: string): string {
  const params = new URLSearchParams({ stocks: `${currentTicker},${peerTicker}` });
  return `/compare?${params.toString()}`;
}
