import { createHash, timingSafeEqual } from "node:crypto";

export const SCORE_UNIVERSE_SIZE = 138;
const scoreColumns = ["momentum", "flow", "value", "vol", "composite"] as const;
type ScoreColumn = (typeof scoreColumns)[number];
type ScoreRow = Record<ScoreColumn, number> & { ticker: string; business_date: string };
type Publication = { sha: string; businessDate: string; dataSha256: string };
type ScoreStore = {
  upsert: (rows: ScoreRow[]) => Promise<void>;
  read: (date: string) => Promise<unknown>;
};

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function isoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const day = new Date(value);
  return Number.isFinite(day.getTime()) && day.toISOString().slice(0, 10) === value;
}

function publicationOf(value: unknown): Publication | null {
  const input = record(value);
  if (!input) return null;
  const { sha, businessDate, dataSha256 } = input;
  return typeof sha === "string" && /^[0-9a-f]{40}$/.test(sha) &&
    isoDate(businessDate) && typeof dataSha256 === "string" && /^[0-9a-f]{64}$/.test(dataSha256)
    ? { sha, businessDate, dataSha256 }
    : null;
}

function score(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

function snapshotRows(data: Buffer, businessDate: string): ScoreRow[] | null {
  const source = record(JSON.parse(data.toString("utf8")));
  if (!source || source.metricsVersion !== "2.4" || source.count !== SCORE_UNIVERSE_SIZE ||
      source.asOfBusinessDate !== businessDate.replaceAll("-", "") ||
      !Array.isArray(source.stocks) || source.stocks.length !== SCORE_UNIVERSE_SIZE) return null;
  const seen = new Set<string>();
  const rows: ScoreRow[] = [];
  for (const value of source.stocks) {
    const stock = record(value);
    if (!stock) return null;
    const { ticker, momentum, flow, value: valuation, volScore, compositeScore } = stock;
    if (typeof ticker !== "string" || !/^\d{6}$/.test(ticker) || seen.has(ticker) ||
        !score(momentum) || !score(flow) || !score(valuation) || !score(volScore) || !score(compositeScore)) return null;
    seen.add(ticker);
    rows.push({ ticker, business_date: businessDate, momentum, flow, value: valuation, vol: volScore, composite: compositeScore });
  }
  return rows;
}

function matchStoredRows(rows: unknown, expected: readonly ScoreRow[]): number {
  if (!Array.isArray(rows) || rows.length > expected.length) return 0;
  const byTicker = new Map(expected.map((row) => [row.ticker, row]));
  const seen = new Set<string>();
  let verified = 0;
  for (const value of rows) {
    const row = record(value);
    if (!row || typeof row.ticker !== "string" || seen.has(row.ticker)) return 0;
    seen.add(row.ticker);
    const want = byTicker.get(row.ticker);
    if (!want || want.business_date !== row.business_date) continue;
    if (scoreColumns.every((key) => {
      const raw = row[key];
      const n = typeof raw === "string" && /^\d+(?:\.\d+)?$/.test(raw) ? Number(raw) : raw;
      return score(n) && n === want[key];
    })) verified++;
  }
  return verified;
}

function sha256(data: string | Buffer): Buffer {
  return createHash("sha256").update(data).digest();
}

function failure(code: string, status: number, extra = {}) {
  return Response.json({ success: false, code, ...extra }, { status, headers: { "cache-control": "no-store" } });
}

export async function persistPublishedScoreRequest(
  req: Request,
  options: {
    secret: string | undefined;
    environment: string | undefined;
    deploymentSha: string | undefined;
    readSnapshot: () => Promise<Buffer>;
    openStore: () => ScoreStore;
  },
): Promise<Response> {
  const auth = req.headers.get("authorization");
  if (!options.secret || !auth || !timingSafeEqual(sha256(auth), sha256(`Bearer ${options.secret}`))) {
    return failure("unauthorized", 401);
  }
  if (options.environment !== "production") return failure("production_only", 409);
  const input = publicationOf(await req.json().catch(() => null));
  if (!input) return failure("invalid_publication", 400);
  if (options.deploymentSha !== input.sha) return failure("deployment_mismatch", 409);

  const data = await options.readSnapshot().catch(() => null);
  if (!data) return failure("snapshot_unavailable", 503);
  if (sha256(data).toString("hex") !== input.dataSha256) return failure("snapshot_mismatch", 409);
  let rows: ScoreRow[] | null;
  try {
    rows = snapshotRows(data, input.businessDate);
  } catch {
    rows = null;
  }
  if (!rows) return failure("invalid_snapshot", 422);

  let verified = 0;
  try {
    const store = options.openStore();
    await store.upsert(rows);
    verified = matchStoredRows(await store.read(input.businessDate), rows);
  } catch {
    return failure("storage_unavailable", 503, { businessDate: input.businessDate, expected: rows.length });
  }
  if (verified !== rows.length) {
    return failure("stored_scores_mismatch", 503, { businessDate: input.businessDate, expected: rows.length, verified });
  }

  return Response.json(
    { success: true, sha: input.sha, businessDate: input.businessDate, verified, total: rows.length },
    { headers: { "cache-control": "no-store" } },
  );
}
