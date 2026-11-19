import {
  buildTrafficMetricsSummary,
  findUnsafeSummaryProblems,
  FUNNEL_STAGE_DEFS,
  GROWTH_OUTCOME_DEFS,
  type TrafficMetricsResult,
} from "./adminTrafficMetrics";
import { kstDay, parseGrowthEvent, type GrowthKey } from "./growthAggregate";
import { ROUTE_VIEW_EVENT } from "./routeAnalytics";

export const GROWTH_WINDOWS = ["7d", "30d"] as const;
type GrowthWindow = (typeof GROWTH_WINDOWS)[number];

export interface GrowthAggregateStore {
  increment(key: GrowthKey): Promise<void>;
  read(from: string, through: string): Promise<unknown>;
}

type GrowthRow = GrowthKey & { count: number };
type GrowthResults = Record<GrowthWindow, TrafficMetricsResult>;

function dayOffset(day: string, offset: number): string {
  return new Date(Date.parse(day) + offset * 86_400_000).toISOString().slice(0, 10);
}

function validateRows(input: unknown, from: string, through: string): GrowthRow[] {
  if (!Array.isArray(input)) throw new Error("Invalid aggregate response");
  const seen = new Set<string>();
  return input.map((row: unknown) => {
    if (!row || typeof row !== "object" || Object.keys(row).length !== 5) throw new Error("Invalid aggregate row");
    const { day, count, ...dimensions } = row as Record<string, unknown>;
    const event = parseGrowthEvent(dimensions);
    if (!event || typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
        day < from || day > through || dayOffset(day, 0) !== day ||
        typeof count !== "number" || !Number.isSafeInteger(count) || count <= 0) {
      throw new Error("Invalid aggregate value");
    }
    const key = JSON.stringify([day, event.event, event.campaign, event.routeKind]);
    if (seen.has(key)) throw new Error("Duplicate aggregate row");
    seen.add(key);
    return { day, count, ...event };
  });
}

function summarize(window: GrowthWindow, rows: GrowthRow[]): TrafficMetricsResult {
  const routes: Record<string, number> = {};
  const campaigns: Record<string, number> = {};
  const stages: Record<string, number> = {};
  const outcomes: Record<string, number> = {};
  const campaignOutcomes: Record<string, Record<string, number>> = {};
  function add(bucket: Record<string, number>, key: string, count: number) {
    bucket[key] = (bucket[key] ?? 0) + count;
    if (!Number.isSafeInteger(bucket[key])) throw new Error("Aggregate count overflow");
  }

  let total = 0;
  for (const { event, campaign, routeKind, count } of rows) {
    total += count;
    if (!Number.isSafeInteger(total)) throw new Error("Aggregate total overflow");
    if (event === ROUTE_VIEW_EVENT) {
      add(routes, routeKind, count);
      add(campaigns, campaign, count);
    }
    for (const stage of FUNNEL_STAGE_DEFS) {
      if (stage.events.some((name) => name === event)) add(stages, stage.key, count);
    }
    for (const outcome of GROWTH_OUTCOME_DEFS) {
      if (!outcome.events.some((name) => name === event)) continue;
      add(outcomes, outcome.key, count);
      add(campaignOutcomes[campaign] ??= {}, outcome.key, count);
    }
  }
  const summary = buildTrafficMetricsSummary(window, routes, stages, campaigns, outcomes, campaignOutcomes);
  if (findUnsafeSummaryProblems(summary).length) throw new Error("Invalid traffic summary");
  return { status: "ready", summary };
}

export async function readGrowthTraffic(store: GrowthAggregateStore | undefined, now = new Date()): Promise<GrowthResults> {
  if (!store) {
    const result = { status: "not_configured", reason: "일별 집계 저장소가 연결되면 이곳에서 수치를 확인할 수 있습니다." } as const;
    return { "7d": result, "30d": result };
  }
  try {
    const through = kstDay(now);
    const from = dayOffset(through, -29);
    const rows = validateRows(await store.read(from, through), from, through);
    return {
      "7d": summarize("7d", rows.filter((row) => row.day >= dayOffset(through, -6))),
      "30d": summarize("30d", rows),
    };
  } catch {
    const result = { status: "unavailable", reason: "일별 집계 저장소의 연결 및 읽기 권한을 확인하세요." } as const;
    return { "7d": result, "30d": result };
  }
}
