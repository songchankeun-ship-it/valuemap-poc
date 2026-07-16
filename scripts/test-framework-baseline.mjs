// Focused self-test for the framework-migration baseline verifier
// (scripts/verify-framework-baseline.mjs, Slice A).
//
// It exercises the two behaviours a freeze-and-verify harness must get right:
//   (1) STALE-EVIDENCE DETECTION — a baseline whose recorded facts no longer
//       match the repo (bumped dependency, changed middleware matcher, added or
//       removed route, inconsistent audit summary) must be flagged, while an
//       unchanged baseline must read FRESH. This also proves the committed
//       artifact is currently fresh against the live repo.
//   (2) FAILURE PROPAGATION — the aggregate verdict must fail if ANY gate row
//       fails (freshness, audit-block, build cross-check, or an orchestrated
//       child gate), and pass only when every row passes.
//
// Pure and offline: it imports the verifier's exported helpers and drives them
// with in-memory fixtures. It starts no server, runs no child gate, and writes
// nothing.

import { readFileSync } from "node:fs";
import {
  BASELINE_PATH,
  computeRepoFacts,
  diffFacts,
  validateAuditBlock,
  summarizeAudit,
  aggregate,
  crossCheckBuild,
  computeBuildClassification,
} from "./verify-framework-baseline.mjs";

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

// ---------------------------------------------------------------------------
// §1  The committed baseline is FRESH against the live repo (no drift).
// ---------------------------------------------------------------------------
{
  const drift = diffFacts(artifact.facts, computeRepoFacts());
  check("§1 committed baseline is fresh (0 drift vs repo)", drift.length === 0);
  if (drift.length) for (const d of drift) console.error(`       drift: ${d}`);
}

// ---------------------------------------------------------------------------
// §2  Stale-evidence detection — each mutation must be flagged.
// ---------------------------------------------------------------------------
const facts = artifact.facts;

// 2a. bumped runtime dependency version (the exact migration this harness guards).
{
  const stale = clone(facts);
  stale.runtimeDependencies.resolved.next = "15.5.16";
  const drift = diffFacts(stale, computeRepoFacts());
  check("§2a bumped `next` resolved version is flagged stale", drift.some((d) => d.includes("runtimeDependencies.resolved.next")));
}
// 2b. changed declared dependency range.
{
  const stale = clone(facts);
  stale.runtimeDependencies.declared.react = "^19.0.0";
  const drift = diffFacts(stale, computeRepoFacts());
  check("§2b changed declared `react` range is flagged stale", drift.some((d) => d.includes("runtimeDependencies.declared.react")));
}
// 2c. altered middleware matcher boundary.
{
  const stale = clone(facts);
  stale.middlewareBoundary.matcher = ["/((?!_next).*)"];
  const drift = diffFacts(stale, computeRepoFacts());
  check("§2c altered middleware matcher is flagged stale", drift.some((d) => d.includes("middlewareBoundary.matcher")));
}
// 2d. dropped admin-enforcement marker.
{
  const stale = clone(facts);
  stale.middlewareBoundary.adminEnforcement.forbidden403 = false;
  const drift = diffFacts(stale, computeRepoFacts());
  check("§2d flipped admin forbidden403 marker is flagged stale", drift.some((d) => d.includes("adminEnforcement.forbidden403")));
}
// 2e. removed a source route (regression risk during migration).
{
  const stale = clone(facts);
  stale.sourceRoutes.pages = stale.sourceRoutes.pages.filter((p) => p !== "/stocks");
  stale.sourceRoutes.count -= 1;
  const drift = diffFacts(stale, computeRepoFacts());
  check("§2e removed source route is flagged stale", drift.some((d) => d.includes("sourceRoutes")));
}
// 2f. added a phantom route not present in the repo.
{
  const stale = clone(facts);
  stale.sourceRoutes.pages = [...stale.sourceRoutes.pages, "/phantom"].sort();
  const drift = diffFacts(stale, computeRepoFacts());
  check("§2f phantom source route is flagged stale", drift.some((d) => d.includes("sourceRoutes.pages")));
}

// ---------------------------------------------------------------------------
// §3  Audit-block consistency — hand-edits that hide a finding are rejected.
// ---------------------------------------------------------------------------
{
  // Real recorded block validates clean.
  check("§3a recorded audit block is internally consistent", validateAuditBlock(artifact.productionAudit).length === 0);

  // Summary total no longer equals the severity sum.
  const bad1 = clone(artifact.productionAudit);
  bad1.summary.total = 0;
  check("§3b tampered summary.total is rejected", validateAuditBlock(bad1).some((e) => e.includes("summary.total")));

  // Summary claims a critical finding but no package carries it (truncated evidence).
  const bad2 = clone(artifact.productionAudit);
  bad2.packages = [];
  bad2.summary = { info: 0, low: 0, moderate: 0, high: 0, critical: 1, total: 1 };
  check("§3c critical summary with no critical package is rejected", validateAuditBlock(bad2).some((e) => e.includes("critical")));

  // A secret-shaped value smuggled into evidence is rejected...
  const bad3 = clone(artifact.productionAudit);
  bad3.packages[0].advisories[0].source = "password=hunter2secretvalue";
  check("§3d secret-shaped value in evidence is rejected", validateAuditBlock(bad3).some((e) => e.includes("secret-looking")));

  // ...but a plain English advisory title containing "Authorization" is NOT a
  // false positive (the real block already carries exactly such a title).
  check("§3e advisory title with the word 'Authorization' is not flagged", validateAuditBlock(artifact.productionAudit).length === 0);
}

// ---------------------------------------------------------------------------
// §4  summarizeAudit shape — deterministic sanitization from raw audit JSON.
// ---------------------------------------------------------------------------
{
  const raw = {
    metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 1, total: 1 } },
    vulnerabilities: {
      next: {
        name: "next",
        severity: "critical",
        range: ">=14 <14.2.25",
        isDirect: true,
        fixAvailable: { name: "next", version: "16.2.10", isSemVerMajor: true },
        via: [
          { title: "Authorization Bypass in Next.js Middleware", severity: "critical", url: "https://github.com/advisories/GHSA-f82v-jwr5-mffw", range: ">=14 <14.2.25", cwe: ["CWE-285"], source: 1113689, extraSecret: "token=abc" },
          "postcss",
        ],
      },
    },
  };
  const out = summarizeAudit(raw);
  check("§4a summary carries severity counts", out.summary.critical === 1 && out.summary.total === 1);
  check("§4b advisory ghsa derived from url", out.packages[0].advisories[0].ghsa === "GHSA-f82v-jwr5-mffw");
  check("§4c string `via` reference dropped (only real advisories kept)", out.packages[0].advisories.length === 1);
  check("§4d non-whitelisted advisory key dropped", !("extraSecret" in out.packages[0].advisories[0]));
  check("§4e sanitized output has no secret-looking value", validateAuditBlock(out).length === 0);
}

// ---------------------------------------------------------------------------
// §5  Failure propagation — the aggregate verdict fails if ANY row fails.
// ---------------------------------------------------------------------------
{
  const allPass = [
    { name: "baseline-freshness", failed: false },
    { name: "audit-block", failed: false },
    { name: "verify:metrics", failed: false },
  ];
  const a1 = aggregate(allPass);
  check("§5a all-pass aggregates to 0 failures", a1.failed === 0 && a1.passed === 3);

  const oneFail = [
    { name: "baseline-freshness", failed: false },
    { name: "verify:reaudit", failed: true },
    { name: "verify:metrics", failed: false },
  ];
  const a2 = aggregate(oneFail);
  check("§5b a single failing child gate propagates to overall failure", a2.failed === 1 && a2.failedNames.includes("verify:reaudit"));

  const freshnessFail = [
    { name: "baseline-freshness", failed: true },
    { name: "audit-block", failed: false },
  ];
  const a3 = aggregate(freshnessFail);
  check("§5c a stale baseline alone fails the run", a3.failed === 1 && a3.failedNames.includes("baseline-freshness"));
}

// ---------------------------------------------------------------------------
// §6  Build cross-check — matches the local build; drift is detected.
// ---------------------------------------------------------------------------
{
  const live = computeBuildClassification();
  if (live) {
    const ok = crossCheckBuild(artifact.buildClassification);
    check("§6a recorded build classification matches local .next", ok.status === "ok");

    const mutated = clone(artifact.buildClassification);
    mutated.dynamicServerRoutes = [...mutated.dynamicServerRoutes, "/phantom/[id]"].sort();
    const drift = crossCheckBuild(mutated);
    check("§6b injected dynamic route drift is detected", drift.status === "drift" && drift.messages.some((m) => m.includes("phantom")));
  } else {
    // No local build present: cross-check must degrade to a non-failing SKIP.
    const skip = crossCheckBuild(artifact.buildClassification);
    check("§6a cross-check skips cleanly without a local build", skip.status === "skipped");
  }
}

// ---------------------------------------------------------------------------
console.log("");
if (failed > 0) {
  console.error(`FRAMEWORK-BASELINE SELF-TEST FAILED (${failed} check${failed === 1 ? "" : "s"}).`);
  process.exit(1);
}
console.log("FRAMEWORK-BASELINE SELF-TEST PASSED. Stale-evidence detection + failure propagation verified.");
process.exit(0);
