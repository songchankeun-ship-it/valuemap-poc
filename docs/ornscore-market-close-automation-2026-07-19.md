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
