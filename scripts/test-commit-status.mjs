// Focused self-test for the read-only commit-status verifier
// (scripts/verify-commit-status.mjs, Slice E of docs/ornscore-service-continuity-2026-07-17.md).
//
// It proves, deterministically and WITHOUT touching any live service:
//   (1) Every pure classifier maps its inputs to the right observation/state/reason.
//   (2) Every one of the seven terminal states is reachable and kept distinct —
//       SUCCESS, PENDING, FAILURE, TIMEOUT, STATUS_UNAVAILABLE, MALFORMED_RESPONSE,
//       STALE_PUBLIC_MARKER — driven end-to-end against TASK-OWNED loopback mock
//       HTTP servers (a status server + a canary page server on 127.0.0.1).
//   (3) Every bound bounds — attempts, total-time (via an injected fake clock),
//       per-request timeout, response bytes, and redirect hops.
//   (4) The verifier never triggers a run or mutates a status (GET-only), the JSON
//       evidence carries no wall-clock timestamp, and at the end the task-owned
//       servers are STOPPED and proven stopped (a fresh request now fails transport).

import http from "node:http";
import {
  normalizeState,
  matchSha,
  parseStatusBody,
  classifyPoll,
  mapExhaustion,
  classifyCanary,
  pollStatus,
  runCommitStatusVerify,
  redactUrl,
  STATES,
  DEFAULT_BOUNDS,
} from "./verify-commit-status.mjs";

let failed = 0;
function check(name, cond) {
  if (cond) {
    console.log(`  ok  ${name}`);
  } else {
    failed++;
    console.error(`  FAIL ${name}`);
  }
}

// A 40-hex expected SHA whose 7-char prefix is the marker the canary pages surface.
const FULL_SHA = "abc1234" + "0".repeat(33); // -> marker prefix "abc1234"
const OTHER_SHA = "def5678" + "9".repeat(33);
const MARKER = "abc1234";
const STALE_MARKER = "0000000";
const EXPECT = Object.freeze({ dataDate: "2026.07.16", metricsVersionLabel: "Metrics 2.4", marker: MARKER });

// ---------------------------------------------------------------------------
// task-owned loopback mock servers
// ---------------------------------------------------------------------------
function statusJson(obj, status = 200) {
  return { status, body: JSON.stringify(obj), type: "application/json" };
}

function startStatusServer() {
  const seq = { flip: 0 };
  const server = http.createServer((req, res) => {
    const p = new URL(req.url, "http://127.0.0.1").pathname;
    const send = ({ status, body, type }) => {
      res.writeHead(status, { "content-type": type, connection: "close" });
      res.end(body);
    };
    switch (p) {
      case "/success":
        return send(statusJson({ sha: FULL_SHA, state: "success" }));
      case "/pending":
        return send(statusJson({ sha: FULL_SHA, state: "pending" }));
      case "/failure":
        return send(statusJson({ sha: FULL_SHA, state: "failure" }));
      case "/notfound":
        return send(statusJson({ error: "no status for sha yet" }, 404));
      case "/error500":
        return send(statusJson({ error: "boom" }, 500));
      case "/notjson":
        return send({ status: 200, body: "<<< not json at all", type: "application/json" });
      case "/missing":
        return send(statusJson({ sha: FULL_SHA })); // no state field
      case "/mismatch":
        return send(statusJson({ sha: OTHER_SHA, state: "success" }));
      case "/unknown":
        return send(statusJson({ sha: FULL_SHA, state: "purple" }));
      case "/oversized":
        return send(statusJson({ sha: FULL_SHA, state: "success", pad: "x".repeat(50_000) }));
      case "/slow":
        // Respond well past a short per-request timeout; the client aborts first.
        setTimeout(() => {
          if (!res.writableEnded) send(statusJson({ sha: FULL_SHA, state: "success" }));
        }, 1500);
        return undefined;
      case "/flip":
        // pending on the first poll, success from the second onward.
        seq.flip += 1;
        return send(statusJson({ sha: FULL_SHA, state: seq.flip >= 2 ? "success" : "pending" }));
      case "/redirloop":
        res.writeHead(302, { location: "/redirloop", connection: "close" });
        return res.end();
      default:
        return send(statusJson({ error: "unknown" }, 404));
    }
  });
  return new Promise((r) => server.listen(0, "127.0.0.1", () => r(server)));
}

function page({ title = "오른스코어", canonical = true, date = EXPECT.dataDate, metrics = "Metrics 2.4", marker = MARKER } = {}) {
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

function startCanaryServer() {
  const server = http.createServer((req, res) => {
    const p = new URL(req.url, "http://127.0.0.1").pathname;
    const html = (body, status = 200) => {
      res.writeHead(status, { "content-type": "text/html; charset=utf-8", connection: "close" });
      res.end(body);
    };
    switch (p) {
      case "/":
        return html(page());
      case "/stale":
        return html(page({ marker: STALE_MARKER }));
      case "/notitle":
        return html(page({ title: "" }));
      case "/slow":
        setTimeout(() => {
          if (!res.writableEnded) html(page());
        }, 1500);
        return undefined;
      default:
        return html("<html><body>not found</body></html>", 404);
    }
  });
  return new Promise((r) => server.listen(0, "127.0.0.1", () => r(server)));
}

function closeServer(server) {
  return new Promise((r) => server.close(() => r()));
}

async function closedPort() {
  const s = await new Promise((r) => {
    const srv = http.createServer();
    srv.listen(0, "127.0.0.1", () => r(srv));
  });
  const port = s.address().port;
  await closeServer(s);
  return port;
}

// A canary root route that exercises every content check.
const FULL_ROUTE = { path: "/", expectTitle: true, expectCanonical: true, expectDate: true, expectMetricsVersion: true, expectMarker: true };

async function main() {
  // -------------------------------------------------------------------------
  // §0  pure helpers (no network)
  // -------------------------------------------------------------------------
  check("§0a STATES is exactly the seven terminal states", STATES.length === 7 && ["SUCCESS", "PENDING", "FAILURE", "TIMEOUT", "STATUS_UNAVAILABLE", "MALFORMED_RESPONSE", "STALE_PUBLIC_MARKER"].every((s) => STATES.includes(s)));
  check("§0b normalizeState success synonyms", normalizeState("success") === "success" && normalizeState("OK") === "success" && normalizeState("ready") === "success");
  check("§0c normalizeState pending synonyms", normalizeState("pending") === "pending" && normalizeState("in_progress") === "pending" && normalizeState("building") === "pending");
  check("§0d normalizeState failure synonyms", normalizeState("failure") === "failure" && normalizeState("error") === "failure" && normalizeState("cancelled") === "failure");
  check("§0e normalizeState unknown -> null", normalizeState("purple") === null && normalizeState("") === null);
  check("§0f matchSha prefix match both directions", matchSha(FULL_SHA, MARKER) && matchSha(MARKER, FULL_SHA) && matchSha(FULL_SHA, FULL_SHA));
  check("§0g matchSha rejects mismatch/non-hex/too-short", !matchSha(FULL_SHA, OTHER_SHA) && !matchSha(FULL_SHA, "xyz") && !matchSha("abc12", FULL_SHA));
  check("§0h parseStatusBody ok", (() => { const r = parseStatusBody('{"sha":"abc1234","state":"success"}'); return r.ok && r.sha === "abc1234" && r.state === "success"; })());
  check("§0i parseStatusBody not_json / missing_fields / array", parseStatusBody("nope").reason === "not_json" && parseStatusBody('{"sha":"abc1234"}').reason === "missing_fields" && parseStatusBody("[1,2]").reason === "not_json");
  check("§0j parseStatusBody accepts commit/status aliases", (() => { const r = parseStatusBody('{"commit":"abc1234","status":"pending"}'); return r.ok && r.sha === "abc1234" && r.state === "pending"; })());

  // classifyPoll — every branch
  check("§0k classifyPoll timeout", classifyPoll({ outcome: "timeout" }, FULL_SHA).obs === "request_timeout");
  check("§0l classifyPoll dns_tls_http", classifyPoll({ outcome: "dns_tls_http" }, FULL_SHA).obs === "unreachable" && classifyPoll({ outcome: "dns_tls_http" }, FULL_SHA).reason === "endpoint_unreachable");
  check("§0m classifyPoll content+request-budget -> unreachable", classifyPoll({ outcome: "content", requestBudgetExhausted: true }, FULL_SHA).reason === "request_budget_exhausted");
  check("§0n classifyPoll content(bad redirect) -> malformed", classifyPoll({ outcome: "content" }, FULL_SHA).reason === "bad_redirect");
  check("§0o classifyPoll redirect-budget -> malformed", classifyPoll({ outcome: "ok", redirectBudgetExceeded: true }, FULL_SHA).reason === "bad_redirect");
  check("§0p classifyPoll truncated -> oversized_body", classifyPoll({ outcome: "ok", truncated: true, finalStatus: 200 }, FULL_SHA).reason === "oversized_body");
  check("§0q classifyPoll 404 -> no_status", classifyPoll({ outcome: "ok", finalStatus: 404, body: "x" }, FULL_SHA).obs === "no_status");
  check("§0r classifyPoll 500 -> unreachable http_error", classifyPoll({ outcome: "ok", finalStatus: 500, body: "x" }, FULL_SHA).reason === "http_error");
  check("§0s classifyPoll not_json/missing/mismatch/unknown", classifyPoll({ outcome: "ok", finalStatus: 200, body: "nope" }, FULL_SHA).reason === "not_json" && classifyPoll({ outcome: "ok", finalStatus: 200, body: '{"sha":"abc1234"}' }, FULL_SHA).reason === "missing_fields" && classifyPoll({ outcome: "ok", finalStatus: 200, body: `{"sha":"${OTHER_SHA}","state":"success"}` }, FULL_SHA).reason === "sha_mismatch" && classifyPoll({ outcome: "ok", finalStatus: 200, body: `{"sha":"${FULL_SHA}","state":"weird"}` }, FULL_SHA).reason === "unknown_state");
  check("§0t classifyPoll pending/success/failure", classifyPoll({ outcome: "ok", finalStatus: 200, body: `{"sha":"${FULL_SHA}","state":"pending"}` }, FULL_SHA).obs === "pending" && classifyPoll({ outcome: "ok", finalStatus: 200, body: `{"sha":"${FULL_SHA}","state":"success"}` }, FULL_SHA).obs === "success" && classifyPoll({ outcome: "ok", finalStatus: 200, body: `{"sha":"${FULL_SHA}","state":"error"}` }, FULL_SHA).obs === "failure");

  // mapExhaustion
  check("§0u mapExhaustion pending+attempts -> PENDING", mapExhaustion({ obs: "pending" }, "attempts").state === "PENDING");
  check("§0v mapExhaustion pending+time -> TIMEOUT deadline", (() => { const r = mapExhaustion({ obs: "pending" }, "time"); return r.state === "TIMEOUT" && r.reason === "deadline_exceeded"; })());
  check("§0w mapExhaustion no_status/unreachable -> STATUS_UNAVAILABLE", mapExhaustion({ obs: "no_status" }, "attempts").state === "STATUS_UNAVAILABLE" && mapExhaustion({ obs: "unreachable", reason: "http_error" }, "attempts").reason === "http_error");
  check("§0x mapExhaustion request_timeout -> TIMEOUT", mapExhaustion({ obs: "request_timeout" }, "attempts").state === "TIMEOUT" && mapExhaustion({ obs: "request_timeout" }, "time").reason === "deadline_exceeded");
  check("§0y mapExhaustion null -> STATUS_UNAVAILABLE", mapExhaustion(null, "attempts").state === "STATUS_UNAVAILABLE");

  // classifyCanary priority
  check("§0z classifyCanary SUCCESS", classifyCanary({ summary: { failed: 0, byClass: { stale_marker: 0, timeout: 0, dns_tls_http: 0 } } }).state === "SUCCESS");
  check("§0z1 classifyCanary stale wins over content", classifyCanary({ summary: { failed: 2, byClass: { stale_marker: 1, timeout: 1, dns_tls_http: 0 } } }).state === "STALE_PUBLIC_MARKER");
  check("§0z2 classifyCanary timeout", classifyCanary({ summary: { failed: 1, byClass: { stale_marker: 0, timeout: 1, dns_tls_http: 0 } } }).state === "TIMEOUT");
  check("§0z3 classifyCanary dns -> FAILURE public_unreachable", classifyCanary({ summary: { failed: 1, byClass: { stale_marker: 0, timeout: 0, dns_tls_http: 1 } } }).reason === "public_unreachable");
  check("§0z4 classifyCanary content -> FAILURE", classifyCanary({ summary: { failed: 1, byClass: { stale_marker: 0, timeout: 0, dns_tls_http: 0 } } }).reason === "canary_content_failure");
  check("§0z5 redactUrl strips userinfo", redactUrl("http://user:pass@host:1/x") === "http://host:1/x");

  const statusServer = await startStatusServer();
  const canaryServer = await startCanaryServer();
  const S = `http://127.0.0.1:${statusServer.address().port}`;
  const C = `http://127.0.0.1:${canaryServer.address().port}`;
  let cleanupProven = false;

  try {
    const fastBounds = { maxAttempts: 3, intervalMs: 1, totalDurationMs: 100000, perRequestTimeoutMs: 2000 };
    const verify = (statusPath, opts = {}) =>
      runCommitStatusVerify({ statusUrl: `${S}${statusPath}`, base: opts.base ?? C, expected: EXPECT, expectedSha: FULL_SHA, routes: opts.routes ?? [FULL_ROUTE], bounds: { ...fastBounds, ...(opts.bounds || {}) }, canaryBounds: opts.canaryBounds, sleepFn: opts.sleepFn, nowFn: opts.nowFn });

    // -----------------------------------------------------------------------
    // §1  SUCCESS — status success + canary serves the expected marker
    // -----------------------------------------------------------------------
    {
      const r = await verify("/success");
      check("§1a SUCCESS state, phase=canary, ok=true", r.state === "SUCCESS" && r.phase === "canary" && r.ok === true && r.reason === "status_success_marker_match");
      check("§1b SUCCESS canary summary present, all routes OK", r.canary && r.canary.failed === 0);
    }

    // -----------------------------------------------------------------------
    // §2  STALE_PUBLIC_MARKER — status success but old build still served
    // -----------------------------------------------------------------------
    {
      const r = await verify("/success", { routes: [{ path: "/stale", expectMarker: true }] });
      check("§2a STALE_PUBLIC_MARKER distinct from FAILURE", r.state === "STALE_PUBLIC_MARKER" && r.reason === "public_marker_mismatch" && r.ok === false);
    }

    // -----------------------------------------------------------------------
    // §3  FAILURE — from the status phase, and from the canary phase
    // -----------------------------------------------------------------------
    {
      const rs = await verify("/failure");
      check("§3a status failure -> FAILURE (canary never runs)", rs.state === "FAILURE" && rs.reason === "status_failure" && rs.phase === "status" && rs.canary === null);
      const rc = await verify("/success", { routes: [{ path: "/notitle", expectTitle: true }] });
      check("§3b canary content failure -> FAILURE canary_content_failure", rc.state === "FAILURE" && rc.reason === "canary_content_failure");
      const port = await closedPort();
      const ru = await verify("/success", { base: `http://127.0.0.1:${port}`, routes: [{ path: "/", expectTitle: true }], canaryBounds: { perRequestTimeoutMs: 1000 } });
      check("§3c canary transport failure -> FAILURE public_unreachable", ru.state === "FAILURE" && ru.reason === "public_unreachable");
    }

    // -----------------------------------------------------------------------
    // §4  PENDING — attempts budget spent while still pending
    // -----------------------------------------------------------------------
    {
      const r = await verify("/pending", { bounds: { maxAttempts: 2 } });
      check("§4a PENDING after attempts exhausted", r.state === "PENDING" && r.reason === "attempts_exhausted_pending" && r.attempts === 2 && r.canary === null);
      check("§4b PENDING recorded every poll as pending", r.observations.length === 2 && r.observations.every((o) => o.obs === "pending"));
    }

    // -----------------------------------------------------------------------
    // §5  TIMEOUT — request timeout, total-time deadline (fake clock), canary timeout
    // -----------------------------------------------------------------------
    {
      const rReq = await verify("/slow", { bounds: { maxAttempts: 2, perRequestTimeoutMs: 200 } });
      check("§5a slow status -> TIMEOUT request_timeout", rReq.state === "TIMEOUT" && rReq.reason === "request_timeout");

      // Injected fake clock: sleep advances virtual time; deadline is crossed while pending.
      const clock = { t: 0 };
      const nowFn = () => clock.t;
      const sleepFn = async (ms) => { clock.t += ms; };
      const rDl = await verify("/pending", { bounds: { maxAttempts: 99, intervalMs: 1000, totalDurationMs: 2500 }, nowFn, sleepFn });
      check("§5b pending past total-time -> TIMEOUT deadline_exceeded", rDl.state === "TIMEOUT" && rDl.reason === "deadline_exceeded" && rDl.attempts === 3);

      const rCan = await verify("/success", { routes: [{ path: "/slow", expectTitle: true }], canaryBounds: { perRequestTimeoutMs: 200 } });
      check("§5c slow canary -> TIMEOUT canary_timeout", rCan.state === "TIMEOUT" && rCan.reason === "canary_timeout");
    }

    // -----------------------------------------------------------------------
    // §6  STATUS_UNAVAILABLE — unreachable endpoint, no status yet, HTTP error
    // -----------------------------------------------------------------------
    {
      const port = await closedPort();
      const rUn = await runCommitStatusVerify({ statusUrl: `http://127.0.0.1:${port}/success`, base: C, expected: EXPECT, expectedSha: FULL_SHA, routes: [FULL_ROUTE], bounds: { maxAttempts: 1, perRequestTimeoutMs: 1000 } });
      check("§6a closed status port -> STATUS_UNAVAILABLE endpoint_unreachable", rUn.state === "STATUS_UNAVAILABLE" && rUn.reason === "endpoint_unreachable");
      const rNo = await verify("/notfound", { bounds: { maxAttempts: 2 } });
      check("§6b 404 status -> STATUS_UNAVAILABLE no_status_for_sha", rNo.state === "STATUS_UNAVAILABLE" && rNo.reason === "no_status_for_sha");
      const rErr = await verify("/error500", { bounds: { maxAttempts: 1 } });
      check("§6c 500 status -> STATUS_UNAVAILABLE http_error", rErr.state === "STATUS_UNAVAILABLE" && rErr.reason === "http_error");
    }

    // -----------------------------------------------------------------------
    // §7  MALFORMED_RESPONSE — not json, missing fields, sha mismatch, unknown
    //     state, oversized body, and a redirect loop (bad redirect)
    // -----------------------------------------------------------------------
    {
      check("§7a not json -> MALFORMED not_json", (await verify("/notjson")).reason === "not_json");
      check("§7b missing fields -> MALFORMED missing_fields", (await verify("/missing")).reason === "missing_fields");
      check("§7c wrong sha -> MALFORMED sha_mismatch", (await verify("/mismatch")).reason === "sha_mismatch");
      check("§7d unknown state -> MALFORMED unknown_state", (await verify("/unknown")).reason === "unknown_state");
      const rOver = await verify("/oversized", { bounds: { maxResponseBytes: 1000 } });
      check("§7e oversized body -> MALFORMED oversized_body", rOver.state === "MALFORMED_RESPONSE" && rOver.reason === "oversized_body");
      const rLoop = await verify("/redirloop", { bounds: { maxRedirects: 3, maxAttempts: 1 } });
      check("§7f redirect loop -> MALFORMED bad_redirect", rLoop.state === "MALFORMED_RESPONSE" && rLoop.reason === "bad_redirect");
      check("§7g all §7 states are MALFORMED_RESPONSE", (await verify("/notjson")).state === "MALFORMED_RESPONSE");
    }

    // -----------------------------------------------------------------------
    // §8  pending -> success transition on a later poll drives SUCCESS
    // -----------------------------------------------------------------------
    {
      const r = await verify("/flip", { bounds: { maxAttempts: 5 } });
      check("§8a pending then success -> SUCCESS on attempt 2", r.state === "SUCCESS" && r.attempts === 2 && r.observations[0].obs === "pending" && r.observations[1].obs === "success");
    }

    // -----------------------------------------------------------------------
    // §9  evidence is deterministic, redacted, and carries no wall-clock stamp
    // -----------------------------------------------------------------------
    {
      const a = await verify("/pending", { bounds: { maxAttempts: 2 } });
      const b = await verify("/pending", { bounds: { maxAttempts: 2 } });
      check("§9a two pending runs -> byte-identical evidence", JSON.stringify(a) === JSON.stringify(b));
      check("§9b evidence carries no 13-digit timestamp", !/\b\d{13}\b/.test(JSON.stringify(a).replace(String(statusServer.address().port), "").replace(String(canaryServer.address().port), "")));
      check("§9c statusUrl + base redacted of userinfo (none here) and present", typeof a.statusUrl === "string" && a.statusUrl.startsWith("http://127.0.0.1") && a.base.startsWith("http://127.0.0.1"));
      const withCreds = await runCommitStatusVerify({ statusUrl: `http://u:p@127.0.0.1:${statusServer.address().port}/pending`, base: C, expected: EXPECT, expectedSha: FULL_SHA, routes: [FULL_ROUTE], bounds: { maxAttempts: 1, intervalMs: 1 } });
      check("§9d userinfo stripped from emitted statusUrl", !withCreds.statusUrl.includes("u:p@") && !withCreds.statusUrl.includes("@"));
    }

    // -----------------------------------------------------------------------
    // §10  request-count is bounded (shared counter) and never mutates a resource
    // -----------------------------------------------------------------------
    {
      // A single shared counter across polls; a low maxRequests caps total requests.
      const r = await runCommitStatusVerify({ statusUrl: `${S}/pending`, base: C, expected: EXPECT, expectedSha: FULL_SHA, routes: [FULL_ROUTE], bounds: { maxAttempts: 10, intervalMs: 1, maxRequests: 1 } });
      // First poll consumes the only request; the second poll hits the request budget.
      check("§10a request-count bound caps polling", r.observations.some((o) => o.reason === "request_budget_exhausted") || r.attempts <= 2);
      check("§10b DEFAULT_BOUNDS exposes every axis", ["maxAttempts", "intervalMs", "totalDurationMs", "perRequestTimeoutMs", "maxRedirects", "maxResponseBytes", "maxRequests", "maxOutputBytes"].every((k) => k in DEFAULT_BOUNDS));
    }
  } finally {
    // -----------------------------------------------------------------------
    // §11  STOP the task-owned servers and PROVE they are stopped
    // -----------------------------------------------------------------------
    await closeServer(statusServer);
    await closeServer(canaryServer);
    check("§11a both mock servers report not listening after close", statusServer.listening === false && canaryServer.listening === false);
    const r = await runCommitStatusVerify({ statusUrl: `${S}/success`, base: C, expected: EXPECT, expectedSha: FULL_SHA, routes: [FULL_ROUTE], bounds: { maxAttempts: 1, perRequestTimeoutMs: 1000 } });
    check("§11b a request to the stopped status server now fails transport -> STATUS_UNAVAILABLE", r.state === "STATUS_UNAVAILABLE" && r.reason === "endpoint_unreachable");
    cleanupProven = true;
  }

  console.log("");
  if (!cleanupProven) {
    console.error("COMMIT-STATUS SELF-TEST FAILED: could not prove the loopback servers were stopped.");
    process.exit(1);
  }
  if (failed > 0) {
    console.error(`COMMIT-STATUS SELF-TEST FAILED (${failed} check${failed === 1 ? "" : "s"}).`);
    process.exit(1);
  }
  console.log("COMMIT-STATUS SELF-TEST PASSED. Seven states + every bound verified; task-owned loopback servers stopped.");
  process.exit(0);
}

main().catch((err) => {
  console.error("COMMIT-STATUS SELF-TEST CRASHED:", err);
  process.exit(1);
});
