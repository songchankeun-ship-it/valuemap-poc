// Focused self-test for the service-continuity baseline verifier
// (scripts/verify-continuity-baseline.mjs, Slice A).
//
// It exercises the two behaviours a freeze-and-verify harness must get right:
//   (1) STALE-EVIDENCE DETECTION — a baseline whose recorded facts no longer
//       match the repo (changed workflow schedule/bot/commit paths, a public-data
//       blob identity drift, a moved route canary, a flipped footer marker, a
//       Metrics-version/universe change, or a moved login/auth blob) must be
//       flagged; and a hand-edit that weakens an invariant or smuggles a secret
//       into the evidence must be rejected. This also proves the committed
//       artifact is currently fresh + integrity-clean against the live repo.
//   (2) DELEGATED-GATE FAILURE PROPAGATION — the aggregate verdict must fail if
//       ANY row fails (freshness, evidence-integrity, or one of the five delegated
//       Metrics/routes/SEO/release/framework gates) and pass only when all pass.
//
// Pure and offline: it imports the verifier's exported helpers and drives them
// with in-memory fixtures. It starts no server, runs no child gate, and writes
// nothing.

import { readFileSync } from "node:fs";
import {
  BASELINE_PATH,
  DELEGATED_GATES,
  computeContinuityFacts,
  diffFacts,
  validateEvidence,
  matchesSourceRoute,
  aggregate,
} from "./verify-continuity-baseline.mjs";

let failed = 0;
function check(name, cond) {
  if (cond) {
    console.log(`  ok  ${name}`);
  } else {
    failed++;
    console.error(`  FAIL ${name}`);
  }
}
function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

const artifact = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
const facts = artifact.facts;

// ---------------------------------------------------------------------------
// §1  The committed baseline is FRESH + integrity-clean against the live repo.
// ---------------------------------------------------------------------------
{
  const drift = diffFacts(facts, computeContinuityFacts());
  check("§1a committed baseline is fresh (0 drift vs repo)", drift.length === 0);
  if (drift.length) for (const d of drift) console.error(`       drift: ${d}`);

  const errs = validateEvidence(facts);
  check("§1b committed evidence passes all invariant checks", errs.length === 0);
  if (errs.length) for (const e of errs) console.error(`       err: ${e}`);
}

// ---------------------------------------------------------------------------
// §2  Stale-evidence detection — each fact-category mutation must be flagged.
// ---------------------------------------------------------------------------
function driftFor(mutate) {
  const stale = clone(facts);
  mutate(stale);
  return diffFacts(stale, computeContinuityFacts());
}
{
  check("§2a changed workflow schedule (cron) is flagged stale", driftFor((s) => (s.dailyWorkflow.schedule = "0 9 * * 1-5")).some((d) => d.includes("dailyWorkflow.schedule")));
  check("§2b changed bot identity is flagged stale", driftFor((s) => (s.dailyWorkflow.commit.botName = "attacker-bot")).some((d) => d.includes("dailyWorkflow.commit.botName")));
  check("§2c dropped commit add-path is flagged stale", driftFor((s) => (s.dailyWorkflow.commit.addPaths = ["public/data/stocks.json"])).some((d) => d.includes("dailyWorkflow.commit.addPaths")));
  check("§2d reordered data pipeline is flagged stale", driftFor((s) => s.dailyWorkflow.pipeline.reverse()).some((d) => d.includes("dailyWorkflow.pipeline")));
  check("§2e public-data stocks.json blob drift is flagged stale", driftFor((s) => (s.publicData.stocksJson = "0".repeat(40))).some((d) => d.includes("publicData.stocksJson")));
  check("§2f public-data tree drift is flagged stale", driftFor((s) => (s.publicData.treeSha = "f".repeat(40))).some((d) => d.includes("publicData.treeSha")));
  check("§2g removed route canary is flagged stale", driftFor((s) => (s.routeCanary.paths = s.routeCanary.paths.filter((p) => p !== "/status"))).some((d) => d.includes("routeCanary.paths")));
  check("§2h phantom route canary is flagged stale", driftFor((s) => s.routeCanary.paths.push("/phantom")).some((d) => d.includes("routeCanary.paths")));
  check("§2i flipped footer env var is flagged stale", driftFor((s) => (s.footerMarker.envVar = "SOME_OTHER_ENV")).some((d) => d.includes("footerMarker.envVar")));
  check("§2j changed Metrics version is flagged stale", driftFor((s) => (s.metrics.dataVersion = "2.5")).some((d) => d.includes("metrics.dataVersion")));
  check("§2k changed universe count is flagged stale", driftFor((s) => (s.metrics.universeCount = 137)).some((d) => d.includes("metrics.universeCount")));
  check("§2l moved login blob is flagged stale", driftFor((s) => (s.frozenAuth.login[0].sha = "a".repeat(40))).some((d) => d.includes("frozenAuth.login")));
  check("§2m added auth file is flagged stale", driftFor((s) => s.frozenAuth.auth.push({ path: "src/app/auth/evil.ts", sha: "b".repeat(40) })).some((d) => d.includes("frozenAuth.auth")));
}

// ---------------------------------------------------------------------------
// §3  Evidence integrity — hand-edits that weaken an invariant / hide a secret.
// ---------------------------------------------------------------------------
{
  const weakenVersion = clone(facts);
  weakenVersion.metrics.dataVersion = "2.5";
  check("§3a Metrics-version weakening is rejected", validateEvidence(weakenVersion).some((e) => e.includes("metrics.dataVersion")));

  const weakenUniverse = clone(facts);
  weakenUniverse.metrics.universeCount = 200;
  check("§3b universe-count weakening is rejected", validateEvidence(weakenUniverse).some((e) => e.includes("universeCount")));

  const weakenBot = clone(facts);
  weakenBot.dailyWorkflow.commit.botName = "actions-bot";
  check("§3c bot-identity weakening is rejected", validateEvidence(weakenBot).some((e) => e.includes("botName")));

  const weakenConcurrency = clone(facts);
  weakenConcurrency.dailyWorkflow.concurrency.cancelInProgress = "true";
  check("§3d concurrency cancel weakening is rejected", validateEvidence(weakenConcurrency).some((e) => e.includes("cancelInProgress")));

  const weakenFooter = clone(facts);
  weakenFooter.footerMarker.sliceLength = 40;
  check("§3e footer-marker weakening is rejected", validateEvidence(weakenFooter).some((e) => e.includes("sliceLength")));

  const emptyAuth = clone(facts);
  emptyAuth.frozenAuth.login = [];
  check("§3f empty frozen-auth evidence is rejected", validateEvidence(emptyAuth).some((e) => e.includes("frozenAuth.login")));

  const secret = clone(facts);
  secret.dailyWorkflow.commit.messagePrefix = "token=abcd1234efgh5678ijkl";
  check("§3g secret-shaped value in evidence is rejected", validateEvidence(secret).some((e) => e.includes("secret-looking")));

  // ...but the real recorded evidence (which contains English workflow words like
  // "Verify data integrity") is NOT a false positive.
  check("§3h real recorded evidence is not flagged as secret", validateEvidence(facts).length === 0);
}

// ---------------------------------------------------------------------------
// §4  Route-canary source coverage — concrete param + query normalization.
// ---------------------------------------------------------------------------
{
  const pages = ["/", "/status", "/stock/[ticker]", "/login", "/watchlist"];
  check("§4a concrete param path matches its [param] source route", matchesSourceRoute("/stock/005930", pages));
  check("§4b query string is stripped before matching", matchesSourceRoute("/login?next=/watchlist", pages));
  check("§4c a path with no source route is uncovered", !matchesSourceRoute("/phantom", pages));
  check("§4d segment-count mismatch does not falsely match", !matchesSourceRoute("/stock/005930/extra", pages));
}

// ---------------------------------------------------------------------------
// §5  Delegated-gate failure propagation + family coverage.
// ---------------------------------------------------------------------------
{
  const families = DELEGATED_GATES.map((g) => g.family);
  for (const fam of ["metrics", "routes", "seo", "release", "framework"]) {
    check(`§5a delegated gate for '${fam}' family is wired`, families.includes(fam));
  }

  const allPass = [
    { name: "baseline-freshness", failed: false },
    { name: "evidence-integrity", failed: false },
    { name: "verify:metrics", failed: false },
  ];
  const a1 = aggregate(allPass);
  check("§5b all-pass aggregates to 0 failures", a1.failed === 0 && a1.passed === 3);

  const oneDelegatedFail = [
    { name: "baseline-freshness", failed: false },
    { name: "release:preflight", failed: true },
    { name: "verify:metrics", failed: false },
  ];
  const a2 = aggregate(oneDelegatedFail);
  check("§5c a single failing delegated gate propagates to overall failure", a2.failed === 1 && a2.failedNames.includes("release:preflight"));

  const freshnessFail = [
    { name: "baseline-freshness", failed: true },
    { name: "evidence-integrity", failed: false },
  ];
  const a3 = aggregate(freshnessFail);
  check("§5d a stale baseline alone fails the run", a3.failed === 1 && a3.failedNames.includes("baseline-freshness"));

  const integrityFail = [
    { name: "baseline-freshness", failed: false },
    { name: "evidence-integrity", failed: true },
  ];
  const a4 = aggregate(integrityFail);
  check("§5e an integrity failure alone fails the run", a4.failed === 1 && a4.failedNames.includes("evidence-integrity"));
}

// ---------------------------------------------------------------------------
console.log("");
if (failed > 0) {
  console.error(`CONTINUITY-BASELINE SELF-TEST FAILED (${failed} check${failed === 1 ? "" : "s"}).`);
  process.exit(1);
}
console.log("CONTINUITY-BASELINE SELF-TEST PASSED. Stale-evidence detection + delegated-gate failure propagation verified.");
process.exit(0);
