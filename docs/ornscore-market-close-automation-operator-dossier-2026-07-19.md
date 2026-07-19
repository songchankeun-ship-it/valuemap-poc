# ORNScore Market-Close Automation — Operator Dossier & Slice A–C Recertification (2026-07-19)

**Task:** 371 — ORNScore Market Ops D — five-day automation recertification + operator dossier.
**Branch:** `ai-center/task-371-ornscore-market-ops-d-five-day-autom`
**HEAD at recert:** `495fdcc` (`ai-center(task 370): ORNScore Market Ops C — private one-day shadow orchestrator`).
**Frozen-boundary comparison base (pre-batch):** `e4ed741` (`ai-center(task 367)` — the commit immediately before Slice A).
**Toolchain observed:** Node `v24.16.0` · Python `3.12.10` · installed `next 15.5.18 / react 19.2.7 / react-dom 19.2.7` (unchanged).

This is a single, finite, **local** recertification of the three shipped market-close
automation slices plus the operator handoff the controlling Codex watchdog needs before it
installs the two owner-approved schedules. **Nothing was pushed, deployed, promoted, or
mutated on any outside service.** No scheduler was activated in this task and **no genuine
market-day shadow run was performed.** Metrics 2.5.1 stays shadow-only; public stays
**Metrics 2.4**; `main` is unchanged.

The three slices under recert:

| Slice | Command alias | Script | Role | Side effects |
|---|---|---|---|---|
| **A** public health monitor | `verify:market-close-health` | `scripts/verify-market-close-health.mjs` | Read-only, GET-only, three-way (PASS/WAIT/FAIL) health verdict for the live public surface | **none** (GET-only) |
| **B** market-day input adapter | `input:metrics251` | `scripts/metrics251_market_input.py` | Fail-closed assembler of one genuine `request.json` from the public envelope into the private shadow tree | private `inputs/` write only |
| **C** one-day shadow orchestrator | `orchestrate:metrics251` | `scripts/metrics251_orchestrator.py` | Finite, idempotent composition of B→P→N→O→K for exactly one market day, three-way verdict | private shadow writes only |

---

## 1. One-line verdict

Slices A, B, and C **recertify green as one unit** on a full local build: every frozen
boundary is proven byte-identical by Git-object identity against `e4ed741`; the public
Metrics 2.4 canon is unchanged (138 stocks, label 2.4); typecheck and the full Next build
pass; every focused test (A/B/C) and the complete Metrics 2.5.1 contract regression battery
(A–K + operations M–Q) pass; a task-owned loopback server drives the finite route tests and
is proven stopped; a finite read-only live smoke against `https://ornscore.com` returns a
healthy weekend WAIT (and PASS/`fresh_confirmed` under an injected enforcing clock); and a
task-owned harness proves the scheduled one-day command leaves **every tracked file clean**
and **cannot promote Metrics 2.5.1 even when a fixture window reaches gate MET**.

**One honest pre-existing residual** was found and is documented in §7: `test:metrics251-baseline`
reports the two `docs/metrics-2.5.1-baseline.{json,md}` snapshots are stale. This is **not a
Slice A–C regression** — its inputs are byte-identical across the whole batch, so its verdict
is invariant across A–C — and regenerating it is outside this task's writable surface. It does
not gate the A–C recert.

---

## 2. Frozen-boundary Git-object proofs (identity, not textual diff)

All proofs use `git rev-parse <ref>:<path>` (object identity). Equal object id ⇒ byte-identical.

| Frozen artifact | base `e4ed741` | HEAD `495fdcc` | worktree | Verdict |
|---|---|---|---|---|
| `public/data` tree | `24045925…` | `24045925…` | — | **identical** |
| `public/data/stocks.json` blob | `c037daf4…` | `c037daf4…` | `c037daf4…` (`git hash-object`) | **identical** |
| `src/lib/metrics.ts` blob | `8d217ca5…` | `8d217ca5…` | — | **identical** |
| `src/app/login` tree | `d8ae30d6…` | `d8ae30d6…` | — | **identical** |
| `src/app/auth` tree | `983db415…` | `983db415…` | — | **identical** |
| `src/middleware.ts` blob | `92efe16b…` | `92efe16b…` | — | **identical** |
| `.github/workflows` tree | `bdffea9c…` | `bdffea9c…` | — | **identical** (`daily-data.yml`) |

Path-scoping proofs (all **empty** output, exit 0): `git diff e4ed741 HEAD -- public/`,
`… -- src/`, `… -- .github/`. → the batch touched **0** files under `public/`, `src/`, or
`.github/`.

**138 stocks / Metrics 2.4:** `PYTHONUTF8=1 python scripts/verify_metrics.py` → *검사 138종목 ·
오류 0건*, brand blocklist 0, formula version **Metrics 2.4** (exit 0).

**Dependency / framework versions unchanged:** the `package.json` delta over
`e4ed741..HEAD` is **exactly 6 added lines** — three script aliases × two
(`input:metrics251`/`test:metrics251-input`, `orchestrate:metrics251`/`test:metrics251-orchestrator`,
and the Slice A `verify:`/`test:market-close-health` pair added earlier in the batch).
Filtering those, the non-alias `+/-` delta is **empty**: `next 15.5.18`, `react ^19.2.0`,
`react-dom ^19.2.0`, `eslint-config-next 15.5.18` byte-identical.

**Whole-batch changed-file set `e4ed741..HEAD`** (exactly the allowed surface — 11 files):
`PROGRESS.md`, `docs/AI_HANDOFF.md`, `docs/metrics-2.5.1-operations-runbook.md`,
`docs/ornscore-market-close-automation-2026-07-19.md`, `package.json`,
`scripts/metrics251_market_input.py` (+ test), `scripts/metrics251_orchestrator.py` (+ test),
`scripts/verify-market-close-health.mjs` (+ test). No runtime TypeScript, route, SEO surface,
or dependency was added.

---

## 3. Offline recertification suite (all green)

| Check | Command | Result |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | **exit 0** |
| Public Metrics 2.4 verifier | `PYTHONUTF8=1 python scripts/verify_metrics.py` | 138 / 0 errors / **Metrics 2.4**, exit 0 |
| Full Next build | `npm run build` | **exit 0** — `/stock/[ticker]` **138** SSG, `/topics/[slug]` **9**, Middleware **90.2 kB** |
| **Slice A** health verifier | `npm run test:market-close-health` | **PASS** — 23 controls, loopback stopped & proven down (§8a/§8b) |
| **Slice B** input adapter | `PYTHONUTF8=1 npm run test:metrics251-input` | **PASS** — 21 cases |
| **Slice C** orchestrator | `PYTHONUTF8=1 npm run test:metrics251-orchestrator` | **PASS** — 21 cases |
| config boundary + canonical | `npm run config:metrics251:check` | PASS (FRESH) |
| config contract | `npm run test:metrics251-config` | PASS |
| primitives / engine / eligibility | `test:metrics251-{primitives,engine,eligibility}` | PASS |
| snapshot-store / compare / replay | `test:metrics251-{snapshot-store,compare,replay}` | PASS |
| projection / rollout-gate (K) | `test:metrics251-{projection,rollout-gate}` | PASS |
| TS contract freshness + read-contract | `contract:metrics251:check` · `test:metrics251-contracts` | PASS (FRESH) |
| **Ops M** preflight | `test:metrics251-preflight` | PASS |
| **Ops N** run | `test:metrics251-run` | PASS |
| **Ops O** ledger | `test:metrics251-ledger` | PASS |
| **Ops P** operator | `test:metrics251-operator` | PASS |
| **Ops Q** e2e fault matrix | `test:metrics251-e2e` | PASS |
| diff hygiene | `git diff --check` (worktree + `e4ed741..HEAD`) | clean (exit 0) |

Fail-closed negative controls proven inside the Slice A test (each FAIL family bites, WAIT is
not vacuous): broken route (404 / unexpected redirect / missing `<title>`) → FAIL; served or
local universe ≠ 138 → FAIL/`universe_drift`; served or local Metrics label ≠ 2.4 →
FAIL/`metrics_drift`; malformed local data → FAIL; auth-language regression (`lang="en"` /
KO-EN toggle marker) → FAIL; sitemap leak/drop and robots missing-Disallow → FAIL; `/login`
unreachable → FAIL; `--expected-sha` served-marker mismatch → FAIL, marker **absent** → WAIT
in grace / FAIL when enforcing; and stale served data date → **WAIT inside grace, FAIL past
the deadline on the same fixture** (only the injected clock changes). Evidence is
timestamp-free, secret-guarded (positive control proves the detector is not vacuous), and
base userinfo is redacted.

---

## 4. Task-owned loopback route tests + finite read-only live smoke

**Loopback (offline, finite):** the Slice A self-test creates a task-owned mock HTTP server
with `server.listen(0, "127.0.0.1", …)` — **loopback interface, ephemeral port**, never a
live service — drives the verifier against every FAIL/WAIT/PASS scenario, then closes it. The
test asserts the server reports **not listening** after close (§8a) and that a subsequent
request **FAILs** (§8b). No always-on port (3000 / 4310) is touched.

**Finite read-only live smoke** (GET-only, no form submission, no outside mutation), run
against the owner's public site:

| Invocation | Verdict | Evidence |
|---|---|---|
| `node scripts/verify-market-close-health.mjs --base https://ornscore.com --json` | **WAIT / `weekend`**, exit 0 | KST date 2026-07-19 (Sun) → non-trading day; `/`, `/stocks`, `/stock/005930` all **200**; served universe 138 / Metrics 2.4 / dataDate 2026.07.16; **hard 0, freshness 0** |
| `… --now 2026-07-17T10:00:00Z --json` (injected **enforcing** clock, Fri 19:00 KST) | **PASS / `fresh_confirmed`**, exit 0 | window `enforcing`; live surface serves dataDate 2026.07.16 == local, 138 / Metrics 2.4; all 200; hard 0, freshness 0 |

Both are pure GET reads; the live public surface is healthy and serves exactly the Metrics 2.4
state this repo represents. (A live confirmation with `--expected-sha` against a **deployed**
build marker remains an owner step — this task verified the marker contract offline only.)

**Live read-only orchestrator hold** (documented in runbook §6.5 / plan §C.5):
`orchestrate:metrics251 --source public --no-write --json` → **WAIT / `MISSING_CURRENT_INPUT`**
(marketDate 2026-07-16), exit 0, `writtenPaths: []`, `publicPromotionTriggered:false`,
`externalActionTaken:false`, `readOnlyPublicCanon:true`. This is the honest fail-closed hold:
the current public envelope has one ticker with `per`/`pbr` = null (Slice B.4), so no
promotable request exists yet and **no genuine run is fabricated**.

---

## 5. Slice-D behavioral proofs — scheduled run is clean and cannot promote

A task-owned harness (run from OS temp, not committed) exercised the **shipped** Slice B/C code
with deterministic fixtures. Baseline captured before any run: `public/data/stocks.json`
git-blob `c037daf4…`, `metricsVersion` `2.4`, `git status --porcelain` **empty**.

**P1 — five consecutive genuine fixture trading days, scheduled mode.** For each of
2026-07-13 … 2026-07-17 (Mon–Fri, all trading days), a distinct genuine 138-stock envelope was
assembled and orchestrated into **one** private temp shadow root (`--activation-date 2026-07-12`):

- every day → **PASS / PUBLISHED**, exit 0;
- **all `writtenPaths` under the shadow root** (no path escaped it);
- `publicPromotionTriggered:false`, `externalActionTaken:false`, `readOnlyPublicCanon:true`;
- `git status --porcelain` **unchanged from baseline (empty) after every day** — the scheduled
  command dirtied **no tracked file**;
- `public/data/stocks.json` git-blob **unchanged (`c037daf4…`) after every day**.
- Gate after the 5-day genuine window: **`NOT_MET`**, `trailingConsecutivePassingRuns:0`,
  `actualRuns:5` — the genuine shadow store **structurally cannot reach MET** because per-run
  differential evidence is absent by design (synthesizing it is forbidden). Fail-closed by
  construction.

**P2 — a fixture window DOES reach MET, yet the orchestrator still cannot promote.** The
shipped Slice K fixture (`scripts/fixtures/metrics251/rollout_gate_fixtures.json`, scenario
`met`) evaluates to **`GATE_MET` / `rolloutCandidate:true`**. An `OrchestratorResult` carrying
that MET gate still emits `publicPromotionTriggered:false`, `externalActionTaken:false`,
`readOnlyPublicCanon:true`, exit code **0** (PASS is *reported*, never a promotion trigger).
These three booleans are **unconditional literals** in `OrchestratorResult.to_dict()` — there is
no code path in the orchestrator or its module graph that writes under `public/`, swaps a public
pointer, mutates the Metrics 2.4 label, or touches the network. **Gate MET ⇏ promotion.**

**P3 — public-path leak fails closed.** Orchestrating with a shadow root resolving under
`public/` → **FAIL / `PUBLIC_PATH_LEAK`**, exit 2, **no directory created under `public/`**, repo
still clean.

**P4 — final identity.** After all runs: `public/data/stocks.json` git-blob `c037daf4…`
unchanged, `metricsVersion` `2.4` unchanged, worktree tracked-file state unchanged.
The default private root `.metrics251-shadow/` is **git-ignored** (`.gitignore:48
/.metrics251-shadow/`) — a pre-existing 147-byte `ledger.json` leftover there does **not**
dirty the tracked worktree (`git status` = 0 lines).

---

## 6. Operator playbook — the two owner-approved schedules

> ⚠️ **This task does not activate any scheduler and does not run a genuine market day.** The
> controlling Codex watchdog installs the two schedules below **only after this recertification
> is green**. All commands run from the repo root; on Windows prefix `PYTHONUTF8=1` for cp949
> Korean safety. The KRX daily-data workflow is `0 8 * * 1-5` (17:00 KST); both schedules are
> weekday-only and fire **after** it, in the post-close grace window.

### 6.1 Schedule 1 — public health monitor (Slice A, read-only)

Fires each weekday in the post-close grace window (e.g. **`30 10 * * 1-5`** UTC = **19:30 KST**,
comfortably past the 17:00 KST publish cron + build/deploy lead). Read-only, GET-only.

```bash
# Weekday market-close health probe (read-only). Optionally pin the deployed build SHA.
PYTHONUTF8=1 npm run verify:market-close-health -- \
  --base https://ornscore.com --json
#   [ --expected-sha <7-40 hex of the deployed commit> ]   # served footer-marker check
#   [ --calendar <krx-calendar.json> ]                     # override the built-in 2026 holiday set
#   [ --now <ISO> ]                                          # regression/replay only
```

**Verdict handling** (exit 0 = PASS **or** WAIT; exit 1 = FAIL or usage error):

- **PASS** (`fresh_confirmed`) — the live surface is healthy and fresh. Nothing to do.
- **WAIT** (`weekend` / `holiday` / freshness-deferral in grace) — a legitimate hold: no fresh
  publication is due yet or the deploy may still be in flight. **Do not alert.** Re-run later.
- **FAIL** (exit 1) — a real defect: `broken_route`, `universe_drift` (≠138), `metrics_drift`
  (≠2.4), `malformed_data`, `auth_language_regression`, `sitemap_contract` / `robots_contract`,
  `login_broken`, `deploy_marker_absent` (past the deadline), or an explicit `--expected-sha`
  mismatch. **Stop the cycle and alert the owner** (§6.3). Fail-closed: any hard defect
  outranks every WAIT window.

### 6.2 Schedule 2 — private shadow orchestrator (Slice C)

Fires each weekday **after** Schedule 1 confirms a healthy PASS (e.g. **`0 11 * * 1-5`** UTC =
**20:00 KST**). Writes only under `.metrics251-shadow/`; promotes nothing.

```bash
# scheduled mode (required for the daily loop): the operator may NOT name a market date —
# only the latest complete common trading date the adapter can PROVE is eligible.
PYTHONUTF8=1 npm run orchestrate:metrics251 -- \
  --source public --calendar <krx-calendar.json> --config config/metrics/2.5.1.json \
  --activation-date <first-effective-YYYY-MM-DD> --json
```

**Verdict handling** (exit 0 = PASS **or** WAIT; exit 2 = FAIL):

- **PASS** (`PUBLISHED` | `ALREADY_RECORDED`) — the market day is reflected in the private
  shadow (new snapshot, or a byte-identical one already recorded → idempotent NOOP). The
  rollout-gate `status` (PENDING/MET) is **reported only**; **MET never triggers promotion**.
- **WAIT** (`NON_TRADING_DAY` | `PUBLICATION_GRACE` | `MISSING_CURRENT_INPUT` | `PRE_ACTIVATION`
  | `LOCK_HELD` | `INPUT_NOT_FRESH`) — nothing is broken and no run is fabricated. **Do not
  alert.** Re-run later. (`MISSING_CURRENT_INPUT` is the current live-envelope state, §4.)
- **FAIL** (exit 2) — `SAME_DATE_CONFLICT`, `PARTIAL_RUN`, `QA_FAILED`, `SYNTHETIC_MARKER`,
  `PUBLIC_PATH_LEAK`, `PREFLIGHT_FAILED`, `STALE_SOURCE`, `CONFIG_INVALID`, `HASH_MISMATCH`,
  `LEDGER_CONFLICT`, `PUBLISH_FAILED`, or `INTERNAL_ERROR`. **Stop and alert** (§6.3).

Judgement-only (no write): add `--no-write`. Regression/replay: `--mode explicit --market-date
<D>` (proven `< D` → WAIT/`INPUT_NOT_FRESH`; proven `> D` → FAIL/`REQUEST_STALE`).

Manual 4-step fallback (if the orchestrator is unavailable) is runbook §6.2:
`operator:metrics251` (READY?) → `run:metrics251` (PUBLISHED?) → `ledger:metrics251` (APPENDED?)
→ `rollout:metrics251` (PENDING/MET?).

### 6.3 Alert conditions (when the watchdog should page the owner)

Alert **only** on a hard stop; never on a WAIT (a WAIT is a healthy hold, exit 0):

1. Schedule 1 **FAIL** (exit 1) on any hard dimension — the public surface is broken or drifted.
2. Schedule 2 **FAIL** (exit 2) — a real input/run/ledger defect that must stop the cycle.
3. A verifier **usage error** (exit 1) or an unexpected non-zero exit / crash.
4. A `--expected-sha` mismatch after a known deploy (served build ≠ intended commit).
5. `SAME_DATE_CONFLICT` — a changed input for an already-recorded date (human adjudication).

Never alert on: `weekend`, `holiday`, in-grace freshness deferral, `MISSING_CURRENT_INPUT`,
`PRE_ACTIVATION`, `LOCK_HELD`.

### 6.4 Lock recovery

The orchestrator serialises overlap with `<root>/locks/orchestrator.lock`, created
`O_CREAT|O_EXCL` with a **deterministic** payload (marketDate + input/config hashes — **no
wall-clock, no PID**) and released in a `finally`. If a prior run is still executing, a second
invocation returns **WAIT / `LOCK_HELD`** (exit 0) and does nothing — safe to let the next
schedule tick retry. If a process was killed mid-run and left a **stale** lock, the day will
keep returning `LOCK_HELD`; recover by removing the single lock file **after confirming no
orchestrator process is running**:

```bash
# Confirm nothing is mid-run, then clear the stale lock (private shadow root only):
rm -f .metrics251-shadow/locks/orchestrator.lock
```

Because the run layer is atomic and idempotent, a re-run after clearing the lock is safe: a
completed day returns `ALREADY_RECORDED`; an interrupted day re-publishes atomically (pointer
swaps only at the store's final publish step) or reports `PARTIAL_RUN` for cleanup.

### 6.5 Rollback

Nothing this automation writes is public, so "rollback" is confined to the private shadow tree
and never touches the deployed site:

- **Any FAIL** — the store pointer is **unchanged** (atomicity); fix the input/source dates and
  re-run. A partial-failure trace (`PARTIAL_RUN`) is cleaned per `operator:metrics251`
  next-actions, then re-run.
- **Wrong/aborted private window** — discard the private shadow root wholesale; it is
  git-ignored and reconstructible from the public envelope: `rm -rf .metrics251-shadow/` (or
  point `--root` at a fresh directory). No tracked file, no public artifact, and no Metrics 2.4
  value is affected.
- **Continuity reset** — a missing trading day resets the 5-day gate window to NOT_MET; the gate
  is never back-filled synthetically. Resume accumulation on the next real trading day.
- **Public canon** — never mutated by this batch (§2); there is nothing public to roll back.

### 6.6 Private evidence locations (never committed)

- Default private root: **`.metrics251-shadow/`** — git-ignored (`.gitignore:48`). Genuine runs
  create `inputs/request.json`, `runs/`, `pointer`, `ledger.json`, `locks/orchestrator.lock`,
  and `reports/rollout-gate.{json,md}` + `reports/orchestrator-latest.json` **here only**.
- The **only** rollout-gate summary that may reach tracked `docs/` is
  `docs/metrics-2.5.1-rollout-gate.{json,md}` — a **local readiness summary, not a promotion
  authorization** (`meta.note`). The orchestrator writes its gate copy into the shadow
  `reports/` tree, never the tracked `docs/` copies.
- A `--root` override is honoured, but if it resolves under `public/` (or violates the
  `inputs/` layout) the private-root guard fires **FAIL / `PUBLIC_PATH_LEAK`** and writes
  nothing (§5 P3).

---

## 7. Residuals — owner-only (NOT performed by this task)

- **Schedule installation** — the two weekday cron schedules of §6 are installed by the
  controlling Codex watchdog **after** this recert is green. Not done here.
- **Genuine 5-day window** — five real consecutive KRX trading-day shadow runs (Gate 4 4-zero:
  `unresolvedP0 = sourceDateMismatch = unknownExclusionReason = publicPathLeakage = 0`, plus
  per-run differential evidence) remain owner-driven on real market days. `releaseReady=false`,
  `actualRuns=0`, gate **PENDING**/`INSUFFICIENT_REAL_RUNS`.
- **First `effectiveMarketDate`** — undecided; `--activation-date` must be set by the owner.
- **KRX operational calendar wiring** — the operational `--calendar` (real KRX closures) and the
  138-stock real-input pinning are owner-provisioned; `scripts/fixtures/.../compare_calendar.json`
  used above is a generic fixture, not the operational calendar.
- **Deployed build-marker confirmation** — running Schedule 1 with `--expected-sha` against the
  actual deployed commit after a real deploy (owner-only; verified offline here).
- **Search Console / Naver** ownership + sitemap submission — owner-only (see
  `docs/ornscore-seo-ownership-verification-runbook-2026-07-18.md`).
- **`public/.well-known/assetlinks.json`** — one external WAIT (real package name + SHA-256
  signing fingerprint), owner-only.
- **Gate 5 human review + Gate 6 owner approval** — the only paths to any public Metrics 2.5.1
  promotion. Not in scope.
- **Pre-existing baseline drift (non-blocking)** — `test:metrics251-baseline` reports
  `docs/metrics-2.5.1-baseline.{json,md}` are stale. Proven **pre-existing and invariant across
  this batch**: `metrics251_baseline.py` and all of its inputs
  (`public/data/stocks.json`, `scripts/compute_metrics.py`, `src/lib/metrics.ts`,
  `src/lib/realStocks.ts`) and its two output docs are **byte-identical** between `e4ed741` and
  HEAD, so Slices A–C neither caused nor can fix it. Regenerating it (`python
  scripts/metrics251_baseline.py`) is a separate owner/maintenance step outside this task's
  writable surface; it does **not** gate the Slice A–C recertification.

---

## 8. Recertification verdict

Slice A (read-only market-close health monitor), Slice B (fail-closed market-day input adapter),
and Slice C (finite, idempotent one-day shadow orchestrator) **recertify green as one unit** on
a full local build. Identity proofs against `e4ed741` hold for every frozen boundary
(public/data, login/auth, middleware, workflows, metrics.ts, dependency versions); the public
canon is 138 stocks on Metrics 2.4; typecheck, the full Next build, every focused test, and the
complete Metrics 2.5.1 contract regression battery (A–K + M–Q) pass; a task-owned loopback
server drives the finite route tests and is proven stopped; a finite read-only live smoke shows
the public surface healthy and serving exactly the Metrics 2.4 state this repo represents; and a
task-owned harness proves the scheduled one-day command leaves every tracked file clean and
cannot promote Metrics 2.5.1 even when a fixture window reaches gate MET. One honest,
pre-existing, non-blocking residual (baseline-doc drift) is documented and left to the owner. No
Slice A–C source defect was demonstrated, so no Slice A–C source file was modified. No scheduler
was activated and no genuine market-day run was performed. One local `[codex]` commit carries
this dossier and the handoff updates; the worktree is left clean; `main` and every outside
service are unchanged.
