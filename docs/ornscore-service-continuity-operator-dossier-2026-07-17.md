# ORNScore service continuity — operator dossier (Slice G, 2026-07-17)

Governing plan: `docs/ornscore-service-continuity-2026-07-17.md`.
Tested public base: `b4ba1e905064a1d9058f0fa6b46e9ff4b92f44fc` (`b4ba1e9`).
Recertified HEAD before this commit: `d54e24173d16b49b1c2be43f6851ee12d342e546` (`d54e241`, Slice F).
Toolchain: Node `v24.16.0`, npm `11.13.0`, Git `2.54.0.windows.1`.

This is the batch-close deliverable. It re-certifies Slices A–F as one unit,
records exact command/state evidence, and lists the owner-only steps that must
precede any push, publication, workflow change, or Metrics 2.5.1 promotion.
Nothing here pushes, publishes, deploys, connects an outside service, or mutates
a remote resource. Metrics 2.5.1 is **not** ready (0/5 genuine trading days).

---

## 1. Recertification result (one unit)

Every finite local gate below was run from the recertified HEAD after a clean
`npm ci`. All passed. Public Metrics 2.4, `public/data`, the 138-stock universe,
and the frozen login/auth surface are byte-for-byte unchanged from `b4ba1e9`.

### 1.1 Build / typecheck / install

| Command | Result | Exit |
| --- | --- | --- |
| `npm ci` | clean deterministic install — added 410 packages, audited 411 | 0 |
| `npx tsc --noEmit` | no type errors | 0 |
| `npm run build` | Compiled successfully; `Generating static pages (183/183)`; `/stock/[ticker]` SSG = 138 paths (`005930`,`000660`,`042700` + 135 more); `/topics/[slug]` SSG = 7; Middleware 90.2 kB | 0 |

Exact resolved versions in `node_modules` after `npm ci`:

| Package | Version |
| --- | --- |
| next | 15.5.18 |
| react | 19.2.7 |
| react-dom | 19.2.7 |
| eslint-config-next | 15.5.18 |

### 1.2 Audit (full-build)

| Scope | critical | high | moderate | low | total |
| --- | --- | --- | --- | --- | --- |
| `npm audit --omit=dev` (production/public path) | 0 | 0 | 2 | 0 | 2 |
| `npm audit` (full, incl. dev tooling) | 0 | 1 | 2 | 1 | 4 |

- Production **critical=0 / high=0** — the zero-high release gate holds.
- Production moderate=2 = one advisory (`postcss` GHSA-qx2v-qp2m-jg93, XSS via
  unescaped `</style>` in CSS stringify, `<8.5.10`) counted via the `next` and
  `postcss` nodes. Not reachable on the public request path (build-time CSS
  stringify only). `next` 15.5.18/20 pin postcss internally; not owner-fixable
  without a Next-line change.
- The full-audit extras are **dev-only, no public exposure, no fix available**:
  `HIGH xlsx` (SheetJS prototype pollution + ReDoS — used only by offline
  spreadsheet scripts) and `LOW esbuild` (dev-server file read on Windows, via
  `tsx`). Neither ships to production; `npm audit fix --force` is a forbidden
  downgrade path and was not run.

### 1.3 Framework baseline, Metrics 2.4, routes, SEO, release preflight

| Gate | Command | Result | Exit |
| --- | --- | --- | --- |
| Continuity baseline (orchestrator) | `npm run verify:continuity-baseline` | 7/7 (baseline-freshness, evidence-integrity, verify:metrics, verify:first-run-ux, verify:reaudit, release:preflight, verify:framework-baseline) | 0 |
| Framework baseline | delegated by above | 3/3 (baseline-freshness FRESH, audit-block OK crit0/high0/mod2, build-classification OK) | 0 |
| Metrics 2.4 | `PYTHONUTF8=1 python scripts/verify_metrics.py` | 138 stocks · 0 errors · brand banned-term 0 · formula = Metrics 2.4 | 0 |
| Public routes (live) | `npm run verify:routes -- --base http://127.0.0.1:4478` | 9/9 · expected data date 2026.07.16 | 0 |
| Public SEO (live) | `npm run verify:public-seo -- --base …` | 3/3 · sitemap 162 URLs · robots + cross-consistency | 0 |
| Stocks SEO (live) | `npm run verify:stocks-seo -- --base …` | 13/13 | 0 |
| Smoke, full (live) | `npm run smoke:check -- --base … --all` | 25/25 (incl. 404 + invalid-input degrade) | 0 |
| Release preflight (offline) | `npm run release:preflight` | 11/11 offline; route-health deferred | 0 |
| Release preflight (live) | `npm run release:preflight -- --base … --no-perf` | 11/11 all green | 0 |

### 1.4 New continuity verifiers and self-tests

| Command | Result | Exit |
| --- | --- | --- |
| `npm run test:continuity-baseline` | pass — stale-evidence + delegated-gate propagation (§5b–5e) | 0 |
| `npm run test:route-canary` | pass — 4 failure classes, bounds, deterministic evidence, listener stopped (§9–10) | 0 |
| `npm run test:commit-status` | pass — 7 states + every bound, both mock listeners stopped (§10–11) | 0 |
| `npm run test:daily-workflow-gate` | pass — ordering, fail-closed, frozen-field, presence (§7) | 0 |
| `npm run test:continuity-fault-matrix` | pass — combined B–E: fail-closed, deterministic, secret-free, no data mutation, listeners cleaned (§8–10) | 0 |
| `npm run test:public-data-delta` | 0 failures — all fixture reason codes, fail-closed, purity, CLI | 0 |
| `npm run test:framework-baseline` | pass — stale-evidence + propagation + build classification (§5–6) | 0 |
| `npm run verify:daily-workflow-gate` | 6/6 — gates run fail-closed before commit; frozen fields intact | 0 |
| `npm run verify:continuity-fault-matrix` | pass — cases=25, requests=38/200, 12 categories, 1702 ms | 0 |
| `npm run verify:route-canary -- --base …` (live) | 6/6 · date 2026.07.16 · metrics=Metrics 2.4 · marker not checked (local server has no `VERCEL_GIT_COMMIT_SHA`) | 0 |

### 1.5 Desktop + 390×844 mobile local smoke

- Desktop: live `verify:routes` (9/9), `smoke:check --all` (25/25), and
  `verify:route-canary` (6/6) against `http://127.0.0.1:4478` (`next start`).
- Mobile 390×844 (iPhone-class UA): `/`, `/stocks`, `/stock/005930`, `/compare`,
  `/status`, `/today`, `/watchlist`, `/login?next=/watchlist` all `200` with a
  single `name="viewport"` meta. Page HTML is server-rendered and
  viewport-independent; the responsive layout is client CSS over identical
  markup, so a mobile UA fetch confirms delivery to a 390×844 client.

---

## 2. Frozen-boundary proofs (Git object identity)

All identities taken at the recertified HEAD and compared to tested base
`b4ba1e9`. Verbatim `git ls-tree` / `git rev-parse` output.

| Surface | Path | Blob/tree SHA @ HEAD | @ b4ba1e9 | Match |
| --- | --- | --- | --- | --- |
| Login | `src/app/login/LoginContent.tsx` | `fea64da6da8ba32d8b71f8bd6e278ecc5ff2afcd` | same | ✅ |
| Login | `src/app/login/page.tsx` | `0c8a28f5d7d908fbee727bdd4fd1e73cbea7867f` | same | ✅ |
| Auth | `src/app/auth/callback/route.ts` | `60846593211b6e4c71376e1ca79cfac8d0b0ee85` | same | ✅ |
| Public data | `public/data` (tree) | `1ab0e42dd5e3f95df04f3324616d6bae51f40b8c` | same | ✅ |
| Public data | `public/data/stocks.json` | `b9d09f33268ed3fe232ce37ddbe052640c8bd695` | same | ✅ |
| Public data | `public/data/market-alerts.json` | `e4741f31e665ffe88e763a6051fdf704e0e4fd54` | same | ✅ |
| Public data | `public/data/prices` (tree) | `388f85034446e09381ff1b107a1b7cb4dd470a05` | same | ✅ |

- `public/data/prices` recursive file count = **138** (138-stock universe intact).
- Metrics runtime version = **2.4** on 138 stocks (unchanged public formula).
- Worktree `git status --porcelain` = empty; `git diff --check` = clean.
- No fixture leakage: `candidate_*` / `baseline.json` fixtures exist **only** under
  `scripts/fixtures/public_data_delta/`; none present in `public/data`; running
  the delta/rollout/ledger generators left `public/data` byte-identical.
- Process cleanup: the single `next start` listener (PID 14952 on `:4478`) was
  killed; post-kill probe returned `curl` exit 7 (connection refused = stopped).
  All verifier/test mock loopback servers self-report stopped in their suites.

---

## 3. Continuity architecture — command/state reference

The batch adds finite, read-only operator commands and one fail-closed gate
insertion in the local daily-workflow source. None change the schedule,
concurrency, permissions, data-generation commands, commit paths, or bot
identity of `.github/workflows/daily-data.yml`.

### 3.1 Daily workflow contract (frozen; Slice D added gates only)

| Field | Value |
| --- | --- |
| Schedule | `0 8 * * 1-5` (workflow_dispatch also enabled) |
| Concurrency | group `daily-data`, `cancel-in-progress: false` |
| Permissions | `contents: write` |
| Runner / timeout | `ubuntu-latest` / 30 min |
| Bot identity | `ornscore-bot` `<actions@users.noreply.github.com>` |
| Commit paths | `public/data/stocks.json`, `public/data/prices`, `public/data/market-alerts.json` |
| Commit prefix | `chore(data): daily refresh` |
| Gate order (before commit/push) | fetch → sync → compute → alerts → `verify_metrics.py` → **`verify_public_data_delta.py`** (Slice C) → **release preflight offline** → **framework baseline freshness** → commit/push if changed |

A failed gate cannot stage, commit, or push data. Verified by
`verify:daily-workflow-gate` (6/6) and `test:daily-workflow-gate`.

### 3.2 Operator commands and their state transitions

| Command | Purpose | States it distinguishes |
| --- | --- | --- |
| `verify:continuity-baseline` | Freeze/aggregate all offline invariants | pass / stale-evidence / integrity-fail / any delegated-gate fail |
| `verify:public-data-delta` | Pre-commit candidate delta guard | valid / stale / missing / malformed / identity-drift / coverage / non-finite / outlier / mass-change |
| `verify:route-canary -- --base <url> [--marker <7hex>]` | Read-only public route health | ok / timeout / dns_tls_http / content / stale_marker |
| `verify:commit-status -- --base <url> --sha <sha>` | Finite wait on hosting commit status, then canary | pending / success / failure / timeout / status-unavailable / stale-public-marker |
| `verify:daily-workflow-gate` | Source-level fail-closed + frozen-field check | ordering / fail-closed / frozen-fields / node-setup / no-secret |
| `verify:continuity-fault-matrix` | Combined B–E adversarial fault matrix | 12 fault categories, all fail-closed, bounded, secret-free |

All HTTP is finite and read-only (bounded attempts, interval, total time,
response size). No command mutates a remote resource; each terminates without
leaving a listener.

---

## 4. Rollback points

Each slice is one local `[codex]` commit (later reconciled by an `ai-center`
commit). To revert the batch or any slice, reset/revert to the row's parent.

| Slice | `[codex]` commit | Reconcile commit | Revert-to (parent) |
| --- | --- | --- | --- |
| Base (pre-batch) | — | — | `b4ba1e9` |
| Plan | `63916e0` | — | `b4ba1e9` |
| A — baseline + harness | `569b81a` | `5d59871` (reconcile) | `63916e0` |
| B — route canary | `334e3d5` | `3906882` | `569b81a` |
| C — delta guard | `9072c34` | `03c06d3` | `334e3d5` |
| D — workflow gate | `a528eae` | `b3fb318` | `9072c34` |
| E — commit-status | `5e3da91` | `9fd8d3d` | `a528eae` |
| F — fault matrix | `d3d99de` | `d54e241` | `5e3da91` |
| G — this dossier | (this commit) | — | `d54e241` |

Full-batch rollback: `git revert --no-commit b4ba1e9..HEAD` then commit, or
`git reset --hard b4ba1e9` on a throwaway branch. No remote state is involved.

---

## 5. Failure triage (operator runbook)

| Symptom | Likely cause | First action |
| --- | --- | --- |
| `verify:public-data-delta` fails `mass_change`/`outlier` | Refresh produced a large or anomalous swing | Do **not** commit. Inspect the per-field change summary; if legitimate, an owner must raise the bounded budget deliberately, not the agent |
| `verify:public-data-delta` fails `identity_drift`/`coverage` | Ticker set changed or rows dropped | Stop; the 138-stock universe is frozen — investigate the fetch/compute step |
| `verify:route-canary` class `stale_marker` | Public footer SHA ≠ expected deploy SHA | Hosting served an old build; wait/retry with `verify:commit-status`, do not republish blindly |
| `verify:route-canary` class `dns_tls_http`/`timeout` | Hosting or network path down | Read-only; retry with bounded attempts; escalate to hosting owner |
| `verify:commit-status` → `status-unavailable` | Status endpoint unreachable/absent | Treated as non-success (fail-closed); do not assume deploy health |
| `release:preflight` route-health NOT RUN | No live server | Start `next start -p <port>`, re-run with `--base`, stop only that listener |
| `verify:framework-baseline` `baseline-freshness` red | Intended next/react dep drift | Expected only during a deliberate framework bump; otherwise a regression |
| Full audit shows a HIGH | dev-only `xlsx` | Confirm it is dev-only (`--omit=dev` still 0 high); do not `audit fix --force` |
| Local `og:image` bytes fail offline | satori dynamic-font fetch (`▲/▼`) needs network | Environment limit, not a regression; verify image bytes in a networked/prod env |

---

## 6. Residual risks

1. **Production moderate ×2 (`postcss`)** — build-time only, no public-path
   reachability, pinned inside `next`. Clears only when the Next line ships a
   patched postcss; an owner Next-version decision, not an agent action.
2. **Dev-only HIGH `xlsx` / LOW `esbuild`** — no fix available, never shipped to
   production; scripts/tooling scope only.
3. **Route canary marker vs local server** — a local `next start` sets no
   `VERCEL_GIT_COMMIT_SHA`, so the footer build-marker check is skipped locally.
   Marker enforcement is meaningful only against a real deploy (owner step).
4. **Offline `opengraph-image` bytes** — the live image render needs network
   fonts; only route/type/meta are provable offline.
5. **Commit-status verifier is operator-invoked** — it is deliberately **not**
   wired into the workflow (would need repository/hosting settings the batch
   must not touch). It stays a manual, read-only command.
6. **Delta budgets are heuristic** — the mass-change/anomaly budgets are bounded
   but conservative defaults; a genuine large legitimate refresh requires a
   deliberate owner budget review, by design.

---

## 7. Metrics 2.5.1 status — NOT ready

- `engineVersion=2.5.1` exists only as a **Git-untracked shadow** engine
  (shadow store `.metrics251-shadow`), fail-closed with 25 reason codes.
- Rollout ledger: **approved runs 0 (required 5) · gate PENDING ·
  rolloutCandidate false**.
- The public site remains on **Metrics 2.4**. The five genuine trading-day gate
  is incomplete. **Do not call Metrics 2.5.1 ready and do not switch the public
  formula.** Any promotion is an owner decision after five real trading-day runs.

---

## 8. Owner-only future steps (none performed here)

The batch is complete; do not add filler work. The following are explicitly
outside this batch and require the human owner:

1. **Naver login review** result and any auth-provider follow-up (login/auth
   surface stays frozen until then).
2. **Push / publication / deploy** of this batch or any slice — no remote
   mutation was performed. A push must be followed by a real Vercel deploy and a
   live `verify:route-canary --marker <deployed-sha>` before trusting the public
   marker.
3. **Wiring `verify:commit-status` into CI/hosting** — needs repository/hosting
   settings the batch may not change.
4. **Metrics 2.5.1 promotion** — run five genuine trading-day dated runs, satisfy
   the rollout gate, then decide on any public formula switch.
5. **Real Vercel Analytics credentials / provider connection.**
6. **Android asset-links publication.**
7. **GitHub/Vercel setting, DNS, or Supabase schema/RLS changes** — all frozen.

---

## 9. Batch completion statement

Slices A–G have local `[codex]` commits. All finite local gates pass from a
clean install. Git proves the login/auth blobs, Metrics 2.4 formula, 138-stock
output, and every `public/data` object are byte-identical to tested base
`b4ba1e9`. No fixture entered `public/data`. The single local server listener was
stopped; the worktree is clean. Nothing was pushed, published, deployed,
connected, or otherwise mutated on any remote resource. Metrics 2.5.1 remains
shadow-only and not ready. The continuity queue stops here.
