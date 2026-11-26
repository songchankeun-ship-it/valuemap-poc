export interface TodayDisclosureSummary {
  source: "live" | "sample" | "cache" | "unavailable";
  count: number | null;
}

export function summarizeTodayDisclosures(result: {
  source?: string;
  signalCount?: number;
  signals?: readonly unknown[];
}): TodayDisclosureSummary {
  const source = result.source?.startsWith("sample") ? "sample" :
    result.source === "live" || result.source === "cache" ? result.source : "unavailable";
  return {
    source,
    count: source === "unavailable" ? null : result.signalCount ?? result.signals?.length ?? 0,
  };
}
