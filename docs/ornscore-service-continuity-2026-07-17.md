# ORNScore service continuity plan (2026-07-17)

## 1. Why this batch exists

ORNScore is public, but two recent facts show a meaningful local hardening gap:

- The first framework-security publication reached Vercel but failed on a
  production-only lint/build gate before commit `b4ba1e9` corrected it.
- `.github/workflows/daily-data.yml` verifies metrics and then commits and
  pushes changed public data. It does not yet enforce a bounded candidate-delta
  review, a production build gate, or a finite post-push status check.

This batch reduces the chance that a routine data refresh publishes a large or
broken change and improves the evidence available when the hosting pipeline is
slow or fails. It is an operations-safety batch, not a feature backlog.

The tested base is `b4ba1e905064a1d9058f0fa6b46e9ff4b92f44fc`.

## 2. Frozen boundaries

Every slice must preserve all of these invariants:

1. Naver review is pending. Do not edit `src/app/login`, `src/app/auth`, Naver
   Developers, Supabase auth providers, callbacks, email behavior, account
   settings, or runtime authentication values.
2. Do not change Supabase schema or RLS, external accounts or credentials,
   GitHub/Vercel settings, DNS, hosting settings, or production records.
3. Keep public Metrics 2.4, the public formula, `public/data`, the 138-stock
   universe, public URLs, SEO values, and analytics event names unchanged.
   Test fixtures must remain outside `public/data`.
4. Do not change the daily workflow schedule, concurrency group, permissions,
   fetch/recompute commands, commit paths, bot identity, or existing automatic
   push semantics unless a later owner decision explicitly authorizes it.
5. Do not add packages, migrate to Next 16, or run unbounded watchers/daemons.
6. Local commits and finite read-only HTTP checks are allowed. This batch must
   not push, publish, deploy, connect an outside service, or mutate a remote
   resource.
7. Each slice creates one local `[codex]` commit, updates `PROGRESS.md` and
   `docs/AI_HANDOFF.md`, and leaves a clean or precisely documented worktree.

## 3. Ordered slices

### Slice A - continuity baseline and invariant harness

- Record the exact daily workflow contract, public-data Git blob identities,
  route canary set, and public footer build-marker contract in deterministic
  repository evidence.
- Add a finite offline verifier and focused self-tests for stale evidence and
  delegated-gate failure propagation.
- Reuse current Metrics 2.4, route, SEO, and framework verifiers rather than
  copying their logic. Do not change runtime behavior.

### Slice B - read-only route canary

- Add a one-shot CLI that checks a supplied base URL for bounded route status,
  redirect, title, canonical, footer build marker, data date, and metrics-version
  expectations.
- Emit deterministic human-readable and JSON evidence with explicit timeout,
  DNS/TLS/HTTP, content, and stale-build failure classes.
- Test against a task-owned loopback mock server. The command must never mutate
  a remote resource and must terminate without leaving a listener.

### Slice C - public-data candidate delta guard

- Add a pre-commit guard that compares the committed public-data baseline with
  a working-tree candidate without changing either input.
- Enforce schema, 138-stock identity, date monotonicity, coverage, finite numeric
  values, per-field change summaries, and bounded anomaly/mass-change budgets.
- Produce a deterministic report and fixture matrix proving valid, stale,
  missing, malformed, identity-drift, and mass-change candidates fail or pass
  for the documented reason. Fixture output must never enter `public/data`.

### Slice D - fail-closed daily workflow integration

- Insert the Slice C guard and the existing offline Metrics/framework/release
  checks before the workflow's current commit-and-push step.
- Ensure a failed gate cannot stage, commit, or push data. Preserve the current
  schedule, permissions, concurrency, data-generation commands, commit paths,
  bot identity, and successful-path push semantics byte-for-byte where possible.
- Add a source-level verifier and fixture tests for ordering and fail-closed
  behavior. Do not execute the workflow remotely.

### Slice E - finite commit-status verifier

- Add a read-only one-shot verifier that can wait for the hosting commit status
  associated with an expected SHA and then run the Slice B canary against that
  expected marker.
- Bound attempts, interval, total time, and response size. Distinguish pending,
  success, failure, timeout, status-unavailable, and stale-public-marker states.
- Use mock HTTP fixtures for all branches. Keep this as an operator command in
  this slice; do not change repository or hosting settings and do not trigger a
  remote run.

### Slice F - continuity fault matrix

- Exercise the combined guards against candidate regression, verifier failure,
  pending/failing/timeout status, stale marker, route failure, and malformed
  response scenarios.
- Prove fail-closed behavior, deterministic diagnostics, no secret leakage, no
  `public/data` mutation, and cleanup of task-owned loopback listeners.
- Add only demonstrated repairs. Do not broaden into provider or platform work.

### Slice G - full local recertification and operator dossier

- Re-certify Slices A-F as one unit with clean install/build/typecheck, framework
  baseline, public SEO/routes, Metrics 2.4, release preflight, new focused tests,
  desktop/mobile local smoke where relevant, diff/encoding checks, and public
  data blob invariance from the tested base.
- Produce an operator dossier with exact commands, state transitions, rollback
  points, failure triage, residual risks, and the owner-only steps needed before
  any future workflow or public release decision.
- Do not push or publish. Do not call Metrics 2.5.1 ready: its five genuine
  trading-day gate remains incomplete.

## 4. Completion definition

The batch is complete only when Slices A-G have local commits, the AI Dev Center
queue is idle with no project-1 pending approval or failed run, the worktree is
clean, all finite local gates pass, and Git proves the frozen login, Metrics 2.4,
and `public/data` boundaries stayed unchanged from the tested base.

The queue must stop when these meaningful slices are complete. It must not add
padding work merely to occupy the requested two-day observation window.

## 5. Deferred owner decisions

- Naver review result and any authentication-provider follow-up.
- Real Vercel Analytics credentials or provider connection.
- Five genuine Metrics 2.5.1 trading-day runs and any formula switch.
- Android asset-links publication details.
- GitHub/Vercel setting changes, remote push, publication, and service release.
