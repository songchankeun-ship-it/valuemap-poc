# ORNScore Framework Security — Slice E security-boundary regression pack (2026-07-17)

Plan: `docs/ornscore-framework-security-hardening-2026-07-16.md` §3 Slice E.
Scope: re-certify the security boundaries the Next 14.2.13→**15.5.18** / React 18→**19.2.7**
migration had to preserve, on the migrated framework, and map every currently
reported production advisory to actual ORNScore code-path reachability. Add
regression coverage only where an advisory or migration change reaches ORNScore's
code; record concrete source/config evidence for the non-applicable paths.

No provider / account / callback / Supabase schema-RLS / cron-schedule / runtime
setting was changed. `src/app/login` and `src/app/auth` were read only. No
`--force`, `npm audit fix --force`, or `--legacy-peer-deps`. Next 16 stays deferred.

Prior HEAD `7eec6cd` (task 328, Slice D). Branch
`ai-center/task-329-ornscore-framework-security-e-author`.

## New deliverable

- `scripts/verify-security-regression.ts` (npm script `verify:security-regression`)
  — a two-phase regression pack. It does **not** re-implement the existing operator
  gates (`verify:admin-policy`, `verify:admin-access`, `verify:routes`); it adds the
  coverage those gates did not have and machine-checks the advisory map.
  - §A advisory reachability map (offline): asserts production **critical=0 / high=0**
    on the live graph and classifies every remaining finding APPLICABLE (backed by a
    §C/§D regression) or NON-APPLICABLE (with a machine-checked evidence predicate).
    Any finding **not** in the reachability table fails the gate — a future advisory
    cannot pass unmapped.
  - §B cron/API unauthorized-response source contract (offline): every scheduled GET
    route stays fail-closed (`CRON_SECRET` set + wrong/absent `Authorization` ⇒ 401
    before any side effect).
  - §C safe redirect targets (offline): `safeInternalPath()` — the single source of
    truth the login/auth callback uses for the attacker-controlled `next` — keeps
    genuine internal paths and collapses open-redirect vectors to `/`.
  - §D CVE-2025-29927 middleware-bypass regression (**live**, needs `--base`): a
    logged-out request to each `/admin` route carrying the `x-middleware-subrequest`
    bypass header is still redirected to `/login` by the Edge middleware — never a 200
    that renders admin content, never an admin-only marker leak.

## Advisory reachability map (migrated graph, `npm audit --omit=dev --json`)

Summary on Next 15.5.18 / React 19.2.7: **critical=0, high=0, moderate=2, low=0
(total 2)**. The pre-migration baseline recorded critical=1 (the Next middleware
auth-bypass) + others; those are cleared. Both remaining moderates collapse to a
single root cause.

| Finding | GHSA | Root pkg | Applicability | Evidence |
| --- | --- | --- | --- | --- |
| Next middleware authorization bypass (**CVE-2025-29927**) — the reason for the whole batch | GHSA-f82v-jwr5-mffw | next | **APPLICABLE** (middleware enforces `/admin` auth) | **Cleared** on 15.5.18 (no longer in audit). Runtime behavior re-proven by §D live regression: all 4 `/admin` routes × 4 documented `x-middleware-subrequest` payloads still redirect to `/login`. |
| PostCSS XSS via unescaped `</style>` in CSS Stringify output | GHSA-qx2v-qp2m-jg93 | postcss `8.4.31` **nested under `node_modules/next/`** (Next's own build-time copy; top-level `postcss` is `8.5.15`, already ≥8.5.10 = patched) | **NON-APPLICABLE to runtime** | postcss is a **build-time** CSS transform (`postcss.config.mjs` → `tailwindcss`+`autoprefixer`); **no runtime `postcss` import in `src/`** (grep: none); no user-controlled CSS is stringified at runtime. Build input is first-party Tailwind/app CSS only. Machine-checked by §A `proof()`. |
| `next` moderate | (via postcss) | next | transitive alias | npm reports `next` moderate **only "via postcss"** (no own `next` advisory on 15.5.18). Folded into the postcss rule, not a distinct finding. |

Residual: 2 moderate, both = Next's bundled `postcss@8.4.31`. Fix is a later Next
patch that bumps its vendored postcss (npm's `next@9.3.3` `isSemVerMajor` suggestion
is a **downgrade**, not a fix; `--force` rejected by plan §2.6). Next 16 deferred
(plan §2.7). No critical/high residual is hidden.

## Re-certification results (all required gates)

Live gates ran against a task-owned prod server (`npx next start`) on dedicated high
ports (4493; and 4497 with a throwaway `CRON_SECRET` for the live cron-401 probe) —
never 3000/4310. Both listeners were started and stopped by this slice.

| Gate | Result | Evidence |
| --- | --- | --- |
| `verify:security-regression` (offline) | PASS | §A map green (critical=0/high=0, postcss NON-APPLICABLE proof holds); §B 4 cron routes fail-closed; §C 5 keep + 12 reject vectors + null/undefined/custom-fallback + callback wiring |
| `verify:security-regression -- --base :4493` (live §D) | PASS | 4 `/admin` routes × 4 `x-middleware-subrequest` payloads (`middleware`, `src/middleware`, depth-padded chain, `pages/_middleware`) → **all 307 `/login?next=…`**, no 200, no marker leak, no runtime-error marker (64 live assertions) |
| `verify:admin-policy` | PASS | shared contract equivalent across both enforcement layers (12 decision cases · 4 live `/admin` routes) |
| `verify:admin-access -- --base :4493` | PASS | 4/4 `/admin` routes redirect 307 → `/login?next=…` logged-out, no marker leak |
| `verify:operator-acceptance -- --base :4493` | PASS | 8/8 acceptance gates green (offline A/D/E + live A/B/C) |
| `verify:routes -- --base :4493` | PASS | 9/9 public routes 200 (data date 2026.07.16) |
| live cron/API 401 probe (`CRON_SECRET` set, :4497) | PASS | `/api/cron/{daily-insight,evaluate-alerts,notify,save-scores}` no-auth → **401**; wrong-bearer → **401**; body `{"error":"Unauthorized"}` |
| `npm audit --omit=dev --json` | critical=0 high=0 moderate=2 | see advisory map above |
| `npx tsc --noEmit` | PASS (0) | — |
| `npm run build` | PASS | 183 static pages, 43 routes, Middleware 90.2 kB |
| `git diff --check` | clean | — |
| encoding (U+FFFD) | 0 | new/edited files scanned |

### Slice A verifier (`verify:framework-baseline`) — 2 expected pre-existing red rows

Ran as a required gate; exits 1 on exactly two earlier-slice-owned rows, neither a
Slice E security-boundary defect:

1. `baseline-freshness` STALE on **exactly 6 fields** — `runtimeDependencies.{declared,resolved}.{next,react,react-dom}` = the expected 14.2.13→15.5.18 / 18.3.1→19.2.7 version drift from the Slice B migration. All other `runtimeDependencies`, the `middlewareBoundary`, and all 43 `sourceRoutes` still **MATCH** → the migration preserved every route/auth/admin contract. Refreshing the pre-migration baseline artifact is Slice F closeout, not this regression pack.
2. `verify:reaudit` → Slice M `methodology-audit` stale (`docs/methodology-audit.md`), Slice F-owned. Recorded since Slice A; not in this diff.

## Frozen / invariants (unchanged this slice)

`src/app/login` + `src/app/auth` (read-only), provider/callback/email-confirmation/
runtime settings, Supabase schema/RLS, cron schedules, public Metrics 2.4,
`public/data`, 138-stock output, analytics event names, SEO/public URLs. Package
versions unchanged (next 15.5.18, react/react-dom ^19.2.0). Publication/deploy excluded.
