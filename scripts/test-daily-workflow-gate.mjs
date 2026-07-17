// Fixture self-test for the source-level daily-workflow gate verifier
// (scripts/verify-daily-workflow-gate.mjs, Slice D of
// docs/ornscore-service-continuity-2026-07-17.md).
//
// It proves the three properties the verifier exists to guarantee:
//   (1) EXACT ORDERING — the ordered gates run before the commit-and-push step and
//       the commit step is last; a gate moved after commit, or an extra step after
//       commit, is rejected.
//   (2) FAIL-CLOSED — a gate that swallows failure (continue-on-error, a step-level
//       if:, or `||`) or a commit step forced to run via `if: always()` is rejected.
//   (3) FROZEN FIELDS — schedule, permissions, concurrency, timeout, data commands
//       (incl. the market-alert `|| echo` non-blocking policy), commit add-paths,
//       bot identity, commit message format, push, and the byte-for-byte commit
//       script are all pinned; any drift is rejected.
//
// The fixtures are the REAL workflow (the valid case, so the pass case always tracks
// the shipped file) plus minimal, clearly-motivated mutations of it (the failing
// cases). It is pure, offline, and never executes or dispatches the workflow.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { ROOT } from "./verify-framework-baseline.mjs";
import { WORKFLOW_FILE } from "./verify-continuity-baseline.mjs";
import {
  evaluateWorkflow,
  parseWorkflowSteps,
  GATES,
} from "./verify-daily-workflow-gate.mjs";

let failed = 0;
function check(name, cond) {
  if (cond) {
    console.log(`  ok  ${name}`);
  } else {
    failed++;
    console.error(`  FAIL ${name}`);
  }
}
// A fixture fails iff exactly the named group (and no unrelated group) reports it.
function groupFailed(report, name) {
  const g = report.groups.find((x) => x.name === name);
  return !!g && g.errors.length > 0;
}

const VALID = readFileSync(resolve(ROOT, WORKFLOW_FILE), "utf8").replace(/\r\n/g, "\n");

// Anchors that must exist verbatim in the shipped workflow.
const CANDIDATE_BLOCK =
  "      - name: Guard public-data candidate delta (gate)\n" +
  "        run: python scripts/verify_public_data_delta.py";
const SETUP_NODE_BLOCK =
  "      - name: Setup Node (offline recert gates)\n" +
  "        uses: actions/setup-node@v4\n" +
  "        with:\n" +
  '          node-version: "20"';
const COMMIT_NAME = "      - name: Commit and push if data changed";
const MARKET_ALERT = 'python scripts/fetch_market_alerts.py || echo "market-alerts skipped"';
const ADD_LINE = "          git add public/data/stocks.json public/data/prices public/data/market-alerts.json";

function must(anchor) {
  if (!VALID.includes(anchor)) throw new Error(`fixture anchor missing from real workflow:\n${anchor}`);
  return anchor;
}

function main() {
  // Guard: every anchor the mutations rely on is really in the shipped file.
  [CANDIDATE_BLOCK, SETUP_NODE_BLOCK, COMMIT_NAME, MARKET_ALERT, ADD_LINE].forEach(must);

  // -------------------------------------------------------------------------
  // §1  the real workflow passes every check
  // -------------------------------------------------------------------------
  const good = evaluateWorkflow(VALID);
  check("§1a real workflow passes overall", good.ok === true);
  check("§1b no group reports an error", good.groups.every((g) => g.errors.length === 0));
  const order = GATES.map((g) => g.key);
  check("§1c all ordered gates + commit are located", order.every((k) => good.locate[k] !== undefined) && good.locate.commit !== undefined);
  check("§1d gates precede commit and commit is last", order.every((k) => good.locate[k] < good.locate.commit) && good.locate.commit === good.steps.length - 1);
  check("§1e gates are in the documented order", order.every((k, i) => i === 0 || good.locate[order[i - 1]] < good.locate[k]));

  // -------------------------------------------------------------------------
  // §2  ordering violations
  // -------------------------------------------------------------------------
  {
    // Move the candidate guard to AFTER the commit step (append at end of file).
    const moved = VALID.replace("\n" + CANDIDATE_BLOCK, "") + "\n" + CANDIDATE_BLOCK + "\n";
    const rep = evaluateWorkflow(moved);
    check("§2a gate after commit -> ordering fails", groupFailed(rep, "ordering") && !rep.ok);
    check("§2b gate still located exactly once (presence OK)", !groupFailed(rep, "gate-presence") && rep.locate.candidate > rep.locate.commit);
  }
  {
    // A trailing no-op step after commit makes commit no longer last.
    const trailer = VALID + "\n      - name: Trailing step\n        run: echo done\n";
    const rep = evaluateWorkflow(trailer);
    check("§2c extra step after commit -> ordering fails (commit not last)", groupFailed(rep, "ordering") && !rep.ok);
  }

  // -------------------------------------------------------------------------
  // §3  fail-closed violations
  // -------------------------------------------------------------------------
  {
    const ce = VALID.replace(CANDIDATE_BLOCK, CANDIDATE_BLOCK.replace("\n        run:", "\n        continue-on-error: true\n        run:"));
    const rep = evaluateWorkflow(ce);
    check("§3a gate continue-on-error: true -> fail-closed fails", groupFailed(rep, "fail-closed") && !rep.ok);
  }
  {
    const cond = VALID.replace(CANDIDATE_BLOCK, CANDIDATE_BLOCK.replace("\n        run:", "\n        if: always()\n        run:"));
    const rep = evaluateWorkflow(cond);
    check("§3b gate with a step-level if: -> fail-closed fails", groupFailed(rep, "fail-closed") && !rep.ok);
  }
  {
    const swallow = VALID.replace(
      "run: python scripts/verify_public_data_delta.py",
      "run: python scripts/verify_public_data_delta.py || true",
    );
    const rep = evaluateWorkflow(swallow);
    check("§3c gate run body with `||` -> fail-closed fails", groupFailed(rep, "fail-closed") && !rep.ok);
  }
  {
    // Force the commit step to run despite a failed gate.
    const always = VALID.replace(COMMIT_NAME + "\n", COMMIT_NAME + "\n        if: always()\n");
    const rep = evaluateWorkflow(always);
    check("§3d commit with if: always() -> fail-closed fails", groupFailed(rep, "fail-closed") && !rep.ok);
  }

  // -------------------------------------------------------------------------
  // §4  gate presence
  // -------------------------------------------------------------------------
  {
    const missing = VALID.replace("\n" + CANDIDATE_BLOCK, "");
    const rep = evaluateWorkflow(missing);
    check("§4a removed candidate guard -> presence fails", groupFailed(rep, "gate-presence") && !rep.ok);
  }
  {
    const dup = VALID.replace(CANDIDATE_BLOCK, CANDIDATE_BLOCK + "\n" + CANDIDATE_BLOCK);
    const rep = evaluateWorkflow(dup);
    check("§4b duplicated gate -> presence fails", groupFailed(rep, "gate-presence") && !rep.ok);
  }
  {
    const noNode = VALID.replace("\n" + SETUP_NODE_BLOCK, "");
    const rep = evaluateWorkflow(noNode);
    check("§4c npm gates without setup-node -> node-setup fails", groupFailed(rep, "node-setup") && !rep.ok);
  }

  // -------------------------------------------------------------------------
  // §5  frozen fields
  // -------------------------------------------------------------------------
  {
    const rep = evaluateWorkflow(VALID.replace("0 8 * * 1-5", "0 9 * * 1-5"));
    check("§5a changed cron -> frozen fails", groupFailed(rep, "frozen-fields") && !rep.ok);
  }
  {
    const rep = evaluateWorkflow(VALID.replace('user.name "ornscore-bot"', 'user.name "evil-bot"'));
    check("§5b changed bot identity -> frozen fails", groupFailed(rep, "frozen-fields") && !rep.ok);
  }
  {
    const rep = evaluateWorkflow(VALID.replace(ADD_LINE, "          git add public/data/stocks.json public/data/prices"));
    check("§5c dropped commit add-path -> frozen fails", groupFailed(rep, "frozen-fields") && !rep.ok);
  }
  {
    // Remove the market-alert non-blocking `|| echo` policy.
    const rep = evaluateWorkflow(VALID.replace(MARKET_ALERT, "python scripts/fetch_market_alerts.py"));
    check("§5d market-alert `|| echo` removed -> frozen fails", groupFailed(rep, "frozen-fields") && !rep.ok);
  }
  {
    const rep = evaluateWorkflow(VALID.replace("timeout-minutes: 30", "timeout-minutes: 45"));
    check("§5e changed timeout -> frozen fails", groupFailed(rep, "frozen-fields") && !rep.ok);
  }
  {
    const rep = evaluateWorkflow(VALID.replace("cancel-in-progress: false", "cancel-in-progress: true"));
    check("§5f flipped concurrency cancel-in-progress -> frozen fails", groupFailed(rep, "frozen-fields") && !rep.ok);
  }
  {
    const rep = evaluateWorkflow(VALID.replace('daily refresh $(date', 'daily push $(date'));
    check("§5g changed commit message format -> frozen fails", groupFailed(rep, "frozen-fields") && !rep.ok);
  }

  // -------------------------------------------------------------------------
  // §6  no secret in workflow source
  // -------------------------------------------------------------------------
  {
    const leak = VALID.replace(COMMIT_NAME, "      # AKIA0123456789ABCD\n" + COMMIT_NAME);
    const rep = evaluateWorkflow(leak);
    check("§6a secret-looking value -> no-secret fails", groupFailed(rep, "no-secret") && !rep.ok);
  }

  // -------------------------------------------------------------------------
  // §7  determinism + input purity + parser sanity
  // -------------------------------------------------------------------------
  {
    const a = evaluateWorkflow(VALID);
    const b = evaluateWorkflow(VALID);
    check("§7a two runs produce identical evidence", JSON.stringify(a) === JSON.stringify(b));
    const before = VALID;
    evaluateWorkflow(VALID);
    check("§7b input text is not mutated", VALID === before);
    const steps = parseWorkflowSteps(VALID);
    check("§7c parser finds the commit step as the last step", steps[steps.length - 1].name === "Commit and push if data changed");
    check("§7d parser captures no step-level if: on the commit step", steps[steps.length - 1].ifCond === null);
  }

  console.log("");
  if (failed > 0) {
    console.error(`DAILY-WORKFLOW-GATE SELF-TEST FAILED (${failed} check${failed === 1 ? "" : "s"}).`);
    process.exit(1);
  }
  console.log("DAILY-WORKFLOW-GATE SELF-TEST PASSED. Ordering, fail-closed, frozen-field, and presence checks all verified.");
  process.exit(0);
}

main();
