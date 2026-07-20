#!/usr/bin/env node

import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { collectLiveEnvelope } from "./fetch-metrics251-live-input.mjs";

const TICKERS = Array.from({ length: 138 }, (_, index) => String(100000 + index).padStart(6, "0"));
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function payloads({ marketDate = "2026-07-20", metricsVersion = "2.4", mixedTicker = null } = {}) {
  const compact = marketDate.replaceAll("-", "");
  const stocks = Buffer.from(JSON.stringify({
    count: 138,
    metricsVersion,
    asOfBusinessDate: compact,
    stocks: TICKERS.map((ticker) => ({ ticker, name: `Stock ${ticker}`, per: 10, pbr: 1 })),
  }));
  const prices = new Map(TICKERS.map((ticker) => {
    const finalDate = ticker === mixedTicker ? "2026-07-17" : marketDate;
    return [ticker, Buffer.from(JSON.stringify({
      ticker,
      count: 2,
      to: finalDate,
      points: [{ d: "2026-07-17", c: 100, v: 1000 }, { d: finalDate, c: 101, v: 1100 }],
    }))];
  }));
  return { stocks, prices };
}

async function serve(state) {
  const server = createServer((req, res) => {
    if (state.redirectExternal && req.url === "/data/stocks.json") {
      res.writeHead(302, { Location: "https://example.com/data/stocks.json" }).end();
      return;
    }
    if (req.url === "/data/stocks.json") {
      res.writeHead(200, { "content-type": "application/json" }).end(state.data.stocks);
      return;
    }
    const match = req.url?.match(/^\/data\/prices\/(\d{6})\.json$/);
    if (match && state.data.prices.has(match[1]) && match[1] !== state.missingTicker) {
      const body = match[1] === state.malformedTicker ? Buffer.from("{") : state.data.prices.get(match[1]);
      res.writeHead(200, { "content-type": "application/json" }).end(body);
      return;
    }
    res.writeHead(404).end("not found");
  });
  await new Promise((resolvePromise) => server.listen(0, "127.0.0.1", resolvePromise));
  const address = server.address();
  return {
    base: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolvePromise, reject) => server.close((error) => error ? reject(error) : resolvePromise())),
  };
}

async function expectFailure(options, code, label) {
  try {
    await collectLiveEnvelope(options);
    failures.push(`${label}: expected ${code}`);
  } catch (error) {
    check(error?.code === code, `${label}: expected ${code}, got ${error?.code}`);
  }
}

async function run() {
  const root = await mkdtemp(join(tmpdir(), "ornscore-live-input-test-"));
  const state = { data: payloads(), missingTicker: null, malformedTicker: null, redirectExternal: false };
  const live = await serve(state);
  try {
    const noWriteRoot = join(root, "no-write");
    const dry = await collectLiveEnvelope({ base: live.base, shadowRoot: noWriteRoot, noWrite: true });
    check(dry.reason === "VALIDATED_NO_WRITE", "no-write verdict");
    check(dry.requestCount === 139, `bounded request count: ${dry.requestCount}`);
    check(dry.marketDate === "2026-07-20", `market date: ${dry.marketDate}`);

    const writeRoot = join(root, "write");
    const first = await collectLiveEnvelope({ base: live.base, shadowRoot: writeRoot });
    check(first.reason === "WRITTEN" && first.writtenPaths.length === 1, "first write");
    const manifestPath = join(writeRoot, "live-public", "2026-07-20", "manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    check(manifest.envelopeHash === first.envelopeHash, "manifest hash");

    const second = await collectLiveEnvelope({ base: live.base, shadowRoot: writeRoot });
    check(second.reason === "REUSED" && second.reused, "idempotent reuse");

    state.data = payloads();
    const changed = JSON.parse(state.data.prices.get(TICKERS[0]).toString("utf8"));
    changed.points[0].c = 999;
    state.data.prices.set(TICKERS[0], Buffer.from(JSON.stringify(changed)));
    await expectFailure({ base: live.base, shadowRoot: writeRoot }, "SAME_DATE_CONFLICT", "same-date conflict");

    state.data = payloads({ mixedTicker: TICKERS[3] });
    await expectFailure({ base: live.base, shadowRoot: join(root, "mixed"), noWrite: true }, "MIXED_MARKET_DATE", "mixed date");

    state.data = payloads({ metricsVersion: "2.5.1" });
    await expectFailure({ base: live.base, shadowRoot: join(root, "metrics"), noWrite: true }, "METRICS_VERSION_MISMATCH", "metrics mismatch");

    state.data = payloads();
    state.malformedTicker = TICKERS[5];
    await expectFailure({ base: live.base, shadowRoot: join(root, "malformed"), noWrite: true }, "JSON_INVALID", "malformed price");
    state.malformedTicker = null;

    state.missingTicker = TICKERS[6];
    await expectFailure({ base: live.base, shadowRoot: join(root, "missing"), noWrite: true }, "HTTP_STATUS", "missing price");
    state.missingTicker = null;

    state.redirectExternal = true;
    await expectFailure({ base: live.base, shadowRoot: join(root, "redirect"), noWrite: true }, "CROSS_ORIGIN_REDIRECT", "external redirect");
    state.redirectExternal = false;
  } finally {
    await live.close();
    await rm(root, { recursive: true, force: true });
  }

  if (failures.length) {
    console.error(`fetch-metrics251-live-input tests FAILED (${failures.length})`);
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exitCode = 1;
    return;
  }
  console.log("fetch-metrics251-live-input tests PASSED (8 scenarios, 139-request bound, loopback stopped)");
}

await run();

