// Focused self-test for the continuity fault matrix
// (scripts/verify-continuity-fault-matrix.mjs, Slice F of
//  docs/ornscore-service-continuity-2026-07-17.md).
//
// It proves, deterministically and WITHOUT touching any live service, that the
// combined B-E fault matrix delivers the guarantees an operator relies on:
//   (1) FAIL-CLOSED     — every injected fault yields a non-passing decision, and
//                         the healthy controls still pass (so it is not vacuous).
//   (2) COVERAGE        — every fault category named in the Slice F plan is present,
//                         and all seven commit-status terminal states are reached.
//   (3) STABLE REASONS  — every decision's code/state is from its tool's closed set,
//                         and two full matrix runs are byte-identical on decisions.
//   (4) BOUNDED         — total requests and wall-clock stay within the documented
//                         budgets; the matrix completes.
//   (5) SECRET-FREE     — no emitted evidence looks like a credential, and the
//                         detector that proves it is itself shown to work.
//   (6) NO DATA MUTATION — running the matrix leaves public/data byte-identical
//                         (git-blob comparison against HEAD).
//   (7) CLEANUP         — the cleanup invariant (task-owned listeners stopped and
//                         proven stopped, including the interrupted one) holds.

import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { runFaultMatrix, buildCases, MATRIX_BOUNDS } from "./verify-continuity-fault-matrix.mjs";
import { STATES as CS_STATES } from "./verify-commit-status.mjs";
import { ROOT, looksLikeSecret } from "./verify-framework-baseline.mjs";

let failed = 0;
function check(name, cond) {
  if (cond) {
    console.log(`  ok  ${name}`);
  } else {
    failed++;
    console.error(`  FAIL ${name}`);
  }
}

// Every fault category the Slice F plan enumerates. The matrix must exercise each.
const REQUIRED_CATEGORIES = [
  "candidate-regression",
  "delegated-verifier-failure",
  "status-pending",
  "status-failing",
  "status-timeout",
  "status-unavailable",
  "status-malformed",
  "stale-marker",
  "route-failure",
  "truncated-response",
  "listener-interruption",
];

async function main() {
  // -------------------------------------------------------------------------
  // §1  a full matrix run — the report and its invariants
  // -------------------------------------------------------------------------
  const report = await runFaultMatrix();

  check("§1a matrix report ok=true", report.ok === true);
  check("§1b every invariant holds", Object.values(report.invariants).every(Boolean));
  check("§1c invariant keys are the documented seven", ["failClosed", "allMatched", "stableReasons", "deterministic", "boundedRequests", "secretFree", "cleanup"].every((k) => k in report.invariants));
  check("§1d at least 20 cases exercised", report.caseCount >= 20);

  // -------------------------------------------------------------------------
  // §2  FAIL-CLOSED — controls pass; every injected fault does not
  // -------------------------------------------------------------------------
  const controls = report.decisions.filter((d) => d.category === "control");
  const faults = report.decisions.filter((d) => d.category !== "control");
  check("§2a there are healthy controls (fail-closed is not vacuous)", controls.length >= 3 && controls.every((d) => d.pass === true));
  check("§2b every injected fault fails closed (pass === false)", faults.length > 0 && faults.every((d) => d.pass === false));
  check("§2c the four tools all appear (Slice B/C/D/E combined)", ["canary", "delta", "workflow-gate", "commit-status"].every((t) => report.decisions.some((d) => d.tool === t)));

  // -------------------------------------------------------------------------
  // §3  COVERAGE — every planned category + all seven commit-status states
  // -------------------------------------------------------------------------
  const seenCategories = new Set(report.decisions.map((d) => d.category));
  for (const cat of REQUIRED_CATEGORIES) {
    check(`§3.cat present: ${cat}`, seenCategories.has(cat));
  }
  const seenStates = new Set(report.decisions.filter((d) => d.tool === "commit-status").map((d) => d.state));
  check("§3s all seven commit-status states reached", CS_STATES.every((s) => seenStates.has(s)) && CS_STATES.length === 7);

  // -------------------------------------------------------------------------
  // §4  STABLE REASONS + per-case determinism
  // -------------------------------------------------------------------------
  check("§4a every case matched its expectation", report.decisions.every((d) => d.matched));
  check("§4b every case code is in its tool's closed set", report.decisions.every((d) => d.codeInSet));
  check("§4c every commit-status state is in the closed STATES set", report.decisions.every((d) => d.stateInSet));
  check("§4d every case decision is deterministic across the internal double-run", report.decisions.every((d) => d.deterministic) && report.meta.determinismViolations === 0);

  // Distinct reason codes prove the diagnostics are granular, not collapsed to one.
  const distinctCodes = new Set(report.decisions.map((d) => `${d.tool}:${d.code}`));
  check("§4e diagnostics are granular (>= 15 distinct tool:code decisions)", distinctCodes.size >= 15);

  // -------------------------------------------------------------------------
  // §5  DETERMINISM across two independent full runs (decisions byte-identical)
  // -------------------------------------------------------------------------
  const report2 = await runFaultMatrix();
  const strip = (r) => JSON.stringify(r.decisions);
  check("§5a two full matrix runs are byte-identical on decisions", strip(report) === strip(report2));
  check("§5b invariants identical across both runs", JSON.stringify(report.invariants) === JSON.stringify(report2.invariants));

  // -------------------------------------------------------------------------
  // §6  BOUNDED completion
  // -------------------------------------------------------------------------
  check("§6a total requests within the request budget", report.meta.requests <= MATRIX_BOUNDS.totalMatrixRequests);
  check("§6b wall-clock within the (loose) duration budget", report.meta.durationMs <= MATRIX_BOUNDS.totalMatrixMs);
  check("§6c matrix completed (a bounded case count was produced)", report.caseCount === report.decisions.length && report.caseCount > 0);

  // -------------------------------------------------------------------------
  // §7  SECRET-FREE evidence, and the detector actually works
  // -------------------------------------------------------------------------
  check("§7a matrix report as a whole is secret-free", !looksLikeSecret(JSON.stringify(report)));
  check("§7b secretFree invariant is true", report.invariants.secretFree === true);
  // Prove the detector is not vacuously false: a credential-shaped token trips it.
  const fakeToken = "AKIA" + "ABCDEFGHIJKLMNOP"; // AWS-access-key-shaped, not a real key
  check("§7c looksLikeSecret flags a credential-shaped token (detector works)", looksLikeSecret(fakeToken) === true);
  check("§7d no 13-digit wall-clock timestamp leaks into the decisions", !/\b\d{13}\b/.test(JSON.stringify(report.decisions)));

  // -------------------------------------------------------------------------
  // §8  NO public/data mutation — the git blob is unchanged by the run
  // -------------------------------------------------------------------------
  let dataClean = true;
  try {
    execFileSync("git", ["diff", "--quiet", "--", "public/data"], { cwd: ROOT });
  } catch {
    dataClean = false;
  }
  check("§8a public/data is byte-identical to HEAD after the matrix run", dataClean);

  // -------------------------------------------------------------------------
  // §9  CLEANUP invariant + the interrupted listener specifically
  // -------------------------------------------------------------------------
  check("§9a cleanup invariant holds (servers stopped + proven stopped)", report.invariants.cleanup === true);
  const interrupt = report.decisions.find((d) => d.id === "listener-interruption");
  check("§9b the interrupted listener was classified STATUS_UNAVAILABLE/endpoint_unreachable", interrupt && interrupt.state === "STATUS_UNAVAILABLE" && interrupt.code === "endpoint_unreachable");

  // -------------------------------------------------------------------------
  // §10  case table is enumerable offline (the --list path performs no network)
  // -------------------------------------------------------------------------
  const enumerated = buildCases({ S: "http://127.0.0.1:0", C: "http://127.0.0.1:0", counter: { requests: 0 } });
  check("§10a buildCases enumerates without network", Array.isArray(enumerated) && enumerated.length >= 20 && enumerated.every((c) => typeof c.id === "string" && typeof c.run === "function"));

  console.log("");
  if (failed > 0) {
    console.error(`CONTINUITY-FAULT-MATRIX SELF-TEST FAILED (${failed} check${failed === 1 ? "" : "s"}).`);
    process.exit(1);
  }
  console.log("CONTINUITY-FAULT-MATRIX SELF-TEST PASSED. Combined B-E fault matrix: fail-closed, covered, stable, deterministic, bounded, secret-free, no data mutation, listeners cleaned up.");
  process.exit(0);
}

main().catch((err) => {
  console.error("CONTINUITY-FAULT-MATRIX SELF-TEST CRASHED:", err);
  process.exit(1);
});
