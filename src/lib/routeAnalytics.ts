// Pure classification for the sanitized `route_view_public` analytics event.
//
// This module has no React/DOM/window dependency so it can be unit-verified in
// isolation (see scripts/verify-route-analytics.ts). The rule it enforces:
// every public route view is reduced to a small, fixed set of SAFE properties.
// Raw search text, full URLs, email/account identifiers, and operations
// (/admin) paths must never appear in the emitted props.

export const ROUTE_VIEW_EVENT = "route_view_public";

export type RouteAnalyticsProps = {
  routeKind: string;
  campaign?: CampaignSource;
  ticker?: string;
  topic?: string;
  hasQuery?: boolean;
  hasFilters?: boolean;
  compareCount?: number;
};

export const CAMPAIGN_SOURCES = [
  "disquiet",
  "geeknews",
  "naver-blog",
  "threads",
  "linkedin",
  "kakao",
  "community",
  "direct",
] as const;

export type CampaignSource = (typeof CAMPAIGN_SOURCES)[number];

// The only property keys `route_view_public` is ever allowed to emit. The
// verification script asserts that no classifier can produce a key outside this
// list, so accidentally forwarding raw input (e.g. `q`, `email`) fails the gate.
export const SAFE_ROUTE_PROP_KEYS = [
  "routeKind",
  "campaign",
  "ticker",
  "topic",
  "hasQuery",
  "hasFilters",
  "compareCount",
] as const;

type Classifier = {
  // Stable identifier used in the coverage doc + verification table.
  kind: string;
  // True when this classifier owns the given path.
  match: (pathname: string, parts: string[]) => boolean;
  // Optional extra safe props derived only from path segments / param presence.
  props?: (parts: string[], params: URLSearchParams) => Partial<RouteAnalyticsProps>;
};

// Ordered list; first match wins. Keep this table as the single source of truth
// for "which path emits which safe properties" — the coverage doc mirrors it.
export const ROUTE_CLASSIFIERS: Classifier[] = [
  { kind: "home", match: (p) => p === "/" },
  {
    kind: "stocks",
    match: (p) => p === "/stocks",
    props: (_parts, params) => ({
      hasQuery: params.has("q"),
      hasFilters:
        params.has("sector") || params.has("themes") || params.has("market") || params.has("sort"),
    }),
  },
  {
    kind: "stock_detail",
    match: (_p, parts) => parts[0] === "stock" && Boolean(parts[1]),
    props: (parts) => ({ ticker: parts[1] }),
  },
  {
    kind: "topic",
    match: (_p, parts) => parts[0] === "topics" && Boolean(parts[1]),
    props: (parts) => ({ topic: parts[1] }),
  },
  {
    kind: "compare",
    match: (p) => p === "/compare",
    props: (_parts, params) => ({
      compareCount: (params.get("stocks") ?? "").split(",").filter(Boolean).length,
    }),
  },
  { kind: "watchlist", match: (p) => p === "/watchlist" },
  { kind: "today", match: (p) => p === "/today" },
  { kind: "disclosures", match: (p) => p === "/disclosures" },
  { kind: "backtest", match: (p) => p === "/backtest" },
  { kind: "metrics_guide", match: (p) => p === "/guide/metrics" },
  {
    kind: "login",
    match: (p) => p === "/login",
    props: (_parts, params) => ({ hasQuery: params.has("next") || params.has("error") }),
  },
  { kind: "pricing", match: (p) => p === "/pricing" },
  { kind: "beta", match: (p) => p === "/beta" },
  { kind: "about", match: (p) => p === "/about" },
  { kind: "status", match: (p) => p === "/status" },
];

export const FALLBACK_ROUTE_KIND = "other_public";

// All routeKind values this module can emit (classifiers + fallback). Used by
// the coverage doc and verification script to detect drift.
export const ROUTE_KINDS = [
  ...ROUTE_CLASSIFIERS.map((c) => c.kind),
  FALLBACK_ROUTE_KIND,
] as const;

const CAMPAIGN_SOURCE_SET = new Set<string>(CAMPAIGN_SOURCES);

export function campaignSourceOf(params: URLSearchParams): CampaignSource | undefined {
  const value = params.get("ref");
  return value && CAMPAIGN_SOURCE_SET.has(value) ? (value as CampaignSource) : undefined;
}

/**
 * Reduce a public route to its sanitized analytics props, or `null` when the
 * route must not be tracked (operations/admin surface).
 *
 * @param pathname URL pathname only (no query string, no origin).
 * @param search   Raw `location.search` (leading `?` optional); only checked
 *                 for the PRESENCE of specific keys — values are never copied.
 */
export function classifyRoute(pathname: string, search: string): RouteAnalyticsProps | null {
  // Never emit analytics for operations/admin surfaces.
  if (pathname.startsWith("/admin")) return null;

  const parts = pathname.split("/").filter(Boolean);
  const params = new URLSearchParams(search);
  const campaign = campaignSourceOf(params);
  const campaignProps = campaign ? { campaign } : {};

  for (const classifier of ROUTE_CLASSIFIERS) {
    if (!classifier.match(pathname, parts)) continue;
    return {
      routeKind: classifier.kind,
      ...campaignProps,
      ...(classifier.props?.(parts, params) ?? {}),
    };
  }

  return { routeKind: FALLBACK_ROUTE_KIND, ...campaignProps };
}
