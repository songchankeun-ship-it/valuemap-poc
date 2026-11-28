import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { persistPublishedScoreRequest } from "../src/lib/publishedScorePersistence";
import { persistWhenPublished } from "./persist-published-scores.mjs";

const snapshot = readFileSync(new URL("../public/data/stocks.json", import.meta.url));
const source = JSON.parse(snapshot.toString("utf8"));
const businessDate = source.asOfBusinessDate.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
const sha = "a".repeat(40);
const secret = "local-test-only";
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const payload = { sha, businessDate, dataSha256: hash(snapshot) };
type Options = Parameters<typeof persistPublishedScoreRequest>[1];
type Row = Parameters<ReturnType<Options["openStore"]>["upsert"]>[0][number];
type ReadTransform = (rows: Row[]) => unknown;

function freshStore(transform?: ReadTransform, upsertFails = false, readFails = false) {
  const scores = new Map<string, Row>();
  const calls: string[] = [];
  const handler: Options = {
    secret, environment: "production", deploymentSha: sha,
    readSnapshot: async () => { calls.push("snapshot"); return snapshot; },
    openStore: () => ({
      upsert: async (rows) => {
        calls.push(`upsert:${rows.length}`);
        if (upsertFails) throw new Error("fixture upsert error");
        for (const row of rows) scores.set(`${row.business_date}:${row.ticker}`, { ...row });
      },
      read: async (date) => {
        calls.push(`read:${date}`);
        if (readFails) throw new Error("fixture read error");
        const rows = [...scores.values()].filter((r) => r.business_date === date);
        return transform ? transform(rows) : rows;
      },
    }),
  };
  return { scores, calls, handler };
}

function post(value: unknown = payload, authorization = `Bearer ${secret}`) {
  return new Request("https://fixture.test/api/cron/save-scores", {
    method: "POST",
    headers: { authorization, "content-type": "application/json" },
    body: JSON.stringify(value),
  });
}

async function main() {
  const good = freshStore();
  const res = await persistPublishedScoreRequest(post(), good.handler);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { success: true, sha, businessDate, verified: 138, total: 138 });
  assert.deepEqual(good.calls, ["snapshot", "upsert:138", `read:${businessDate}`]);
  assert.equal(good.scores.size, 138);
  for (const stock of source.stocks) {
    assert.deepEqual(good.scores.get(`${businessDate}:${stock.ticker}`), {
      ticker: stock.ticker, business_date: businessDate, momentum: stock.momentum, flow: stock.flow,
      value: stock.value, vol: stock.volScore, composite: stock.compositeScore,
    });
  }
  await persistPublishedScoreRequest(post(), good.handler);
  assert.equal(good.scores.size, 138, "repeat delivery must not duplicate date/ticker");
  console.log("PASS complete exact-date write/readback and duplicate delivery");

  for (const [name, transform, n] of [
    ["one missing", (rows: Row[]) => rows.slice(0, -1), 137],
    ["same count, changed score", (rows: Row[]) => [{ ...rows[0], flow: rows[0].flow === 0 ? 1 : 0 }, ...rows.slice(1)], 137],
    ["same count, wrong ticker", (rows: Row[]) => [{ ...rows[0], ticker: "never-matches" }, ...rows.slice(1)], 137],
    ["same count, wrong date", (rows: Row[]) => [{ ...rows[0], business_date: "1900-01-01" }, ...rows.slice(1)], 137],
    ["duplicate row", (rows: Row[]) => [rows[1], ...rows.slice(1)], 0],
    ["extra row", (rows: Row[]) => [...rows, rows[0]], 0],
    ["numeric storage strings", (rows: Row[]) => rows.map((r) => ({ ...r, composite: String(r.composite) })), 138],
  ] as const) {
    const fixture = freshStore(transform);
    const reply = await persistPublishedScoreRequest(post(), fixture.handler);
    const body = await reply.json();
    assert.equal(reply.status, n === 138 ? 200 : 503, name);
    assert.equal(body.success, n === 138, name);
    assert.equal(body.verified, n, name);
    console.log(`PASS ${name}: HTTP ${reply.status}, matched ${body.verified}/138`);
  }
  for (const [upsertFails, readFails] of [[true, false], [false, true]]) {
    const fixture = freshStore(undefined, upsertFails, readFails);
    const result = await persistPublishedScoreRequest(post(), fixture.handler);
    assert.equal(result.status, 503);
    assert.equal((await result.json()).code, "storage_unavailable");
    if (upsertFails) assert.ok(!fixture.calls.some((c) => c.startsWith("read:")));
  }
  console.log("PASS storage rejection or read failure never reports success");

  for (const [settings, input, auth, status] of [
    [{ secret: undefined }, payload, `Bearer ${secret}`, 401],
    [{}, payload, "Bearer wrong", 401],
    [{ environment: "preview" }, payload, `Bearer ${secret}`, 409],
    [{ deploymentSha: "b".repeat(40) }, payload, `Bearer ${secret}`, 409],
    [{}, { ...payload, businessDate: "2026-02-31" }, `Bearer ${secret}`, 400],
    [{}, { ...payload, businessDate: "1900-01-01" }, `Bearer ${secret}`, 422],
    [{}, { ...payload, dataSha256: "0".repeat(64) }, `Bearer ${secret}`, 409],
  ] as const) {
    const fixture = freshStore();
    const reply = await persistPublishedScoreRequest(post(input, auth), { ...fixture.handler, ...settings });
    assert.equal(reply.status, status);
    assert.equal(fixture.scores.size, 0);
    assert.ok(!fixture.calls.some((c) => c.startsWith("upsert:")));
  }
  for (const invalid of [
    { ...source, asOfBusinessDate: undefined },
    { ...source, metricsVersion: "2.5.1" },
    { ...source, stocks: source.stocks.slice(1) },
    { ...source, stocks: [source.stocks[1], ...source.stocks.slice(1)] },
    { ...source, stocks: [{ ...source.stocks[0], compositeScore: null }, ...source.stocks.slice(1)] },
  ]) {
    const fixture = freshStore();
    const bytes = Buffer.from(JSON.stringify(invalid));
    const reply = await persistPublishedScoreRequest(post({ ...payload, dataSha256: hash(bytes) }), {
      ...fixture.handler, readSnapshot: async () => bytes,
    });
    assert.equal(reply.status, 422);
    assert.equal(fixture.scores.size, 0);
  }
  console.log("PASS authorization, full SHA, production environment, date, digest and invalid source fail before writes");

  const fakePublish = (mode: "advances" | "stale" | "wrong-digest" | "partial-receipt" | "wrong-receipt") => {
    let reads = 0;
    let writes = 0;
    const fixture = freshStore();
    const request: typeof fetch = async (input, init) => {
      const url = new URL(input instanceof Request ? input.url : input);
      assert.equal(url.origin, "https://ornscore.com");
      if (url.pathname === "/status") {
        reads++;
        const current = mode === "stale" || (mode === "advances" && reads === 1) ? "b".repeat(7) : sha.slice(0, 7);
        return new Response(`<span title="Code ${current}"></span>`);
      }
      if (url.pathname === "/data/stocks.json") {
        return new Response(mode === "wrong-digest" ? "{}" : snapshot.toString("utf8"));
      }
      assert.equal(url.pathname, "/api/cron/save-scores");
      assert.equal(init?.method, "POST");
      writes++;
      if (mode === "partial-receipt") return Response.json({ ...payload, success: true, verified: 137, total: 138 });
      if (mode === "wrong-receipt") return Response.json({ ...payload, sha: "b".repeat(40), success: true, verified: 138, total: 138 });
      return persistPublishedScoreRequest(new Request(input, init), fixture.handler);
    };
    const params = { sha, snapshot, secret, request, pause: async () => {}, attempts: 2 };
    return { run: () => persistWhenPublished(params), counts: () => ({ reads, writes }) };
  };
  const advance = fakePublish("advances");
  assert.deepEqual(await advance.run(), { sha, businessDate, verified: 138 });
  assert.deepEqual(advance.counts(), { reads: 2, writes: 1 });
  for (const mode of ["stale", "wrong-digest", "partial-receipt", "wrong-receipt"] as const) {
    const fixture = fakePublish(mode);
    await assert.rejects(fixture.run, mode.includes("receipt") ? /not confirmed/ : /no scores written/);
    assert.equal(fixture.counts().writes, mode.includes("receipt") ? 1 : 0, mode);
  }
  await assert.rejects(
    () => persistWhenPublished({ sha, snapshot, secret: "", request: async () => { throw new Error("must not request"); } }),
    /not configured/,
  );
  console.log("PASS publish-before-write handshake, stale build, wrong digest, partial or wrong receipt");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
