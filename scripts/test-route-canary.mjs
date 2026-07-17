// Focused self-test for the read-only route canary (scripts/verify-route-canary.mjs,
// Slice B of docs/ornscore-service-continuity-2026-07-17.md).
//
// It proves the two behaviours a bounded probe must get right:
//   (1) EVERY failure family is classified correctly and kept distinct —
//       timeout, dns_tls_http, content, and stale_marker — across status,
//       redirect, title, canonical, date, metrics-version, size, and marker cases.
//   (2) EVERY bound actually bounds — per-request timeout, redirect hops, response
//       bytes, request count, and total duration — none can run away.
//
// It is deterministic and NEVER touches a live service: it stands up a TASK-OWNED
// loopback mock HTTP server on 127.0.0.1 (ephemeral port), drives the canary against
// it, and at the end STOPS the server and proves it is stopped (not listening, and a
// fresh request to it now fails with the transport class). A second short-lived
// server is used only to obtain a guaranteed-closed port for the dns_tls_http case.

import http from "node:http";
import {
  runCanary,
  evaluateResponse,
  fetchBounded,
  classifyFetchError,
  extractBuildMarker,
  hasCanonical,
  hasNonEmptyTitle,
  locationMatches,
  buildExpected,
  deriveBusinessDate,
  DEFAULT_BOUNDS,
  FAILURE_CLASSES,
} from "./verify-route-canary.mjs";

let failed = 0;
function check(name, cond) {
  if (cond) {
    console.log(`  ok  ${name}`);
  } else {
    failed++;
    console.error(`  FAIL ${name}`);
  }
}

// The expected state the mock pages are built to satisfy.
const EXPECT = { dataDate: "2026.07.16", metricsVersionLabel: "Metrics 2.4", marker: "abc1234" };
const STALE_SHA = "0000000";

// ---------------------------------------------------------------------------
// task-owned loopback mock server
// ---------------------------------------------------------------------------
function page({ title = "오른스코어", canonical = true, date = EXPECT.dataDate, metrics = "Metrics 2.4", marker = EXPECT.marker } = {}) {
  const titleTag = title ? `<title>${title}</title>` : "";
  const canonicalTag = canonical ? `<link rel="canonical" href="https://ornscore.com/"/>` : "";
  const markerAttr = marker ? ` title="코드 ${marker}"` : "";
  return (
    `<!doctype html><html lang="ko"><head>${titleTag}${canonicalTag}</head><body>` +
    `<main>본문</main>` +
    `<footer><span${markerAttr}>데이터 ${date} (목) 장마감</span> · <span>산식 ${metrics}</span></footer>` +
    `</body></html>`
  );
}

function startMock() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    const p = url.pathname;
    const html = (body, status = 200) => {
      res.writeHead(status, { "content-type": "text/html; charset=utf-8" });
      res.end(body);
    };
    switch (p) {
      case "/":
        return html(page());
      case "/stale":
        return html(page({ marker: STALE_SHA }));
      case "/nomarker":
        return html(page({ marker: null }));
      case "/notitle":
        return html(page({ title: "" }));
      case "/nocanonical":
        return html(page({ canonical: false }));
      case "/nodate":
        return html(page({ date: "1999.01.01" }));
      case "/nometrics":
        return html(page({ metrics: "Metrics 9.9" }));
      case "/redirect":
        res.writeHead(302, { location: "/" });
        return res.end();
      case "/loop":
        res.writeHead(302, { location: "/loop" });
        return res.end();
      case "/big":
        res.writeHead(200, { "content-type": "text/html" });
        return res.end("x".repeat(50_000));
      case "/slow":
        // Delay past a short per-request timeout, then respond (the client aborts first).
        setTimeout(() => {
          if (!res.writableEnded) html(page());
        }, 1500);
        return undefined;
      default:
        return html("<html><body>not found</body></html>", 404);
    }
  });
  return new Promise((res) => {
    server.listen(0, "127.0.0.1", () => res(server));
  });
}

function closeServer(server) {
  return new Promise((res) => server.close(() => res()));
}

// A guaranteed-closed loopback port: listen, capture the port, close immediately.
async function closedPort() {
  const s = await new Promise((res) => {
    const srv = http.createServer();
    srv.listen(0, "127.0.0.1", () => res(srv));
  });
  const port = s.address().port;
  await closeServer(s);
  return port;
}

async function run(route, resp, expected = EXPECT) {
  return evaluateResponse({ __maxHops: DEFAULT_BOUNDS.maxRedirects, ...route }, resp, expected);
}

async function main() {
  // -------------------------------------------------------------------------
  // §0  pure helpers (no network)
  // -------------------------------------------------------------------------
  check("§0a classifyFetchError: AbortError -> timeout", classifyFetchError({ name: "AbortError" }) === "timeout");
  check("§0b classifyFetchError: ENOTFOUND -> dns_tls_http", classifyFetchError({ cause: { code: "ENOTFOUND" } }) === "dns_tls_http");
  check("§0c classifyFetchError: ECONNREFUSED -> dns_tls_http", classifyFetchError({ cause: { code: "ECONNREFUSED" } }) === "dns_tls_http");
  check("§0d classifyFetchError: UND_ERR_CONNECT_TIMEOUT -> timeout", classifyFetchError({ cause: { code: "UND_ERR_CONNECT_TIMEOUT" } }) === "timeout");
  check("§0e extractBuildMarker reads the footer title marker", extractBuildMarker(page()) === "abc1234");
  check("§0f extractBuildMarker returns null when absent", extractBuildMarker(page({ marker: null })) === null);
  check("§0g hasNonEmptyTitle true/false", hasNonEmptyTitle(page()) && !hasNonEmptyTitle(page({ title: "" })));
  check("§0h hasCanonical true/false", hasCanonical(page()) && !hasCanonical(page({ canonical: false })));
  check("§0i locationMatches origin/query insensitive", locationMatches("http://x/login?next=/w", "/login") && !locationMatches("/other", "/login"));
  check("§0j deriveBusinessDate normalizes YYYYMMDD + ISO", deriveBusinessDate("20260716") === "20260716" && deriveBusinessDate("2026-07-16T00:00:00Z") === "20260716");
  check("§0k buildExpected derives date+metrics from local stocks.json", (() => {
    const e = buildExpected("public/data/stocks.json", "deadbee");
    return /^\d{4}\.\d{2}\.\d{2}$/.test(e.dataDate) && e.metricsVersionLabel === "Metrics 2.4" && e.marker === "deadbee";
  })());
  check("§0l FAILURE_CLASSES is exactly the four families", FAILURE_CLASSES.length === 4 && ["timeout", "dns_tls_http", "content", "stale_marker"].every((c) => FAILURE_CLASSES.includes(c)));

  const server = await startMock();
  const base = `http://127.0.0.1:${server.address().port}`;
  let serverStoppedProven = false;

  try {
    // -----------------------------------------------------------------------
    // §1  happy path — a good page passes every check
    // -----------------------------------------------------------------------
    {
      const rep = await runCanary({
        base,
        routes: [{ path: "/", expectTitle: true, expectCanonical: true, expectDate: true, expectMetricsVersion: true, expectMarker: true }],
        expected: EXPECT,
      });
      check("§1a valid route reports OK", rep.summary.failed === 0 && rep.routes[0].class === "ok" && rep.routes[0].status === 200);
    }

    // -----------------------------------------------------------------------
    // §2  content-class failures (status / title / canonical / date / metrics / marker-absent)
    // -----------------------------------------------------------------------
    {
      const rep = await runCanary({
        base,
        routes: [
          { path: "/notfound", expectTitle: true }, // 404
          { path: "/notitle", expectTitle: true },
          { path: "/nocanonical", expectCanonical: true },
          { path: "/nodate", expectDate: true },
          { path: "/nometrics", expectMetricsVersion: true },
          { path: "/nomarker", expectMarker: true },
        ],
        expected: EXPECT,
      });
      const cls = Object.fromEntries(rep.routes.map((r) => [r.path, r]));
      check("§2a 404 -> content (status)", cls["/notfound"].class === "content" && cls["/notfound"].failures.some((f) => f.message.includes("status 404")));
      check("§2b missing title -> content", cls["/notitle"].failures.some((f) => f.class === "content" && f.message.includes("<title>")));
      check("§2c missing canonical -> content", cls["/nocanonical"].failures.some((f) => f.class === "content" && f.message.includes("canonical")));
      check("§2d wrong date -> content", cls["/nodate"].failures.some((f) => f.class === "content" && f.message.includes("data date")));
      check("§2e wrong metrics version -> content", cls["/nometrics"].failures.some((f) => f.class === "content" && f.message.includes("metrics version")));
      check("§2f absent marker -> content (not stale)", cls["/nomarker"].failures.some((f) => f.class === "content" && f.message.includes("marker absent")) && !cls["/nomarker"].failures.some((f) => f.class === "stale_marker"));
    }

    // -----------------------------------------------------------------------
    // §3  stale_marker is DISTINCT from a missing marker
    // -----------------------------------------------------------------------
    {
      const rep = await runCanary({ base, routes: [{ path: "/stale", expectMarker: true }], expected: EXPECT });
      const r = rep.routes[0];
      check("§3a stale marker -> stale_marker class (not content)", r.class === "stale_marker" && r.failures.every((f) => f.class === "stale_marker"));
      check("§3b stale_marker message names both markers", r.failures[0].message.includes(STALE_SHA) && r.failures[0].message.includes(EXPECT.marker));
      check("§3c marker check is skipped when no expected marker supplied", (await runCanary({ base, routes: [{ path: "/stale", expectMarker: true }], expected: { ...EXPECT, marker: null } })).summary.failed === 0);
    }

    // -----------------------------------------------------------------------
    // §4  redirects
    // -----------------------------------------------------------------------
    {
      const unexpected = await runCanary({ base, routes: [{ path: "/redirect", expectTitle: true }], expected: EXPECT });
      check("§4a unexpected redirect -> content", unexpected.routes[0].class === "content" && unexpected.routes[0].failures.some((f) => f.message.includes("unexpected redirect")));

      const expected = await runCanary({ base, routes: [{ path: "/redirect", expectRedirectTo: "/" }], expected: EXPECT });
      check("§4b expected redirect to the right place -> OK", expected.summary.failed === 0 && expected.routes[0].hops === 1);

      const wrongTarget = await runCanary({ base, routes: [{ path: "/redirect", expectRedirectTo: "/somewhere-else" }], expected: EXPECT });
      check("§4c redirect to the wrong place -> content", wrongTarget.routes[0].failures.some((f) => f.class === "content" && f.message.includes("!= expected")));

      const loop = await runCanary({ base, routes: [{ path: "/loop", expectRedirectTo: "/loop" }], expected: EXPECT, bounds: { maxRedirects: 3 } });
      check("§4d redirect loop is bounded -> content (budget exceeded)", loop.routes[0].class === "content" && loop.routes[0].failures.some((f) => f.message.includes("redirect budget exceeded")) && loop.routes[0].hops === 4);
    }

    // -----------------------------------------------------------------------
    // §5  timeout family (per-request budget)
    // -----------------------------------------------------------------------
    {
      const rep = await runCanary({ base, routes: [{ path: "/slow", expectTitle: true }], expected: EXPECT, bounds: { perRequestTimeoutMs: 250 } });
      check("§5a slow response -> timeout class", rep.routes[0].class === "timeout" && rep.routes[0].failures[0].class === "timeout");
    }

    // -----------------------------------------------------------------------
    // §6  response-size bound
    // -----------------------------------------------------------------------
    {
      const rep = await runCanary({ base, routes: [{ path: "/big", expectTitle: true }], expected: EXPECT, bounds: { maxResponseBytes: 1000 } });
      check("§6a oversized body -> content (truncated)", rep.routes[0].failures.some((f) => f.class === "content" && f.message.includes("size budget")));
      // The bounded reader must have stopped well before the full 50 KB body.
      const resp = await fetchBounded(`${base}/big`, { ...DEFAULT_BOUNDS, maxResponseBytes: 1000 }, { requests: 0 });
      check("§6b bounded reader stops near the byte cap", resp.truncated === true && resp.bytes <= 1000 + 65_536);
    }

    // -----------------------------------------------------------------------
    // §7  request-count + total-duration bounds
    // -----------------------------------------------------------------------
    {
      const rep = await runCanary({ base, routes: [{ path: "/" }, { path: "/" }, { path: "/" }], expected: EXPECT, bounds: { maxRequests: 1 } });
      const skipped = rep.routes.filter((r) => r.skipped);
      check("§7a request-count bound skips excess routes as content", skipped.length === 2 && skipped.every((r) => r.class === "content" && r.failures[0].message.includes("request budget")));

      const durRep = await runCanary({ base, routes: [{ path: "/slow", expectTitle: true }, { path: "/" }, { path: "/" }], expected: EXPECT, bounds: { perRequestTimeoutMs: 60, totalDurationMs: 10 } });
      check("§7b total-duration bound skips later routes as timeout", durRep.routes.slice(1).every((r) => r.skipped && r.class === "timeout"));
    }

    // -----------------------------------------------------------------------
    // §8  dns_tls_http family — a guaranteed-closed port
    // -----------------------------------------------------------------------
    {
      const port = await closedPort();
      const rep = await runCanary({ base: `http://127.0.0.1:${port}`, routes: [{ path: "/", expectTitle: true }], expected: EXPECT, bounds: { perRequestTimeoutMs: 1000 } });
      check("§8a connection refused -> dns_tls_http class", rep.routes[0].class === "dns_tls_http" && rep.routes[0].status === null);
    }

    // -----------------------------------------------------------------------
    // §9  JSON evidence is stable + carries no wall-clock timestamps
    // -----------------------------------------------------------------------
    {
      const a = await runCanary({ base, routes: [{ path: "/", expectTitle: true, expectDate: true }], expected: EXPECT });
      const b = await runCanary({ base, routes: [{ path: "/", expectTitle: true, expectDate: true }], expected: EXPECT });
      // Drop the inherently variable `bytes` field before comparing structural stability.
      const strip = (rep) => JSON.stringify({ ...rep, routes: rep.routes.map((r) => ({ ...r, bytes: 0 })) });
      check("§9a two runs produce byte-identical structural evidence", strip(a) === strip(b));
      check("§9b evidence carries no timestamp field", !/\b\d{13}\b/.test(strip(a).replace(String(server.address().port), "")));
    }
  } finally {
    // -----------------------------------------------------------------------
    // §10  STOP the task-owned server and PROVE it is stopped
    // -----------------------------------------------------------------------
    await closeServer(server);
    check("§10a mock server reports not listening after close", server.listening === false);
    const rep = await runCanary({ base, routes: [{ path: "/", expectTitle: true }], expected: EXPECT, bounds: { perRequestTimeoutMs: 1000 } });
    check("§10b a request to the stopped server now fails with the transport class", rep.routes[0].class === "dns_tls_http");
    serverStoppedProven = true;
  }

  console.log("");
  if (!serverStoppedProven) {
    console.error("ROUTE-CANARY SELF-TEST FAILED: could not prove the loopback server was stopped.");
    process.exit(1);
  }
  if (failed > 0) {
    console.error(`ROUTE-CANARY SELF-TEST FAILED (${failed} check${failed === 1 ? "" : "s"}).`);
    process.exit(1);
  }
  console.log("ROUTE-CANARY SELF-TEST PASSED. Four failure classes + every bound verified; task-owned loopback server stopped.");
  process.exit(0);
}

main().catch((err) => {
  console.error("ROUTE-CANARY SELF-TEST CRASHED:", err);
  process.exit(1);
});
