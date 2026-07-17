// Source-level verifier for the fail-closed daily-data workflow gate (Slice D of
// docs/ornscore-service-continuity-2026-07-17.md).
//
// WHY THIS EXISTS
// ---------------
// Slice D wires the Slice C public-data candidate delta guard and the existing
// offline Metrics/framework/release checks into `.github/workflows/daily-data.yml`
// so a routine data refresh cannot commit or push a stale/broken/oversized change.
// The safety property is entirely ORDERING + FAIL-CLOSED + FROZEN-FIELDS: the gates
// must run before the commit-and-push step, a failing gate must make commit/push
// unreachable, and none of the frozen workflow fields (schedule, permissions,
// concurrency, timeout, data commands, market-alert non-blocking policy, commit
// paths, bot identity, commit message format, push semantics) may drift.
//
// This verifier PROVES those properties from the workflow SOURCE, without ever
// executing or dispatching the workflow. It is offline and finite: it only reads
// the YAML file (or a supplied text fixture) and inspects its structure. It starts
// no server (protects the always-on AI Center listener on :4310) and mutates
// nothing.
//
// It REUSES the Slice A contract parser (`parseWorkflowContract`) for the frozen
// structured fields and the framework-baseline `looksLikeSecret`/`aggregate`
// helpers, instead of re-implementing contract extraction or verdict aggregation.
//
// USAGE
//   npm run verify:daily-workflow-gate            # verify the real workflow
//   npm run verify:daily-workflow-gate -- --json  # stable JSON evidence
//   npm run verify:daily-workflow-gate -- --list  # print the asserted contract
//
// Exit code: 1 if any ordering / fail-closed / frozen-field / gate-presence check
// fails, else 0. The pure helpers are exported for the fixture self-test
// (scripts/test-daily-workflow-gate.mjs).

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ROOT, looksLikeSecret, aggregate } from "./verify-framework-baseline.mjs";
import { WORKFLOW_FILE, parseWorkflowContract } from "./verify-continuity-baseline.mjs";

// ---------------------------------------------------------------------------
// frozen contract the workflow must preserve byte-for-byte where practical
// ---------------------------------------------------------------------------
export const FROZEN = {
  name: "Daily data refresh",
  schedule: "0 8 * * 1-5",
  workflowDispatch: true,
  permissionsContents: "write",
  concurrencyGroup: "daily-data",
  cancelInProgress: "false",
  runsOn: "ubuntu-latest",
  timeoutMinutes: 30,
  botName: "ornscore-bot",
  botEmail: "actions@users.noreply.github.com",
  // parseWorkflowContract captures the message text up to the first `$`/`"`.
  messagePrefix: "chore(data): daily refresh",
  addPaths: ["public/data/stocks.json", "public/data/prices", "public/data/market-alerts.json"],
};

// The data fetch/recompute commands, in order. These must appear unchanged and in
// this relative order; the market-alert command must keep its non-blocking `|| echo`.
export const FROZEN_DATA_COMMANDS = [
  "python scripts/fetch_prices.py",
  "python scripts/sync_prices_to_stocks.py",
  "python scripts/compute_metrics.py",
  'python scripts/fetch_market_alerts.py || echo "market-alerts skipped"',
  "python scripts/verify_metrics.py",
];

// The successful-path commit/synchronize script, frozen byte-for-byte. If any byte
// of this block changes (add paths, bot identity, message format, skip logic, push),
// the frozen check fails.
export const FROZEN_COMMIT_SCRIPT = [
  '          git config user.name "ornscore-bot"',
  '          git config user.email "actions@users.noreply.github.com"',
  "          git add public/data/stocks.json public/data/prices public/data/market-alerts.json",
  "          if git diff --cached --quiet; then",
  '            echo "No data changes — skip commit."',
  "          else",
  '            git commit -m "chore(data): daily refresh $(date -u +%Y-%m-%dT%H:%MZ)"',
  "            git push",
  '            echo "Pushed — Vercel will auto-deploy."',
  "          fi",
].join("\n");

// The ordered gate set that must run before commit-and-push. `match` classifies a
// step by its run body; order in this array is the asserted execution order.
export const GATES = [
  {
    key: "metrics",
    label: "Metrics data-integrity gate (verify_metrics.py)",
    match: (t) => /python\s+scripts\/verify_metrics\.py/.test(t),
  },
  {
    key: "candidate",
    label: "public-data candidate delta guard (Slice C, verify_public_data_delta.py)",
    match: (t) => /python\s+scripts\/verify_public_data_delta\.py/.test(t),
  },
  {
    key: "release",
    label: "release preflight — offline gates",
    match: (t) => /release:preflight/.test(t) && /--offline-only/.test(t),
  },
  {
    key: "framework",
    label: "framework baseline freshness",
    match: (t) => /verify:framework-baseline/.test(t) && /--freshness-only/.test(t),
  },
];

const COMMIT_MATCH = (t) => /\bgit\s+commit\b/.test(t) && /\bgit\s+push\b/.test(t);

// ---------------------------------------------------------------------------
// step parser — offline, structural, no YAML dependency added
// ---------------------------------------------------------------------------
// Steps live under `jobs.<id>.steps:` and each begins with a 6-space "- " marker;
// their properties are indented deeper, so a step block runs until the next marker.
export function parseWorkflowSteps(src) {
  const marker = src.search(/\n {4}steps:\s*(?:\n|$)/);
  const body = marker === -1 ? src : src.slice(marker);
  const lines = body.split("\n");
  const blocks = [];
  let cur = null;
  for (const line of lines) {
    if (/^ {6}- /.test(line)) {
      if (cur) blocks.push(cur);
      cur = [line];
    } else if (cur) {
      cur.push(line);
    }
  }
  if (cur) blocks.push(cur);
  return blocks.map((raw, index) => {
    const text = raw.join("\n");
    const scalar = (re) => {
      const m = text.match(re);
      return m ? m[1].trim() : null;
    };
    return {
      index,
      name: scalar(/(?:^|\n)\s*-?\s*name:\s*(.+)/),
      uses: scalar(/(?:^|\n)\s*-?\s*uses:\s*(.+)/),
      // step-level `if:` (a conditional that could skip the step); the shell-level
      // `if` inside a `run:` block is indented deeper and is not captured here.
      ifCond: scalar(/(?:^|\n) {8}if:\s*(.+)/),
      continueOnError: / {8}continue-on-error:\s*true\b/.test(text),
      text,
    };
  });
}

// ---------------------------------------------------------------------------
// checks (pure — each returns an array of error strings)
// ---------------------------------------------------------------------------

// (1) every ordered gate is present exactly once, and the commit step is present.
export function checkPresence(steps) {
  const errors = [];
  const locate = {};
  for (const g of GATES) {
    const hits = steps.filter((s) => g.match(s.text));
    if (hits.length === 0) errors.push(`gate "${g.key}" (${g.label}) is missing from the workflow`);
    else if (hits.length > 1) errors.push(`gate "${g.key}" appears in ${hits.length} steps; expected exactly 1`);
    else locate[g.key] = hits[0].index;
  }
  const commits = steps.filter((s) => COMMIT_MATCH(s.text));
  if (commits.length === 0) errors.push("commit-and-push step (git commit + git push) is missing");
  else if (commits.length > 1) errors.push(`commit-and-push matched ${commits.length} steps; expected exactly 1`);
  else locate.commit = commits[0].index;
  return { errors, locate };
}

// (2) exact ordering: gates run in the documented order, all strictly before the
// commit step, and the commit step is the LAST step in the job.
export function checkOrdering(steps, locate) {
  const errors = [];
  const gateKeys = GATES.map((g) => g.key);
  const present = gateKeys.filter((k) => locate[k] !== undefined);
  for (let i = 1; i < present.length; i++) {
    const prev = present[i - 1];
    const cur = present[i];
    if (locate[cur] <= locate[prev]) {
      errors.push(`gate order violation: "${cur}" (step ${locate[cur]}) must run after "${prev}" (step ${locate[prev]})`);
    }
  }
  if (locate.commit !== undefined) {
    for (const k of present) {
      if (locate[k] >= locate.commit) {
        errors.push(`fail-closed order violation: gate "${k}" (step ${locate[k]}) is not before commit-and-push (step ${locate.commit})`);
      }
    }
    if (locate.commit !== steps.length - 1) {
      errors.push(`commit-and-push (step ${locate.commit}) is not the last step (${steps.length - 1}); a later step could run after a failed gate`);
    }
  }
  return errors;
}

// (3) fail-closed: no gate may swallow its failure, and the commit step must not be
// forced to run despite an upstream failure.
export function checkFailClosed(steps, locate) {
  const errors = [];
  for (const g of GATES) {
    const idx = locate[g.key];
    if (idx === undefined) continue;
    const step = steps[idx];
    if (step.continueOnError) errors.push(`gate "${g.key}" has continue-on-error: true (would not fail the job)`);
    if (step.ifCond) errors.push(`gate "${g.key}" carries a step-level if: (${step.ifCond}) — a gate must run unconditionally`);
    if (/\|\|/.test(step.text)) errors.push(`gate "${g.key}" run body contains "||" — it must not swallow a non-zero exit`);
  }
  if (locate.commit !== undefined) {
    const commit = steps[locate.commit];
    if (commit.continueOnError) errors.push("commit-and-push has continue-on-error: true");
    if (commit.ifCond) errors.push(`commit-and-push carries a step-level if: (${commit.ifCond}) — it must run only on gate success (no if: always()/failure())`);
  }
  return errors;
}

// (4) frozen structured fields + byte-anchored data commands + commit script.
export function checkFrozenFields(src) {
  const errors = [];
  const wf = parseWorkflowContract(src);
  const eq = (got, want, label) => {
    if (got !== want) errors.push(`${label} ${JSON.stringify(got)} != ${JSON.stringify(want)}`);
  };
  eq(wf.name, FROZEN.name, "name");
  eq(wf.schedule, FROZEN.schedule, "schedule (cron)");
  if (wf.workflowDispatch !== FROZEN.workflowDispatch) errors.push("workflow_dispatch trigger is missing");
  eq(wf.permissionsContents, FROZEN.permissionsContents, "permissions.contents");
  eq(wf.concurrency?.group, FROZEN.concurrencyGroup, "concurrency.group");
  eq(wf.concurrency?.cancelInProgress, FROZEN.cancelInProgress, "concurrency.cancel-in-progress");
  eq(wf.job?.runsOn, FROZEN.runsOn, "runs-on");
  if (wf.job?.timeoutMinutes !== FROZEN.timeoutMinutes) errors.push(`timeout-minutes ${wf.job?.timeoutMinutes} != ${FROZEN.timeoutMinutes}`);
  eq(wf.commit?.botName, FROZEN.botName, "commit bot user.name");
  eq(wf.commit?.botEmail, FROZEN.botEmail, "commit bot user.email");
  eq(wf.commit?.messagePrefix, FROZEN.messagePrefix, "commit message prefix");
  if (wf.commit?.pushes !== true) errors.push("commit-and-push no longer runs git push");
  const gotPaths = JSON.stringify(wf.commit?.addPaths);
  const wantPaths = JSON.stringify(FROZEN.addPaths);
  if (gotPaths !== wantPaths) errors.push(`commit add paths ${gotPaths} != ${wantPaths}`);

  // Byte-anchored: each data command present, in order, and the non-blocking
  // market-alert `|| echo` policy preserved.
  let cursor = -1;
  for (const cmd of FROZEN_DATA_COMMANDS) {
    const at = src.indexOf(cmd);
    if (at === -1) {
      errors.push(`frozen data command missing or altered: ${JSON.stringify(cmd)}`);
    } else if (at <= cursor) {
      errors.push(`frozen data command out of order: ${JSON.stringify(cmd)}`);
    } else {
      cursor = at;
    }
  }

  // Byte-for-byte successful-path commit/synchronize script.
  if (!src.includes(FROZEN_COMMIT_SCRIPT)) {
    errors.push("commit-and-push script drifted from the frozen byte-for-byte block");
  }
  return errors;
}

// (5) node setup + install must precede the npm-based gates so they can run.
export function checkNodeSetup(steps, locate) {
  const errors = [];
  const needsNode = locate.release !== undefined || locate.framework !== undefined;
  if (!needsNode) return errors;
  const installIdx = steps.findIndex((s) => /npm\s+ci\b|npm\s+install\b/.test(s.text));
  const setupIdx = steps.findIndex((s) => /actions\/setup-node@/.test(s.uses || s.text));
  if (setupIdx === -1) errors.push("npm-based gates present but no actions/setup-node step");
  if (installIdx === -1) errors.push("npm-based gates present but no `npm ci` install step");
  const firstNpmGate = Math.min(
    locate.release ?? Infinity,
    locate.framework ?? Infinity,
  );
  if (installIdx !== -1 && installIdx >= firstNpmGate) errors.push("`npm ci` runs after an npm-based gate (dependencies unavailable)");
  return errors;
}

// (6) no credential-shaped value in the workflow source.
export function checkNoSecret(src) {
  return looksLikeSecret(src) ? ["workflow source contains a secret-looking value"] : [];
}

// ---------------------------------------------------------------------------
// evaluate — pure: workflow text -> {results, errors, ok}
// ---------------------------------------------------------------------------
export function evaluateWorkflow(src) {
  const steps = parseWorkflowSteps(src);
  const { errors: presenceErrors, locate } = checkPresence(steps);
  const groups = [
    { name: "gate-presence", errors: presenceErrors },
    { name: "ordering", errors: checkOrdering(steps, locate) },
    { name: "fail-closed", errors: checkFailClosed(steps, locate) },
    { name: "frozen-fields", errors: checkFrozenFields(src) },
    { name: "node-setup", errors: checkNodeSetup(steps, locate) },
    { name: "no-secret", errors: checkNoSecret(src) },
  ];
  const results = groups.map((g) => ({ name: g.name, code: g.errors.length ? 1 : 0, failed: g.errors.length > 0 }));
  return {
    steps: steps.map((s) => ({ index: s.index, name: s.name })),
    locate,
    groups,
    results,
    ok: groups.every((g) => g.errors.length === 0),
  };
}

// ---------------------------------------------------------------------------
// main (only when run directly)
// ---------------------------------------------------------------------------
function hasFlag(f) {
  return process.argv.includes(f);
}
function pad(str, width) {
  str = String(str);
  return str.length >= width ? str : str + " ".repeat(width - str.length);
}

function main() {
  if (hasFlag("--list")) {
    console.log("OrnScore daily-workflow fail-closed gate — asserted source-level contract:");
    console.log("  ordered gates (all before the commit-and-push step, commit is last):");
    for (const g of GATES) console.log(`    - ${pad(g.key, 10)}${g.label}`);
    console.log("  fail-closed: no gate has continue-on-error/if:/`||`; commit has no if:/continue-on-error");
    console.log("  frozen: name, cron, workflow_dispatch, permissions.contents, concurrency, timeout,");
    console.log("          data commands (+ market-alert `|| echo`), commit add-paths, bot identity,");
    console.log("          commit message format, git push, byte-for-byte commit script; no secret.");
    process.exit(0);
  }

  const src = readFileSync(resolve(ROOT, WORKFLOW_FILE), "utf8").replace(/\r\n/g, "\n");
  const report = evaluateWorkflow(src);

  if (hasFlag("--json")) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.ok ? 0 : 1);
  }

  console.log(`OrnScore daily-workflow fail-closed gate verifier (Slice D) — source-level, offline, no dispatch.\nWorkflow: ${WORKFLOW_FILE}\n`);
  for (const g of report.groups) {
    if (g.errors.length) {
      console.log(`===== ${g.name} =====\nFAIL — ${g.errors.length} issue(s):`);
      for (const e of g.errors) console.log(`  · ${e}`);
    } else {
      console.log(`===== ${g.name} =====\nOK`);
    }
  }
  console.log("");
  const order = GATES.map((x) => x.key).filter((k) => report.locate[k] !== undefined).map((k) => `${k}@${report.locate[k]}`);
  console.log(`gate order: ${order.join(" -> ")} -> commit@${report.locate.commit} (of ${report.steps.length} steps)`);
  console.log("");

  const header = `${pad("check", 16)}${pad("exit", 6)}result`;
  console.log(header);
  console.log("-".repeat(header.length));
  for (const r of report.results) console.log(`${pad(r.name, 16)}${pad(r.code, 6)}${r.failed ? "FAIL" : "OK"}`);
  console.log("");

  const agg = aggregate(report.results);
  console.log(`Checks: ${agg.passed}/${agg.total} passed.`);
  if (!report.ok) {
    console.log(`DAILY-WORKFLOW GATE VERIFIER FAILED (${agg.failedNames.join(", ")}).`);
    process.exit(1);
  }
  console.log("DAILY-WORKFLOW GATE VERIFIER PASSED. Gates run fail-closed before commit; frozen fields intact.");
  process.exit(0);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main();
}
