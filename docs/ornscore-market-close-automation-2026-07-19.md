# ORNScore market-close operations automation — governing plan (2026-07-19)

Batch: bounded market-close operations automation.
Slice A (this document + first implementation): a deterministic, **read-only**
health verifier for the owner's public ORNScore URL.
Branch: `ai-center/task-368-ornscore-market-ops-a-read-only-mark`.
Base HEAD at plan authoring: `e4ed741`.
Toolchain: Node `v24.16.0` (repo Next 15.5.18 / react 19.2.x — unchanged).

This batch adds finite, read-only operator tooling around the daily market-close
publication cycle. It does **not** run the data refresh, push, deploy, or mutate
any outside service, account, workflow, or runtime value. Public Metrics 2.4,
`public/data`, the 138-stock universe, login/auth behavior, Supabase/runtime
values, SEO route ownership, `.github/workflows`, and Next/React/dependency
versions are frozen for the whole batch.

---

## 1. Problem Slice A solves

After the Korean market closes, the daily-data workflow refreshes `public/data`,
commits it, and the hosting platform rebuilds and republishes the site. An
operator (human or an automation loop) needs one bounded command that answers a
single question against a supplied public base URL:

> "Is the live ORNScore surface currently healthy and serving the state this
> repo represents — and if it is *not yet* fresh, is that because publication is
> still legitimately in-flight (hold and re-check), or because something is
> actually broken (stop)?"

The distinguishing feature versus the existing route-canary / commit-status
verifiers is the **three-way market-aware verdict**:

- **PASS** — the live surface is healthy and freshness is satisfied.
- **WAIT** — nothing is broken, but fresh publication is not due yet or not
  confirmable yet: a weekend/holiday (no publication expected today), or a
  documented post-close publication grace window (the build may still be
  deploying). The operator should hold and re-run later; this is **not** a
  failure.
- **FAIL** — a real defect that must stop the cycle: a broken route, malformed
  data, universe drift (≠ 138), Metrics drift (≠ 2.4), an auth-language
  regression, a broken SEO surface (sitemap/robots), or — when the operator
  explicitly supplies `--expected-sha` — a served build-marker mismatch.

Fail-closed is the rule: any hard defect outranks any WAIT window, and an
unreachable/ambiguous state past the grace window is FAIL, never a silent PASS.

## 2. Non-goals (explicitly out of Slice A)

- No data refresh, compute, commit, push, deploy, or workflow trigger.
- No form submission, login round-trip, or any state change on any remote/outside
  service. All HTTP is **GET-only** and finite.
- No new runtime code, no route/SEO ownership change, no dependency, no
  Metrics 2.5.1 promotion (it stays shadow-only; public stays Metrics 2.4).
- No change to `public/data`, the 138-stock output, or the public Metrics label.

## 3. Reuse — no duplicated business logic

Slice A composes the **already-shipped, exported** contract primitives rather
than re-implementing them:

| Contract | Reused from | What is reused |
| --- | --- | --- |
| Bounded GET + failure classes | `scripts/verify-route-canary.mjs` | `fetchBounded`, `DEFAULT_BOUNDS`, `DEFAULT_ROUTES`, `visibleText`, `hasNonEmptyTitle`, `hasCanonical`, `extractBuildMarker`, `buildExpected`, `deriveBusinessDate` |
| Data date / Metrics label expectation | `buildExpected` (above) | expected `dataDate` + `metricsVersionLabel` derived from **local** `public/data/stocks.json` (never from memory) |
| Sitemap / robots crawl contract | `scripts/verify-public-seo.mjs` | `checkSitemap`, `checkRobots`, `checkCrossConsistency`, `expectedLastmodIso` |
| Served build-marker (footer SHA) | `extractBuildMarker` (above) | the `title="코드 <7-hex>"` footer marker contract |
| Secret-leak guard | `scripts/verify-framework-baseline.mjs` | `looksLikeSecret` over all emitted evidence |
| Auth-language (Korean-only) contract | login-preflight marker set (constants) | `lang="ko"` present + no `hreflang` / `lang="en"` / `LanguageSwitcher`; baseline provider buttons present |

The 138-stock universe and the Metrics 2.4 label are enforced as **frozen
constants** (`EXPECTED_UNIVERSE = 138`, `EXPECTED_METRICS = "2.4"`) matching the
batch freeze, checked against both the local dataset and the served surface.

## 4. Verdict model

### 4.1 Temporal window (pure, injectable clock/calendar)

`classifyTemporal({ now, calendar, closeMinutes, graceMinutes })` works entirely
in KST (fixed +09:00, no DST) and returns exactly one window:

- `non_trading_day` → **WAIT** — `now` (KST date) is a Saturday/Sunday
  (reason `weekend`) or a listed market holiday (reason `holiday`). No fresh
  publication is due today.
- `pre_publication` → **WAIT-eligible** — a trading day but KST time-of-day is
  before the **publication deadline** = `closeMinutes + graceMinutes`
  (default close 15:30 KST, grace 210 min → 19:00 KST, comfortably past the
  17:00 KST `0 8 * * 1-5` cron plus build/deploy lead). This is the documented
  post-close publication grace window (it also covers any pre-close run, which
  is even more clearly "nothing fresh due yet").
- `enforcing` → a trading day at/after the deadline; freshness must be live.

The clock (`--now`) and calendar (`--calendar`) are injectable so the classifier
is fully deterministic and testable. The default holiday list is a documented,
**best-effort, owner-overridable** set of 2026 KRX closures; weekend detection is
the always-authoritative part and never depends on the list.

### 4.2 Health findings (per dimension)

Each check yields findings tagged `severity: "hard" | "freshness"`:

- **hard** — a real defect regardless of the calendar: broken/unreachable route,
  non-200/unexpected redirect, missing `<title>`/canonical, served Metrics label
  ≠ `Metrics 2.4` (metrics drift), served universe count text missing / local
  universe ≠ 138 (universe drift), malformed local data, sitemap/robots contract
  violation, auth-language regression, and — when `--expected-sha` is supplied —
  a **present** served marker that differs from it (explicit SHA mismatch).
- **freshness** — a "not yet fresh" signal that is legitimate inside a WAIT
  window: the served visible data date lags the expected (local) date, or (with
  `--expected-sha`) the footer marker is **absent** (deploy may still be in
  flight).

### 4.3 Overall verdict (`classifyOverall`)

1. Any **hard** finding present → **FAIL** (fail-closed; outranks every window).
2. Else `non_trading_day` → **WAIT** (weekend/holiday; structural health still
   reported).
3. Else `pre_publication`:
   - a freshness deferral present → **WAIT** (post-close grace; re-run later);
   - otherwise → **PASS** (already fresh / marker already matches).
4. Else `enforcing`:
   - a freshness deferral present → **FAIL** (`stale_publication` /
     `deploy_marker_absent` — past the deadline, staleness is a real failure);
   - otherwise → **PASS**.

Exit code: `0` for PASS, `0` for WAIT (a WAIT is a healthy "hold", not an error —
it must not break an operator loop), `1` for FAIL and for any usage error.
`--json` emits deterministic (timestamp-free), userinfo-redacted, secret-guarded
evidence; the operator can branch on the `verdict` field.

> Rationale for WAIT → exit 0: a market-close loop polling this verifier must be
> able to distinguish "stop, something is broken" (exit 1) from "not yet, hold"
> (exit 0 + `verdict:"WAIT"`). The JSON `verdict`/`reason` carry the precise
> state; the exit code only gates the hard-stop path.

## 5. Bounds & safety

Every axis is finite (inherited from `DEFAULT_BOUNDS`): per-request timeout,
total wall-clock, redirect hops, response bytes, and total request count. The
verifier issues only GET requests, starts no server, leaves no listener, sends no
cookies, submits no forms, and calls no live Search Console / provider API. A
live GET-only smoke against `https://ornscore.com` is permitted as a finite read
only; it changes no outside state. Emitted evidence is scanned with
`looksLikeSecret` and refuses to print if a credential-shaped value appears;
base/URL userinfo is redacted.

## 6. Tests (`scripts/test-market-close-health.mjs`)

Deterministic and offline. Pure classifiers are exercised directly with injected
clock/calendar/data; the HTTP path is driven against a **task-owned loopback**
mock server on `127.0.0.1` (ephemeral port), never a live service. Fail-closed
negative controls prove each FAIL family bites and that WAIT is not vacuous:

- Healthy controls (PASS on an enforcing day; WAIT on a weekend / in grace).
- Broken route (404 / missing title) → FAIL.
- Universe drift (≠ 138) and Metrics drift (≠ 2.4), local + served → FAIL.
- Malformed local data → FAIL.
- Auth-language regression (`lang="en"` / toggle marker) → FAIL.
- Sitemap/robots contract violation → FAIL.
- Explicit `--expected-sha` mismatch (served marker present but different) → FAIL;
  marker **absent** with `--expected-sha` → WAIT in grace, FAIL when enforcing.
- Stale served data date → WAIT inside the grace window, FAIL past it (same
  fixture, only the injected clock changes — proving the temporal boundary).
- The loopback server is **stopped and proven stopped** at the end.

## 7. Frozen-boundary commitments (verified each slice)

`public/data` tree + `stocks.json` blob byte-identical; 138 stocks; Metrics 2.4;
`src/app/login` + `src/app/auth` unchanged; `.github/workflows` unchanged;
Supabase/runtime values, analytics names, SEO route ownership, Next/React and all
dependency versions unchanged. New surface is confined to two `scripts/*.mjs`
files (`.mjs` importing `.mjs`, no runtime TypeScript imported), two
`package.json` dev-script aliases, this plan, `PROGRESS.md`, and
`docs/AI_HANDOFF.md`.

## 8. Owner-only follow-up (NOT performed here)

Push, deploy of any commit, live-marker confirmation after a real deploy, Search
Console / Naver submission, wiring this verifier into CI/hosting, and any
Metrics 2.5.1 promotion remain owner decisions. This slice verifies the live
surface read-only and stops.

---

# Slice B — fail-closed market-day input adapter (2026-07-19)

Branch: `ai-center/task-369-ornscore-market-ops-b-private-metric`.
Base HEAD at Slice B authoring: `3e7a4ba` (Slice A).
Surface: two new Python scripts + two `package.json` dev aliases + this section +
`PROGRESS.md`/`docs/AI_HANDOFF.md`. Frozen boundaries of §7 stay in force.

## B.1 Problem Slice B solves

Slice A verifies the *published* surface read-only. Slice B is the **input
front-end** for the Metrics 2.5.1 shadow pipeline: it assembles **exactly one
genuine market-day run request + trading calendar** from ORNScore-owned public
envelope data (`public/data/stocks.json` + `public/data/prices/{ticker}.json`)
**or** an explicit local fixture of the same layout, and writes it **only** under
the private, Git-ignored `.metrics251-shadow/inputs/` tree. It sits *before*
preflight (Slice M) / run (Slice N): it **assembles only and never runs** — a
genuine shadow run remains an owner decision (runbook §6, Gate 6).

The operations runbook (`docs/metrics-2.5.1-operations-runbook.md` §6.1) requires
each trading day's `request-D.json` to carry real 138-stock inputs, pinned source
dates, and a calendar. Slice B is the deterministic, fail-closed producer of that
artifact — the missing bridge between the public data envelope and the run layer.

## B.2 Fail-closed contract (prove-or-refuse)

The adapter emits a **promotable** `request.json` **only** when every field below
is *proven* from the supplied envelope. If any cannot be proven it returns a
precise, sorted, machine-readable reason (a `MISSING_INPUT` / `STALE_SOURCE`-class
code) and **writes no promotable request** (no partial artifact). It never
invents, forward-fills, estimates, or silently substitutes a value:

1. **Universe** — exactly 138 unique, present tickers (`UNIVERSE_COUNT_MISMATCH`,
   `DUPLICATE_TICKER`, `TICKER_MISSING`, `PRICE_SERIES_MISSING`).
2. **Exact, mutually consistent source dates** — `prices == volumes == marketDate`
   (both read from the same price point) and `fundamentals` (=
   `meta.asOfBusinessDate`, normalized) **equal** to `marketDate`; any drift is
   `SOURCE_DATE_MISMATCH` / `SOURCE_DATE_STALE` / `SOURCE_DATE_FUTURE` /
   `SOURCE_DATE_MISSING` / `SOURCE_DATE_MALFORMED`.
3. **Sufficient real history** — `≥` the config minima (derived, not hardcoded:
   253 price points, 20 volume points) so no factor nulls out
   (`INSUFFICIENT_PRICE_HISTORY`, `INSUFFICIENT_VOLUME_HISTORY`).
4. **Required PER/PBR** — present, finite, positive; a `valueNA` flag counts as
   missing (`FUNDAMENTAL_MISSING`, `FUNDAMENTAL_NON_POSITIVE`).
5. **A common actual trading date** — every price series ends on the *same* date,
   and that date is a real calendar trading day (`MARKET_DATE_AMBIGUOUS`,
   `MARKET_DATE_NOT_TRADING_DAY`, `CALENDAR_MISSING`, `CALENDAR_UNCOVERED`).
6. **No future / stale dates** — enforced by (2) and the calendar.
7. **No synthetic/test markers** — the envelope is scanned by the reused
   `genuine_run_gate` (Slice Q) plus a defensive `source`/`note` text scan
   (`SYNTHETIC_MARKER_PRESENT`); the *emitted* request is proven marker-free so it
   is genuinely promotable.
8. **Deterministic ordering/hashes** — stocks sorted by ticker, canonical
   (`sort_keys`) serialization, and a derived `expected` pin (engineVersion +
   `configHash` + `inputManifestHash` + marketDate + sourceDates) computed with the
   same primitives the run layer uses, plus an `assemblyHash`.
9. **No unresolved input ambiguity** — divergent price end-dates, unnormalizable
   business dates, malformed points, and non-finite prices/volumes all refuse
   (`MARKET_DATE_UNRESOLVED`, `PRICE_NON_POSITIVE`, `VOLUME_NEGATIVE`,
   `ENVELOPE_MALFORMED`).

**Output-location guard**: the target is always `<shadow-root>/inputs/`; if it
resolves under `public/` (`OUTPUT_NOT_PRIVATE`) or outside the `inputs/` subtree
(`OUTPUT_NOT_UNDER_INPUTS`), the adapter writes **nothing** regardless of assembly
success. Any unexpected exception is absorbed as `INTERNAL_ERROR` (fail-closed).

## B.3 Reuse — no duplicated business logic

| Contract | Reused from | What is reused |
| --- | --- | --- |
| Canonical serialization + hashes | `metrics251_config` | `canonical_bytes`, `config_hash`, `CONFIG_PATH` |
| Engine identity / input manifest | `metrics251_engine` | `ENGINE_VERSION`, `EngineRequest`, `_input_manifest_hash` (for the `expected` pin, identical to `run.derive_expected`) |
| Private-root layout + atomic write | `metrics251_snapshot_store` | `DEFAULT_SHADOW_ROOT`, `RUNS_SUBDIR`, `_atomic_write_bytes` |
| Synthetic-marker rejection | `metrics251_e2e_matrix` | `genuine_run_gate`, `carries_synthetic_marker`, `SYNTHETIC_MARKER` |
| Trading calendar | `metrics251_compare` | `FixtureTradingCalendar` |
| History minima | `config/metrics/2.5.1.json` | momentum/activity/riskAdjusted minimums (derived at runtime) |

The assembled `request.json` is exactly the shape `preflight_market_day` /
`run_market_day` consume (marketDate, sourceDates, stocks, expected); the tests
prove the artifact is preflight-clean and engine-runnable.

## B.4 Current public envelope → honest MISSING_INPUT (verified read-only)

A GET-only compatibility inspection of the live owner surface / local
`public/data` shows the current envelope has all 138 price series ending on a
single common trading date (`2026-07-16`, ≥974 points each), but **one ticker
(`088980`) has `per`/`pbr` = null (`valueNA: true`)**. Running the adapter against
it therefore returns `FAIL / FUNDAMENTAL_MISSING`, exit 2, and writes **no**
promotable request — the correct fail-closed outcome ("the current public envelope
cannot prove a required field"). This is a demonstration of the guard, **not** a
defect to paper over: no value is invented to force a pass.

## B.5 Tests (`scripts/test_metrics251_market_input.py`)

21 deterministic, offline cases over tempdir fixtures (never `public/data`):
happy-path assembly **+ write + preflight/engine acceptance**; corrupt; partial
(missing price file / missing PER-PBR); stale; mixed-date; duplicate;
synthetic-marker (structural + text); **public-path-write rejection** (and no
`public/` leak); insufficient history; future source date; non-trading day;
missing calendar; universe-count drift; non-positive PER/PBR; non-positive price +
negative volume; config engine mismatch; determinism (byte-identical request +
`assemblyHash`); source purity (no wall-clock / RNG / network API); and
no-write-on-failure.

## B.6 Non-goals / owner-only follow-up (NOT performed here)

No genuine shadow run, no preflight/run invocation on real data, no promotion, no
push/deploy/publish, no change to `public/data`, the 138-stock output, Metrics 2.4,
login/auth, Supabase/runtime values, `.github/workflows`, SEO ownership, or
Next/React/dependency versions. Wiring the adapter into the run layer for a real
trading-day window remains an owner decision behind runbook §6 / Gate 6.

---

# Slice C — finite, idempotent one-market-day private shadow orchestrator (2026-07-19)

Branch: `ai-center/task-370-ornscore-market-ops-c-private-one-da`.
Base HEAD at Slice C authoring: `ff1bbc5` (Slice B).
Surface: two new Python files (`scripts/metrics251_orchestrator.py` +
`scripts/test_metrics251_orchestrator.py`) + two `package.json` dev aliases + this
section + a runbook §6.5 operator note + `PROGRESS.md`/`docs/AI_HANDOFF.md`. Frozen
boundaries of §7 stay in force.

## C.1 Problem Slice C solves

Slices A/B and the operations layer (Slice M–Q, runbook §6) each answer one
question; a market-close operator still has to run five commands (adapter →
operator READY → run → ledger → gate) in the right order for **exactly one**
trading day, interpret each layer's status, and decide whether the day is done,
should be held, or must stop. Slice C is the single **finite, idempotent**
command that **composes** those already-shipped contracts for one market day and
collapses their combined state into a three-way verdict. It **creates no new
formula, gate, or storage logic** — it only calls Slice B (real-input adapter),
Slice P (operator READY), Slice N (atomic/idempotent run), Slice O (append-only
ledger), and Slice K (5-day AND rollout gate) in sequence and reports.

## C.2 Scheduled selection + first private effective date

- **`--mode scheduled`** (default): the operator may **not** name a market date.
  The orchestrator uses only the **latest complete common trading date proven by
  the adapter** (every price series ends on the same real calendar trading day).
  Nothing else is eligible; a date cannot be asserted into existence.
- **First private effective date**: `--activation-date D` gates eligibility — the
  first private `effectiveMarketDate` is the **first post-activation** trading day
  (`marketDate > D`) that passes *every* genuine-input gate. A proven date at or
  before activation is `WAIT / PRE_ACTIVATION` (hold, no run).
- **`--mode explicit --market-date D`**: for regression/replay only. Proven `< D`
  → `WAIT / INPUT_NOT_FRESH` (envelope not caught up yet); proven `> D` →
  `FAIL / REQUEST_STALE` (the request is stale/ambiguous — fail closed).

## C.3 Three-way verdict (fail-closed)

- **PASS** — the market day is exactly reflected in the private shadow: this run
  promoted it (`PUBLISHED`) or a byte-identical snapshot was already recorded
  (`ALREADY_RECORDED`, no new run). Gate status (PENDING/MET) is **reported only**.
- **WAIT** — nothing is broken but no run can legitimately be produced now, and the
  orchestrator **fabricates nothing**: weekend/holiday (`NON_TRADING_DAY`),
  publication grace / input not finalized (`PUBLICATION_GRACE` — divergent or
  unresolved series end-dates, or a not-yet-fresh fundamentals source date), missing
  current input (`MISSING_CURRENT_INPUT` — envelope/series/PER-PBR not yet landed,
  which is the **current live public-envelope state**, Slice B.4), before activation
  (`PRE_ACTIVATION`), or an overlap lock held by another orchestration (`LOCK_HELD`).
  Exit 0 — a WAIT is a healthy hold, not an error.
- **FAIL** — a real defect that must stop the cycle: `SAME_DATE_CONFLICT` (a
  different/changed input for an already-recorded date), `PARTIAL_RUN`, `QA_FAILED`,
  `SYNTHETIC_MARKER`, `PUBLIC_PATH_LEAK`, `PREFLIGHT_FAILED`, `STALE_SOURCE`,
  `CONFIG_INVALID`, `HASH_MISMATCH` (adapter pin ≠ run-derived pin), `LEDGER_CONFLICT`,
  `PUBLISH_FAILED`, or `INTERNAL_ERROR`. Exit 2.

Fail-closed rule (same as Slice A): any hard defect **outranks** every WAIT window.
The adapter reason set is partitioned into an explicit WAIT allowlist and a
FAIL-by-default remainder — a test proves `WAIT ∪ FAIL == ALL_REASONS` and
`WAIT ∩ FAIL == ∅`, so no hard defect can ever leak into a WAIT.

## C.4 Composition, hashing, locking, and safety

1. **Private-root guard first** — if the shadow root resolves under `public/`, or
   `inputs/` layout is violated, the orchestrator writes nothing and FAILs
   (`PUBLIC_PATH_LEAK`).
2. **Adapter assembles + proves the date** (Slice B); on failure, WAIT/FAIL per the
   partition. On success it writes `inputs/request.json` **only** under the shadow
   root (atomic).
3. **Exact input/config hashes** — the run request consumes the adapter's `expected`
   pin verbatim; the orchestrator independently recomputes `configHash` +
   `inputManifestHash` via `run.derive_expected` and FAILs on any mismatch — no hash
   is re-invented.
4. **Overlap lock** — `<root>/locks/orchestrator.lock` is created with
   `O_CREAT|O_EXCL` (deterministic payload: marketDate + hashes, no wall-clock/PID);
   if held → `WAIT / LOCK_HELD`, released in a `finally`.
5. **Operator READY** (Slice P, read-only) gates the run: `ALREADY_RECORDED` →
   PASS (idempotent, no run); CONFLICT/PARTIAL_RUN/QA_FAILED/MISSING/STALE → FAIL.
6. **Atomic idempotent run** (Slice N) is the only store write; pointer swap only at
   the store's final publish step. Byte-identical re-run = NOOP.
7. **Ledger + gate** (Slice O/K) append from QA-passed manifests and regenerate the
   rollout-gate summary **into the shadow root** (`reports/rollout-gate.{json,md}`),
   never the tracked `docs/` copies. A window `publicPathLeakage` signal → FAIL.

**Determinism**: no wall-clock (`datetime.now`/`time.time`/`date.today`), no RNG,
no network — a source-purity test greps the comment-stripped source for the
forbidden APIs. All routine outputs (reports, locks, inputs, runs, pointer, ledger,
gate docs) stay below `.metrics251-shadow`; a scheduled run dirties **no** tracked
file (test-verified). **Gate MET never triggers public promotion or any external
action** — the report always carries `publicPromotionTriggered:false`,
`externalActionTaken:false`, `readOnlyPublicCanon:true` (§7 Gate 6 is a separate
owner decision).

## C.5 Tests (`scripts/test_metrics251_orchestrator.py`)

21 deterministic, offline cases over tempdir fixtures (never `public/data`):
PASS (scheduled happy-path → PUBLISHED with inputs/run/ledger/gate-docs all under
shadow + gate PENDING; idempotent re-run → ALREADY_RECORDED, no new run); WAIT
(weekend, missing current input, publication grace / divergent end-date, stale
source date, pre-activation, lock held); FAIL (synthetic marker, public-path leak
with no `public/` write, same-date conflict, universe drift, malformed envelope,
explicit request-stale); explicit-mode match/not-fresh/stale; and the invariants —
adapter reason partition, no-tracked-file-dirtied, determinism, source purity, and
no-run-on-WAIT/FAIL. **Live read-only check** (`--source public --no-write`, temp
root): the current public envelope → `WAIT / MISSING_CURRENT_INPUT`
(marketDate `2026-07-16`), exit 0, **no genuine run**, no repo shadow write — the
honest fail-closed hold, consistent with Slice B.4.

## C.6 Non-goals / owner-only follow-up (NOT performed here)

No genuine live market-day run, no 5-consecutive-day window, no promotion, no
push/deploy/publish, no change to `public/data`, the 138-stock output, Metrics 2.4,
login/auth, Supabase/runtime values, `.github/workflows`, SEO ownership, or
Next/React/dependency versions. Driving the orchestrator across a real KRX trading
window (and the Gate 4 → Gate 5 → Gate 6 sequence) remains an owner decision behind
runbook §6.
