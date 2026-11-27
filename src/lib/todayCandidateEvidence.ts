import { dartFilingUrl } from "./disclosureHighlights";
import type { PricePoint } from "./priceHistory";

export const candidateMetrics = ["momentum", "flow", "value", "vol"] as const;
type CandidateMetric = (typeof candidateMetrics)[number];
type Scores = Record<CandidateMetric, number> & { composite: number };

export interface CandidateScoreRow {
  ticker: string;
  business_date: string;
  composite: unknown;
  momentum: unknown;
  flow: unknown;
  value: unknown;
  vol: unknown;
}

interface Filing {
  disclosure: { stock_code?: string; rcept_dt: string; rcept_no: string; report_nm: string };
}

type CheckKind = CandidateMetric | "volume-spike" | "filing" | "basis";
type ScoreChange =
  | { kind: "missing"; reason: "session" | "prices" | "score"; previousDate: string | null; asOf: string | null }
  | {
      kind: "compared";
      previousDate: string;
      asOf: string;
      before: number;
      after: number;
      delta: number;
      metrics: Partial<Record<CandidateMetric, number>>;
      leadingMetric: CandidateMetric | null;
    };

export interface TodayCandidateEvidence {
  change: ScoreChange;
  volume: { avg5: number; avg20: number; ratio: number } | null;
  next: { kind: CheckKind; href: string; filingTitle?: string };
}

export function snapshotIsoDate(ymd: string | undefined): string | null {
  if (!ymd || !/^\d{8}$/.test(ymd)) return null;
  const iso = `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
  const day = new Date(iso);
  return Number.isFinite(day.getTime()) && day.toISOString().slice(0, 10) === iso ? iso : null;
}

/** Two liquid reference series must agree. An unexplained weekday gap (including an
 * unverified holiday) is not enough evidence to label an older row "previous trading day". */
export function verifiedPreviousSession(
  asOf: string | null,
  references: readonly (readonly PricePoint[] | undefined)[],
): string | null {
  if (!asOf || references.length < 2) return null;
  const day = new Date(asOf);
  if (!Number.isFinite(day.getTime()) || [0, 6].includes(day.getUTCDay())) return null;
  do {
    day.setUTCDate(day.getUTCDate() - 1);
  } while ([0, 6].includes(day.getUTCDay()));
  const previous = day.toISOString().slice(0, 10);
  return references.every((points) => points?.at(-1)?.d === asOf && points.at(-2)?.d === previous)
    ? previous
    : null;
}

function score(value: unknown): number | null {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
}

const roundDelta = (n: number) => Math.round(n * 10) / 10 || 0;

export function buildTodayCandidateEvidence(input: {
  ticker: string;
  asOf: string | null;
  previousDate: string | null;
  current: Scores;
  currentClose: number;
  points?: readonly PricePoint[];
  previousScores: readonly CandidateScoreRow[];
  measuredValuation: boolean;
  volumeStats?: { recent5dAvg?: number; recent20dAvg?: number; ratio?: number };
  filingSource: string;
  filings: readonly Filing[];
}): TodayCandidateEvidence {
  const { ticker, asOf, previousDate, points, current, currentClose, measuredValuation } = input;
  const last = points?.at(-1);
  const currentPriceAligned = !!asOf && last?.d === asOf && currentClose > 0 && last.c === currentClose;
  const lastPairAligned = currentPriceAligned && points?.at(-2)?.d === previousDate;
  const matching = input.previousScores.filter((row) => row.ticker === ticker && row.business_date === previousDate);
  const prior = matching.length === 1 ? matching[0] : undefined;
  const before = score(prior?.composite);
  const after = score(current.composite);
  let change: ScoreChange;
  if (!asOf || !previousDate || !lastPairAligned || before === null || after === null || !prior) {
    const reason = !asOf || !previousDate ? "session" : !lastPairAligned ? "prices" : "score";
    change = { kind: "missing", reason, previousDate, asOf };
  } else {
    const metrics: Partial<Record<CandidateMetric, number>> = {};
    for (const key of candidateMetrics) {
      const from = score(prior[key]);
      const to = score(current[key]);
      if (from !== null && to !== null) metrics[key] = roundDelta(to - from);
    }
    // History has no valueNA flag. A value matching the three-factor substitute
    // cannot be distinguished from a measured score and is not attributed.
    const priorOthers = [score(prior.momentum), score(prior.flow), score(prior.vol)];
    const priorValuation = score(prior.value);
    if (!measuredValuation || priorValuation === null || priorOthers.some((v) => v === null) ||
        Math.abs(priorValuation - priorOthers.reduce<number>((sum, v) => sum + (v ?? 0), 0) / 3) <= 0.051) {
      delete metrics.value;
    }
    const leadingMetric = candidateMetrics
      .filter((key) => !!metrics[key])
      .sort((a, b) => Math.abs(metrics[b] ?? 0) - Math.abs(metrics[a] ?? 0))[0] ?? null;
    change = { kind: "compared", previousDate, asOf, before, after, delta: roundDelta(after - before), metrics, leadingMetric };
  }

  const { recent5dAvg: avg5, recent20dAvg: avg20, ratio } = input.volumeStats ?? {};
  const volume = currentPriceAligned && typeof avg5 === "number" && Number.isFinite(avg5) && avg5 >= 0 &&
    typeof avg20 === "number" && Number.isFinite(avg20) && avg20 > 0 &&
    typeof ratio === "number" && Number.isFinite(ratio) && ratio >= 0 ? { avg5, avg20, ratio } : null;

  const detail = `/stock/${ticker}`;
  if (volume && volume.ratio >= 1.5) return { change, volume, next: { kind: "volume-spike", href: detail + "#summary" } };
  if (asOf && input.filingSource === "live") {
    const date = asOf.replaceAll("-", "");
    const filing = input.filings
      .map(({ disclosure }) => disclosure)
      .filter((d) => d.stock_code === ticker && d.rcept_dt === date && d.rcept_no.startsWith(date) && dartFilingUrl(d.rcept_no))
      .sort((a, b) => b.rcept_no.localeCompare(a.rcept_no))[0];
    const href = filing && dartFilingUrl(filing.rcept_no);
    if (href) return { change, volume, next: { kind: "filing", href, filingTitle: filing.report_nm } };
  }

  const strongestMove = change.kind === "compared" ? change.leadingMetric : null;
  const previousClose = lastPairAligned ? points?.at(-2)?.c : undefined;
  const largePriceMove = typeof previousClose === "number" && Number.isFinite(previousClose) && previousClose > 0 &&
    Math.abs(currentClose / previousClose - 1) >= 0.05;
  const weakestCurrent = candidateMetrics
    .filter((key) => (key !== "value" || measuredValuation) && score(current[key]) !== null)
    .sort((a, b) => current[a] - current[b])[0];
  const metric = strongestMove ?? (largePriceMove ? "momentum" : weakestCurrent);
  const kind = metric === "value" || (metric && currentPriceAligned) ? metric : "basis";
  const target = kind === "value" ? "#financials" : kind === "basis" ? "#basis" : "#summary";
  return { change, volume, next: { kind, href: detail + target } };
}
