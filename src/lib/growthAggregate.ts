import { FUNNEL_EVENT_NAMES, GROWTH_OUTCOME_EVENT_NAMES } from "./adminTrafficMetrics";
import { CAMPAIGN_SOURCES, ROUTE_KINDS, ROUTE_VIEW_EVENT } from "./routeAnalytics";

export const GROWTH_EVENTS = [...new Set([...FUNNEL_EVENT_NAMES, ...GROWTH_OUTCOME_EVENT_NAMES])];
export const GROWTH_CAMPAIGNS = [...CAMPAIGN_SOURCES, "unattributed"] as const;
export const NO_ROUTE = "none";
export const GROWTH_ENDPOINT = "/api/growth-aggregate";
export const MAX_GROWTH_BYTES = 160;

export type GrowthEvent = {
  event: string;
  campaign: (typeof GROWTH_CAMPAIGNS)[number];
  routeKind: string;
};

export function parseGrowthEvent(input: unknown): GrowthEvent | null {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return null;
  const { event, campaign, routeKind } = input as Record<string, unknown>;
  if (Object.keys(input).length !== 3 ||
    typeof event !== "string" || !GROWTH_EVENTS.includes(event) ||
    typeof campaign !== "string" || !GROWTH_CAMPAIGNS.some((value) => campaign === value) ||
    typeof routeKind !== "string" ||
    (event === ROUTE_VIEW_EVENT ? !ROUTE_KINDS.includes(routeKind) : routeKind !== NO_ROUTE)
  ) return null;

  return { event, campaign: campaign as GrowthEvent["campaign"], routeKind };
}

export function projectGrowthEvent(
  pathname: string,
  event: string,
  props: Record<string, unknown>,
): GrowthEvent | null {
  if (pathname.startsWith("/admin")) return null;
  if (event === "search_result_open" && props.resultType !== "stock") return null;
  return parseGrowthEvent({
    event,
    campaign: props.campaign ?? "unattributed",
    routeKind: event === ROUTE_VIEW_EVENT ? props.routeKind : NO_ROUTE,
  });
}

export type GrowthKey = GrowthEvent & { day: string };

export function kstDay(now: Date): string {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function growthKey(event: GrowthEvent, now: Date): GrowthKey {
  return { day: kstDay(now), ...event };
}
