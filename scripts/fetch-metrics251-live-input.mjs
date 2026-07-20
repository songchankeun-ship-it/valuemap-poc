#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const DEFAULT_SHADOW_ROOT = join(ROOT, ".metrics251-shadow");
const EXPECTED_UNIVERSE = 138;
const EXPECTED_METRICS_VERSION = "2.4";
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_CONCURRENCY = 10;
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_TOTAL_BYTES = 20 * 1024 * 1024;
const MAX_REDIRECTS = 3;

class InputFetchError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "InputFetchError";
    this.code = code;
  }
}

function isInside(child, parent) {
  const childPath = resolve(child);
  const parentPath = resolve(parent);
  return childPath === parentPath || childPath.startsWith(parentPath + sep);
}

function safeBase(raw) {
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new InputFetchError("BASE_INVALID", "base URL is invalid");
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new InputFetchError("BASE_INVALID", "base URL must be credential-free HTTP(S)");
  }
  parsed.pathname = "/";
  parsed.search = "";
  parsed.hash = "";
  return parsed;
}

async function readBounded(response, maxBytes) {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new InputFetchError("BODY_TOO_LARGE", `declared response size ${declared} exceeds ${maxBytes}`);
  }
  if (!response.body) return Buffer.alloc(0);
  const chunks = [];
  let total = 0;
  const reader = response.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new InputFetchError("BODY_TOO_LARGE", `response exceeds ${maxBytes} bytes`);
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks, total);
}

async function fetchFile(base, pathname, timeoutMs, counter) {
  let current = new URL(pathname, base);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    if (current.origin !== base.origin) {
      throw new InputFetchError("CROSS_ORIGIN_REDIRECT", `redirect left ${base.origin}`);
    }
    counter.requests += 1;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      response = await fetch(current, {
        method: "GET",
        redirect: "manual",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
    } catch (error) {
      const code = error?.name === "AbortError" ? "REQUEST_TIMEOUT" : "REQUEST_FAILED";
      throw new InputFetchError(code, `${pathname}: ${code.toLowerCase()}`);
    } finally {
      clearTimeout(timer);
    }
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new InputFetchError("REDIRECT_INVALID", `${pathname}: redirect without location`);
      current = new URL(location, current);
      continue;
    }
    if (response.status !== 200) {
      throw new InputFetchError("HTTP_STATUS", `${pathname}: HTTP ${response.status}`);
    }
    return readBounded(response, MAX_FILE_BYTES);
  }
  throw new InputFetchError("REDIRECT_LIMIT", `${pathname}: too many redirects`);
}

function parseJson(buffer, label) {
  try {
    return JSON.parse(buffer.toString("utf8"));
  } catch {
    throw new InputFetchError("JSON_INVALID", `${label}: invalid JSON`);
  }
}

function parseStocks(buffer) {
  const doc = parseJson(buffer, "stocks.json");
  if (!doc || !Array.isArray(doc.stocks)) {
    throw new InputFetchError("STOCKS_SCHEMA", "stocks.json: stocks array missing");
  }
  if (doc.count !== EXPECTED_UNIVERSE || doc.stocks.length !== EXPECTED_UNIVERSE) {
    throw new InputFetchError("UNIVERSE_MISMATCH", `stocks.json: expected ${EXPECTED_UNIVERSE} stocks`);
  }
  if (String(doc.metricsVersion) !== EXPECTED_METRICS_VERSION) {
    throw new InputFetchError("METRICS_VERSION_MISMATCH", `stocks.json: expected Metrics ${EXPECTED_METRICS_VERSION}`);
  }
  const compactDate = String(doc.asOfBusinessDate ?? "");
  if (!/^\d{8}$/.test(compactDate)) {
    throw new InputFetchError("MARKET_DATE_INVALID", "stocks.json: invalid asOfBusinessDate");
  }
  const marketDate = `${compactDate.slice(0, 4)}-${compactDate.slice(4, 6)}-${compactDate.slice(6, 8)}`;
  const tickers = doc.stocks.map((stock) => String(stock?.ticker ?? ""));
  if (tickers.some((ticker) => !/^\d{6}$/.test(ticker)) || new Set(tickers).size !== EXPECTED_UNIVERSE) {
    throw new InputFetchError("TICKER_IDENTITY_INVALID", "stocks.json: ticker identity is invalid or duplicated");
  }
  return { doc, marketDate, tickers: tickers.sort() };
}

function validatePrice(buffer, ticker, marketDate) {
  const doc = parseJson(buffer, `prices/${ticker}.json`);
  if (String(doc?.ticker ?? "") !== ticker || !Array.isArray(doc?.points) || doc.points.length === 0) {
    throw new InputFetchError("PRICE_SCHEMA", `prices/${ticker}.json: ticker or points invalid`);
  }
  if (Number.isInteger(doc.count) && doc.count !== doc.points.length) {
    throw new InputFetchError("PRICE_COUNT_MISMATCH", `prices/${ticker}.json: count mismatch`);
  }
  const lastDate = String(doc.points.at(-1)?.d ?? "");
  if (lastDate !== marketDate || (doc.to != null && String(doc.to) !== marketDate)) {
    throw new InputFetchError("MIXED_MARKET_DATE", `prices/${ticker}.json: expected ${marketDate}, got ${lastDate || "missing"}`);
  }
  return doc;
}

async function mapConcurrent(items, concurrency, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await fn(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

function envelopeHash(stocksBytes, priceFiles) {
  const hash = createHash("sha256");
  hash.update("stocks.json\0");
  hash.update(stocksBytes);
  for (const file of priceFiles) {
    hash.update(`prices/${file.ticker}.json\0`);
    hash.update(file.bytes);
  }
  return hash.digest("hex");
}

async function existingManifest(finalDir) {
  try {
    return JSON.parse(await readFile(join(finalDir, "manifest.json"), "utf8"));
  } catch {
    return null;
  }
}

export async function collectLiveEnvelope(options = {}) {
  const base = safeBase(options.base ?? "https://ornscore.com");
  const shadowRoot = resolve(options.shadowRoot ?? DEFAULT_SHADOW_ROOT);
  const publicRoot = resolve(ROOT, "public");
  if (isInside(shadowRoot, publicRoot)) {
    throw new InputFetchError("OUTPUT_NOT_PRIVATE", "shadow root must stay outside public/");
  }
  const timeoutMs = Number(options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const concurrency = Number(options.concurrency ?? DEFAULT_CONCURRENCY);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 60_000 ||
      !Number.isInteger(concurrency) || concurrency < 1 || concurrency > 24) {
    throw new InputFetchError("BOUNDS_INVALID", "timeout or concurrency is outside the allowed range");
  }

  const counter = { requests: 0 };
  const stocksBytes = await fetchFile(base, "/data/stocks.json", timeoutMs, counter);
  const { marketDate, tickers } = parseStocks(stocksBytes);
  const priceFiles = await mapConcurrent(tickers, concurrency, async (ticker) => {
    const bytes = await fetchFile(base, `/data/prices/${ticker}.json`, timeoutMs, counter);
    validatePrice(bytes, ticker, marketDate);
    return { ticker, bytes };
  });
  const totalBytes = stocksBytes.length + priceFiles.reduce((sum, item) => sum + item.bytes.length, 0);
  if (totalBytes > MAX_TOTAL_BYTES) {
    throw new InputFetchError("TOTAL_TOO_LARGE", `envelope exceeds ${MAX_TOTAL_BYTES} bytes`);
  }
  const hash = envelopeHash(stocksBytes, priceFiles);
  const finalDir = join(shadowRoot, "live-public", marketDate);
  const baseResult = {
    schema: "metrics251.live-envelope.v1",
    verdict: "PASS",
    reason: options.noWrite ? "VALIDATED_NO_WRITE" : "WRITTEN",
    ok: true,
    marketDate,
    metricsVersion: EXPECTED_METRICS_VERSION,
    stockCount: EXPECTED_UNIVERSE,
    fileCount: EXPECTED_UNIVERSE + 1,
    totalBytes,
    requestCount: counter.requests,
    envelopeHash: hash,
    dataDir: relative(ROOT, finalDir),
    writtenPaths: [],
    reused: false,
    noWrite: Boolean(options.noWrite),
  };
  if (options.noWrite) return baseResult;

  const prior = await existingManifest(finalDir);
  if (prior) {
    if (prior.envelopeHash !== hash) {
      throw new InputFetchError("SAME_DATE_CONFLICT", `${marketDate}: existing live envelope has a different hash`);
    }
    return { ...baseResult, reason: "REUSED", reused: true };
  }
  if (existsSync(finalDir)) {
    throw new InputFetchError("OUTPUT_INCOMPLETE", `${marketDate}: existing envelope has no valid manifest`);
  }

  const tempParent = join(shadowRoot, "tmp");
  await mkdir(tempParent, { recursive: true });
  const tempDir = await mkdtemp(join(tempParent, "live-envelope-"));
  try {
    await mkdir(join(tempDir, "prices"), { recursive: true });
    await writeFile(join(tempDir, "stocks.json"), stocksBytes);
    for (const file of priceFiles) {
      await writeFile(join(tempDir, "prices", `${file.ticker}.json`), file.bytes);
    }
    const manifest = {
      schema: "metrics251.live-envelope-manifest.v1",
      sourceBase: base.origin,
      marketDate,
      metricsVersion: EXPECTED_METRICS_VERSION,
      stockCount: EXPECTED_UNIVERSE,
      fileCount: EXPECTED_UNIVERSE + 1,
      totalBytes,
      envelopeHash: hash,
    };
    await writeFile(join(tempDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
    await mkdir(dirname(finalDir), { recursive: true });
    await rename(tempDir, finalDir);
  } catch (error) {
    await rm(tempDir, { recursive: true, force: true });
    throw error;
  }
  return { ...baseResult, writtenPaths: [relative(ROOT, finalDir)] };
}

function argValue(argv, flag, fallback) {
  const index = argv.indexOf(flag);
  return index >= 0 && index + 1 < argv.length ? argv[index + 1] : fallback;
}

async function main(argv = process.argv.slice(2)) {
  const jsonMode = argv.includes("--json");
  try {
    const result = await collectLiveEnvelope({
      base: argValue(argv, "--base", "https://ornscore.com"),
      shadowRoot: argValue(argv, "--shadow-root", DEFAULT_SHADOW_ROOT),
      timeoutMs: Number(argValue(argv, "--timeout-ms", DEFAULT_TIMEOUT_MS)),
      concurrency: Number(argValue(argv, "--concurrency", DEFAULT_CONCURRENCY)),
      noWrite: argv.includes("--no-write"),
    });
    if (jsonMode) console.log(JSON.stringify(result, null, 2));
    else console.log(`metrics251 live envelope: ${result.reason} ${result.marketDate} (${result.stockCount} stocks)`);
    return 0;
  } catch (error) {
    const result = {
      schema: "metrics251.live-envelope.v1",
      verdict: "FAIL",
      reason: error instanceof InputFetchError ? error.code : "INTERNAL_ERROR",
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
      writtenPaths: [],
    };
    if (jsonMode) console.log(JSON.stringify(result, null, 2));
    else console.error(`metrics251 live envelope: FAIL ${result.reason}: ${result.detail}`);
    return 2;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  process.exitCode = await main();
}
