# ORNScore framework security hardening plan (2026-07-16)

## 1. Why this batch exists

The production dependency baseline is materially stale:

- `next`: `14.2.13`
- `react` / `react-dom`: `18.3.1`
- `eslint-config-next`: `14.2.13`
- `npm audit --omit=dev --json`: 2 production findings, including one direct
  critical finding on `next` and one transitive moderate `postcss` finding.
- The audit's automatic recommendation is a major update. `npm audit fix
  --force` is therefore not an acceptable migration strategy.

The bounded target for this batch is **Next 15.5.16 plus React 19**, not Next
16. Next 15.5.16 is the first lower-risk supported line that clears the
currently reported critical/high Next ranges while retaining the current
`middleware` boundary. Next 16 additionally changes the build default and the
middleware/proxy contract; that is useful later, but it is not required to
remove the current critical finding and would unnecessarily touch the login
boundary while Naver review is pending.

## 2. Frozen boundaries

Every slice must preserve all of these invariants:

1. Naver review is pending. Do not edit Naver Developers, Supabase provider,
   callback, email-confirmation, custom-provider, auth account, or runtime
   environment settings.
2. Do not change login product behavior or files under `src/app/login` and
   `src/app/auth`. A compile-only type adaptation outside those surfaces must
   still prove identical redirects and callback behavior.
3. Keep the existing admin authorization decision table and middleware
   behavior. Signed-out admin routes redirect to `/login?next=...`; a signed-in
   non-admin remains forbidden; an allow-listed operator remains allowed.
4. Keep public Metrics 2.4, `public/data`, 138-stock output, formula behavior,
   analytics event names, and SEO URLs unchanged.
5. Do not change Supabase schema/RLS, cron schedules, outside-service settings,
   secrets, DNS, hosting, or production data.
6. Do not use `npm audit fix --force`, `--force`, or `--legacy-peer-deps` to
   silence an incompatible dependency graph.
7. Do not upgrade to Next 16 in this batch. Record it as a later decision only.
8. Local commits are allowed. Push and deployment are separate owner actions.

## 3. Ordered slices

### Slice A - security baseline and invariant harness

- Record the exact production audit findings, package versions, runtime
  requirements, and advisory applicability without exposing secrets.
- Add one finite verifier that freezes the route/auth/admin/SEO/data contracts
  that the framework migration must preserve. Reuse existing verifiers instead
  of duplicating their logic.
- Capture build, route, static/dynamic route classification, and middleware
  baselines in deterministic repository evidence.
- Do not change package versions in this slice.

### Slice B - Next 15.5.16 and React 19 package migration

- Upgrade `next` and `eslint-config-next` to `15.5.16` and move React,
  React DOM, and their type packages to a mutually compatible React 19 stable
  set.
- Update the lockfile through a normal npm install. Resolve peer conflicts
  explicitly; never bypass them with force flags.
- Apply only migration-required source/config changes. Preserve the existing
  build command until a later slice proves a change is necessary.
- Required gates: clean install, typecheck, build, focused baseline verifier,
  production audit, and diff/encoding checks.

### Slice C - Next 15 request and caching semantics

- Complete async request API migrations for route/page/image props still using
  synchronous `params` or `searchParams`.
- Audit every GET Route Handler whose behavior depended on the old default
  caching semantics. Make intentional cache behavior explicit where needed;
  do not blanket-force static or dynamic behavior.
- Verify metadata, sitemap, Open Graph images, stock/detail routes, API route
  status codes, and existing revalidation behavior.
- Do not edit login/provider behavior.

### Slice D - React 19 public interaction compatibility

- Exercise hydration and user flows for watchlist, compare, stock filters,
  report forms, analytics click delegation, theme/localStorage, and welcome
  state.
- Fix only demonstrated React 19 regressions or deprecated contracts. Avoid
  speculative component rewrites.
- Verify desktop and 390px mobile layouts, console/page errors, focus behavior,
  and persistent local state.
- Login pages may be smoke-tested read-only but must not be edited.

### Slice E - security boundary regression pack

- Re-certify middleware and page-level admin parity, protected-marker
  non-disclosure, cron/API authorization failures, safe redirects, and public
  route availability on the migrated framework.
- Add regression coverage only where an actual Next advisory or migration
  change reaches ORNScore's code path. Mark non-applicable advisories with
  concrete source/config evidence rather than generic claims.
- No provider, account, schema/RLS, environment, or external-service changes.

### Slice F - full local recertification and handoff

- Run the complete release preflight, framework baseline verifier, production
  audit, typecheck, build, local production route checks, public SEO, admin
  access, operator acceptance, PWA/app checks, Metrics 2.4 verification, and
  desktop/mobile browser smoke.
- Fix the pre-existing stale methodology report if and only if regeneration is
  deterministic and changes no public formula/data behavior.
- Produce a final dossier with exact package versions, audit counts, checks,
  residual findings, rollback point, and owner-only push/deploy steps.
- Do not claim zero risk by hiding a residual advisory. Critical/high
  production findings must be zero; any lower residual must include
  reachability and vendor-status evidence.

## 4. Batch completion definition

The batch is complete only when all six slices have local commits, the queue is
idle with no pending approval or failed run, the worktree is clean, Next is
exactly 15.5.16, production critical/high audit findings are zero, all finite
local gates pass, and the frozen login/Metrics/public-data boundaries are
unchanged. Publication is not part of completion.

## 5. Deferred owner decisions

- Naver review result and any provider-setting follow-up.
- A future Next 16/proxy migration after authentication review is closed.
- Real Vercel traffic-provider credentials and server-side connector.
- Five genuine Metrics 2.5.1 market-day runs and public formula switching.
- Push, deployment, Play submission, DNS, email, and other outside-service
  actions.
