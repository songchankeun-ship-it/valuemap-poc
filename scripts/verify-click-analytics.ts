// Regression guard for the delegated `data-analytics-event` click contract.
// Run: npx tsx scripts/verify-click-analytics.ts (exits non-zero on any FAIL).
//
// Verifies four things about src/lib/clickAnalytics.ts + actual component usage:
//   1. sanitizeClickProps keeps only allow-listed keys and drops everything else
//      (including sensitive junk) for documented events, and emits no props for
//      unknown events.
//   2. No allow-listed property key names a sensitive concept (email, query,
//      name, message, note, free-form text, ...).
//   3. Every `data-analytics-event="X"` in the source has a contract entry, and
//      every sibling `data-analytics-<key>` attribute is in that event's list.
//      This catches a new event/attribute shipping without a contract update.
//   4. No contract event is dead (every event is used at least once in source).
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  CLICK_EVENT_PROP_KEYS,
  FORBIDDEN_PROP_KEY_SUBSTRINGS,
  sanitizeClickProps,
} from "../src/lib/clickAnalytics";

let failed = 0;
function check(name: string, cond: boolean): void {
  if (!cond) {
    failed++;
    console.error(`FAIL: ${name}`);
  }
}

// --- 1. Runtime sanitizer behaviour -----------------------------------------

// Documented event: only allow-listed keys survive; sensitive junk is dropped.
const junk = {
  ticker: "005930",
  rank: "1",
  slot: "featured",
  email: "user@example.com",
  q: "s3cr3t-search-term",
  note: "free-form user note",
  message: "https://evil.example",
};
const cleaned = sanitizeClickProps("home_candidate_open", junk);
check("home_candidate_open keeps ticker", cleaned.ticker === "005930");
check("home_candidate_open keeps rank", cleaned.rank === "1");
check("home_candidate_open keeps slot", cleaned.slot === "featured");
check(
  "home_candidate_open drops all non-allow-listed keys",
  Object.keys(cleaned).sort().join(",") === "rank,slot,ticker",
);
const cleanedSerialized = JSON.stringify(cleaned);
for (const secret of ["user@example.com", "s3cr3t-search-term", "free-form user note", "evil.example"]) {
  check(`sanitized props do not leak "${secret}"`, !cleanedSerialized.includes(secret));
}

// Unknown event: name still usable by caller, but no props are forwarded.
check(
  "unknown event emits no props",
  Object.keys(sanitizeClickProps("not_a_real_event", { ticker: "005930" })).length === 0,
);

// Absent allow-listed keys are simply not added (no undefined noise).
check(
  "missing allow-listed key is omitted",
  !("rank" in sanitizeClickProps("home_candidate_open", { ticker: "005930" })),
);

// --- 2. No sensitive key names in the contract ------------------------------

for (const [event, keys] of Object.entries(CLICK_EVENT_PROP_KEYS)) {
  check(`${event} has at least one prop key`, keys.length > 0);
  check(`${event} keys are unique`, new Set(keys).size === keys.length);
  for (const key of keys) {
    const lower = key.toLowerCase();
    for (const bad of FORBIDDEN_PROP_KEY_SUBSTRINGS) {
      check(`${event} key "${key}" is not sensitive (${bad})`, !lower.includes(bad));
    }
  }
}

// --- 3. Source usage matches the contract -----------------------------------

const SRC_DIR = join(__dirname, "..", "src");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith(".tsx")) out.push(full);
  }
  return out;
}

// kebab attribute suffix -> camelCase dataset/prop key (`has-next` -> `hasNext`).
function toPropKey(kebab: string): string {
  return kebab.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());
}

const EVENT_RE = /data-analytics-event="([^"]+)"/;
const ATTR_RE = /data-analytics-([a-z-]+)=/;

// Components format all `data-analytics-*` attributes for one element on
// consecutive lines. Group maximal runs of adjacent analytics-bearing lines,
// then read the event name + sibling prop keys from each group.
type Usage = { event: string; keys: Set<string>; file: string; line: number };
const usages: Usage[] = [];

for (const file of walk(SRC_DIR)) {
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  let group: { event: string | null; keys: Set<string>; line: number } | null = null;

  const flush = () => {
    if (group && group.event) {
      usages.push({ event: group.event, keys: group.keys, file, line: group.line });
    }
    group = null;
  };

  lines.forEach((raw, idx) => {
    if (!raw.includes("data-analytics-")) {
      flush();
      return;
    }
    if (!group) group = { event: null, keys: new Set(), line: idx + 1 };
    const eventMatch = raw.match(EVENT_RE);
    if (eventMatch) {
      group.event = eventMatch[1];
      return;
    }
    const attrMatch = raw.match(ATTR_RE);
    if (attrMatch) group.keys.add(toPropKey(attrMatch[1]));
  });
  flush();
}

check("found at least one click-event usage in source", usages.length > 0);

const usedEvents = new Set<string>();
for (const usage of usages) {
  usedEvents.add(usage.event);
  const allowed = CLICK_EVENT_PROP_KEYS[usage.event];
  const where = `${usage.event} (${usage.file.split(/[\\/]/).slice(-1)[0]}:${usage.line})`;
  check(`${where} has a contract entry`, Boolean(allowed));
  if (!allowed) continue;
  const allowSet = new Set(allowed);
  for (const key of usage.keys) {
    check(`${where} attribute "${key}" is allow-listed`, allowSet.has(key));
  }
}

// --- 4. No dead contract events ---------------------------------------------

for (const event of Object.keys(CLICK_EVENT_PROP_KEYS)) {
  check(`contract event "${event}" is used in source`, usedEvents.has(event));
}

if (failed > 0) {
  console.error(`click-analytics verification FAILED (${failed} check${failed === 1 ? "" : "s"})`);
  process.exit(1);
}
console.log(
  `PASS click-analytics: ${Object.keys(CLICK_EVENT_PROP_KEYS).length} contract events, ${usages.length} source usages checked`,
);
