// One finite local "reaudit" gate for OrnScore: the single command that
// re-certifies every focused source contract produced by the 2026-07-15 public
// reaudit remediation batch (Slices A-M). Slice N consolidation.
//
// WHY THIS EXISTS
// ---------------
// Each remediation slice shipped its own focused regression verifier
// (`npm run test:<slice>`). Running them one by one is easy to get wrong: a
// maintainer forgets one, or stops at the first green output. This script
// encodes the full A-M set once, in slice order, so re-certifying the reaudit
// contracts is a single deterministic command with one summary table.
//
// It is SERVER-INDEPENDENT: every gate here is a pure/static source contract
// test (no HTTP, no running app). Like every verifier in this repo, THIS SCRIPT
// NEVER STARTS OR STOPS A SERVER. Route-health, build, and local production
// verification remain the job of `verify:local` / `release:preflight`; this
// command only proves the source contracts still hold.
//
// USAGE
// -----
//   npm run verify:reaudit            # run all A-M contract verifiers
//   npm run verify:reaudit -- --list  # print the slice->verifier map and exit 0
//
// Exit code: 1 if any verifier failed, else 0.

import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPTS_DIR, "..");

// The reaudit contract verifiers, one per remediation slice (A-M), in order.
// `script` is the package.json script name; `env` is applied on top of the
// current environment (the Python audit gate needs UTF-8 on Windows).
const GATES = [
  { slice: "A", name: "activity-surge", script: "test:activity-surge", concern: "one activity-surge object on Today (count===items.length)" },
  { slice: "B", name: "score-comparison", script: "test:score-comparison", concern: "date-aware score comparison basis" },
  { slice: "C", name: "status-dimensions", script: "test:status-dimensions", concern: "user-facing status dimensions + public status scan" },
  { slice: "D", name: "trading-activity", script: "test:trading-activity", concern: "trading activity means volume everywhere" },
  { slice: "E", name: "today-insight", script: "test:today-insight", concern: "no untraceable generated Today insight" },
  { slice: "F", name: "score-scale", script: "test:score-scale", concern: "comparative score + input-completeness copy" },
  { slice: "G", name: "momentum-regime", script: "test:momentum-regime", concern: "momentum regime + risk-efficiency + sector value copy" },
  { slice: "H", name: "seo-stability", script: "test:seo-stability", concern: "stable stock SEO metadata + deterministic sitemap" },
  { slice: "I", name: "stocks-discovery", script: "test:stocks-discovery", concern: "bounded discovery density + terminology" },
  { slice: "J", name: "compare-entry", script: "test:compare-entry", concern: "compare start + auth CTA clarity" },
  { slice: "K", name: "disclosure-hierarchy", script: "test:disclosure-hierarchy", concern: "disclosure information hierarchy" },
  { slice: "L", name: "legal-consistency", script: "test:legal-consistency", concern: "privacy/terms/deletion + data-rights matrix" },
  {
    slice: "M",
    name: "methodology-audit",
    script: "test:methodology-audit",
    concern: "honest backtest label + deterministic methodology audit",
    env: { PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8" },
  },
];

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function pad(str, width) {
  str = String(str);
  return str.length >= width ? str : str + " ".repeat(width - str.length);
}

if (hasFlag("--list")) {
  console.log("OrnScore reaudit contract verifiers (Slices A-M):");
  for (const g of GATES) {
    console.log(`  ${g.slice}  ${pad(`npm run ${g.script}`, 34)}${g.concern}`);
  }
  process.exit(0);
}

function runGate(gate) {
  const banner = `===== Slice ${gate.slice} — ${gate.name} (${gate.script}) =====`;
  console.log(`\n${banner}`);
  const run = spawnSync("npm", ["run", gate.script], {
    stdio: "inherit",
    cwd: ROOT,
    shell: true,
    env: gate.env ? { ...process.env, ...gate.env } : process.env,
  });
  const code = run.status ?? 1;
  return { slice: gate.slice, name: gate.name, code, failed: code !== 0 };
}

console.log("OrnScore public-reaudit contract recertification (Slices A-M, server-independent).");
console.log(`${GATES.length} focused verifiers. This does NOT start a server or run the build.`);

const results = [];
for (const gate of GATES) {
  results.push(runGate(gate));
}

console.log(`\n${"=".repeat(52)}`);
console.log("REAUDIT CONTRACT SUMMARY");
console.log("=".repeat(52));
const header = `${pad("slice", 7)}${pad("verifier", 24)}${pad("exit", 6)}result`;
console.log(header);
console.log("-".repeat(header.length));
for (const r of results) {
  console.log(`${pad(r.slice, 7)}${pad(r.name, 24)}${pad(r.code, 6)}${r.failed ? "FAIL" : "OK"}`);
}
console.log("");

const failed = results.filter((r) => r.failed);
const passed = results.length - failed.length;
console.log(`Reaudit contracts: ${passed}/${results.length} passed.`);

if (failed.length) {
  console.log(`REAUDIT RECERTIFICATION FAILED (${failed.map((r) => `Slice ${r.slice}`).join(", ")}).`);
  process.exit(1);
}

console.log("REAUDIT RECERTIFICATION PASSED. All A-M source contracts hold.");
process.exit(0);
