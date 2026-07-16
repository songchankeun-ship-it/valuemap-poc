# ORNScore Framework Security — Slice F full local recertification dossier (2026-07-17)

Controlling plan: `docs/ornscore-framework-security-hardening-2026-07-16.md` (§3 Slice F,
§4 batch completion). This is the final slice: re-certify Slices A–E as one unit on the
migrated **Next 15.5.18 / React 19** baseline, fix the two pre-existing stale reports the
recert surfaced, repair the one demonstrated migration regression, and hand off with an
owner-only push/deploy checklist. **Local only — no push, no deploy, no publication.**

Prior HEAD (Slice F parent): `74fb234` (task 329, Slice E).
Batch parent (pre-Slice-A): `e2416d3` ([codex] Plan Next 15 security hardening queue).

---

## 1. Exact versions (certified)

| Package | Declared | Resolved | Note |
|---|---|---|---|
| next | `15.5.18` | `15.5.18` | migration target met (plan §1) |
| react | `^19.2.0` | `19.2.7` | React 19 stable |
| react-dom | `^19.2.0` | `19.2.7` | React 19 stable |
| eslint-config-next (dev) | `15.5.18` | `15.5.18` | pinned to next |
| @prisma/client | `^5.20.0` | `5.22.0` | unchanged |
| zod | `^3.23.8` | `3.25.76` | unchanged |
| @supabase/ssr | `^0.10.3` | `0.10.3` | unchanged |
| @supabase/supabase-js | `^2.107.0` | `2.107.0` | unchanged |
| next-themes | `^0.4.6` | `0.4.6` | unchanged |
| lucide-react | `^1.17.0` | `1.17.0` | unchanged |

lockfileVersion 3. Toolchain: Node `v24.16.0`, npm `11.13.0`. Next 16 deferred (plan §5).
No `--force`, `npm audit fix --force`, or `--legacy-peer-deps` used anywhere in the batch.

## 2. Production audit (`npm audit --omit=dev --json`)

**critical=0, high=0, moderate=2, low=0, info=0, total=2.** Zero runtime critical/high —
completion gate met.

Both moderates collapse to **Next's OWN bundled build-time PostCSS 8.4.31**
(`node_modules/next/node_modules/postcss`):

- `postcss` GHSA-qx2v-qp2m-jg93 (PostCSS XSS via unescaped `</style>` in CSS stringify,
  `<8.5.10`), severity moderate — **NON-APPLICABLE at runtime**. Reachability evidence:
  PostCSS is a build-time CSS transform only (`postcss.config.mjs` → tailwindcss +
  autoprefixer); there is **no runtime `postcss` import in `src/`** (grep: 0 hits); no
  user-controlled CSS is stringified at runtime. The top-level `postcss` is **8.5.15**
  (already patched, ≥8.5.10) — only Next's internally vendored copy is old.
- `next` moderate is reported **"via postcss" only** (no own `next` advisory on 15.5.18);
  folded into the postcss rule.

Vendor status / fix path: npm's `fixAvailable` suggests `next@9.3.3` (`isSemVerMajor`, a
**downgrade** — rejected). The genuine fix is a later Next 15.5.x patch that revendors
PostCSS ≥8.5.10; Next 16 is deferred (plan §5). No critical/high residual is hidden.

Pre-migration contrast (rollback evidence): at Slice A the same command reported
**critical=1** (next GHSA-f82v-jwr5-mffw, "Authorization Bypass in Next.js Middleware",
CVE-2025-29927) + moderate=1. The migration cleared the critical; §5 re-proves the fix
live.

## 3. Gates run this slice (all green)

Servers: a single task-owned prod server (`npx next start -p 4519`) on a dedicated high
port — **never 3000 / never 4310**; started and stopped by this slice (port confirmed
clear afterward).

| Gate | Result |
|---|---|
| `release:preflight` (offline) | **11/11** (typecheck, verify:metrics, admin-policy, route-analytics, click-analytics, admin-traffic-metrics, admin-traffic-view, admin-resource-state, first-run-ux, reaudit, build) |
| `release:preflight -- --base :4519` (route-health via verify:local) | **11/11**; verify:local **6/6** (smoke:check --all, verify:routes, verify:stocks-seo, verify:public-seo, verify:login-preflight, verify:admin-access) |
| `verify:framework-baseline` (full, orchestrated) | **9/9** — baseline-freshness **FRESH**, audit-block OK, build-classification OK, + 6 delegated contract gates |
| `node scripts/test-framework-baseline.mjs` | **22/22** |
| `npm audit --omit=dev --json` | critical=0 high=0 moderate=2 |
| `npx tsc --noEmit` | 0 errors |
| `npm run build` | PASS (183 static pages, 43 routes, 138 stock pages SSG, Middleware 90.2 kB) |
| `verify:local` route-health (`:4519`) | 6/6 |
| public SEO (`verify:public-seo` + `verify:stocks-seo` **13/13**) | PASS |
| admin access (`verify:admin-access :4519`) | 4/4 (signed-out /admin → 307 /login?next=…, no leak) |
| operator acceptance (`verify:operator-acceptance :4519`) | 8/8 offline+live (owner signed-in matrix = documented manual) |
| security regression (`verify:security-regression :4519`, Slice E pack) | PASS — advisory map + cron/API 401 + safe redirects + **live CVE-2025-29927 bypass** (4 /admin × 4 payloads all 307→/login) |
| Metrics 2.4 (`verify_metrics.py`) | 138 universe, 0 forbidden brand/terms, version pinned **2.4** |
| app/PWA (`app:check`) | PASS (1 external WAIT: assetlinks.json needs real Android package + SHA-256 — owner action, pre-existing) |
| Browser smoke — desktop 1280×800 + mobile **390×844** (CDP, 14 routes each) | **28/28 clean**: 0 page errors, 0 console errors, 0 horizontal overflow; canonical present in `document.head` on every indexable page |

Metrics 2.5.1 shadow track is out of scope here and untouched (still PENDING / owner Gate 6).

## 4. Fixes applied this slice

### 4a. Stale methodology report (plan §3 Slice F, permitted)
`docs/methodology-audit.md` was stale: its committed snapshot header read `20260714`
while the committed `public/data/stocks.json` is `20260716`. Regenerated **only** through
the deterministic repository command `python scripts/methodology_audit.py`. Proof the
change is public-formula/data-neutral: the command **reads** `public/data/stocks.json` and
**writes only** `docs/methodology-audit.md`; `git diff --stat -- public/` is empty; the
diff is 32 lines = the snapshot date + the cross-sectional correlation/contribution/ablation
values that follow deterministically from the (already committed) 20260716 snapshot. Output
is byte-deterministic (re-render == on-disk after newline normalization);
`test:methodology-audit` now PASSES.

### 4b. Framework baseline artifact re-based to the certified post-migration invariants
`docs/ornscore-framework-migration-baseline-2026-07-16.json` was captured at Slice A as the
**pre-migration** freeze. Slice E/D recorded that "baseline refresh = Slice F closeout."
Re-generated through the artifact's own deterministic command
`node scripts/verify-framework-baseline.mjs --generate --audit <fresh audit.json>` from the
fresh build + fresh production audit. The migration **preserved every invariant that
matters**: `middlewareBoundary` (matcher + admin redirect-login/403/shared adminPolicy) and
all **43 source routes** were byte-identical before re-base; only the 6 version fields
(next/react/react-dom × declared+resolved) and the productionAudit block (critical=1→0)
changed — exactly the intended Next 14.2.13→15.5.18 / React 18.3.1→19.2.7 drift. The
generator's meta was corrected so the regenerated artifact honestly documents the Slice-F
re-base rather than claiming "pre-migration"; the self-test's version/secret probes were
adapted to the post-migration audit shape (the `next` finding is now a via-postcss reference
with no advisory object of its own). Baseline verifier is now **FRESH**.

### 4c. Demonstrated React 19 / Next 15 SEO regression — metadata forced back into `<head>`
Recert surfaced a real regression the earlier interaction-only smoke (Slice D) could not
see: **all Metadata-API tags (`<link rel=canonical>`, `<meta name=robots>`, description,
OpenGraph/Twitter, icons) rendered in `<body>` instead of `<head>`** — confirmed in the raw
SSR stream AND in the fully-hydrated DOM via CDP (only `<title>` hoisted). Two compounding
causes, both migration-introduced:
  1. The root layout `src/app/layout.tsx` rendered an **explicit `<head>` element** — the
     documented Next.js App Router anti-pattern; under Next 15/React 19 it pushes
     Metadata-API tags out of the head.
  2. Next 15.2+ **streaming metadata** appends those tags to `<body>` for JS-capable UAs by
     design; only HTML-limited bots get them blocking-in-`<head>`.

The pre-migration (Next 14) contract was: **every** crawler receives canonical/robots in
`<head>`. Non-JS crawlers (e.g. Naver's Yeti — Naver review is pending) would otherwise stop
honoring canonical/robots. Fix restores that exact contract:
  - `src/app/layout.tsx`: removed the manual `<head>`; its custom nodes move to the top of
    `<body>` — `<link rel=preconnect>` (React 19 hoists it to `<head>`, verified), the inline
    font-loading script (runs in place, injects into `document.head` at runtime), `<noscript>`
    fallback, and JSON-LD (Next docs recommend rendering these in the component body). Next's
    Metadata API now owns `<head>`.
  - `next.config.mjs`: `htmlLimitedBots = /.*/` — treats every UA as HTML-limited so metadata
    is always rendered blocking-in-`<head>` (= Next 14 behavior). Metadata here is synchronous
    (static export + local-JSON `generateMetadata`), so TTFB impact is negligible.

Post-fix evidence: raw-HTML canonical/robots/description in `<head>` on dynamic/static/SSG
pages for a plain UA; `verify:stocks-seo` **13/13**; browser smoke 28/28 with 0 hydration
errors. Canonical/robots **values and URLs are unchanged** — only DOM placement was restored.

_Scope note:_ `layout.tsx` and `next.config.mjs` are shared infrastructure, not login/auth
files. `src/app/login` and `src/app/auth` were **not edited**; login product behavior
(redirects, callback, login-preflight, admin→/login redirects) is unchanged and re-verified.

## 5. Frozen boundaries — unchanged (verified)

- `src/app/login`, `src/app/auth`: **untouched** (read-only smoke only); login-preflight +
  admin-access redirect contracts green.
- Provider / account / callback / runtime auth settings, secrets, Supabase schema/RLS, cron
  schedules, DNS/hosting/production data: **untouched**.
- Public **Metrics 2.4**, `public/data`, **138-stock output**, formula behavior:
  **untouched** — `git diff -- public/` empty; `verify_metrics.py` 138 / v2.4 / 0 forbidden;
  `stocks.json` still 20260716.
- Analytics event names: unchanged (route-analytics + click-analytics green).
- SEO / public URLs: unchanged (values identical; §4c restored head placement).
- Next 16: deferred. Remote publication / service release: excluded.

## 6. Residual findings (with reachability / vendor evidence)

| Sev | Finding | Reachability / vendor | Owner action |
|---|---|---|---|
| moderate | postcss GHSA-qx2v-qp2m-jg93 via Next's bundled postcss 8.4.31 | Build-time only; no runtime `postcss` import in `src/`; top-level postcss 8.5.15 patched. Not runtime-reachable. | Adopt a later Next 15.5.x patch that revendors postcss ≥8.5.10 (Next 16 deferred). No safe non-downgrade fix today. |
| moderate | next moderate "via postcss" | Same as above; no own next advisory on 15.5.18. | Same. |
| — (WAIT) | `public/.well-known/assetlinks.json` not generated | Needs a real Android package name + release SHA-256 fingerprint. | Owner: run `app:assetlinks` with the real fingerprint at TWA packaging time. |

No critical/high residual. Nothing hidden.

## 7. Rollback

- Revert **just Slice F**: `git reset --hard 74fb234` (Slice F parent) — restores the
  Slice-E worktree (baseline artifact stays pre-migration-stale, methodology stale, SEO
  metadata back in `<body>`).
- Revert the **entire framework batch** (Slices A–F): `git reset --hard e2416d3`
  (pre-Slice-A). Returns to Next 14.2.13 / React 18.3.1 with the pre-migration critical
  audit finding. Only for a full abandonment of the migration.

## 8. Owner-only follow-up (push / deploy is a separate owner action)

1. Review this local `[codex]` commit; nothing is pushed.
2. `git push` the branch, open the PR to the task main branch; let Vercel build a preview.
3. On the preview, re-run route-health against the deployed URL
   (`npm run release:preflight -- --base <preview-url> --no-perf`) and spot-check that
   canonical/robots sit in `<head>` (View Source).
4. Merge / promote to production only after the Naver review outcome is known (login/provider
   settings remain owner-frozen until then).
5. Track the postcss residual: bump to the first Next 15.5.x patch that revendors postcss
   ≥8.5.10 when released; re-run `npm audit --omit=dev` to confirm moderate=0.
6. Generate `assetlinks.json` at Android TWA packaging time with the real fingerprint.

## 9. Batch completion (plan §4)

All six slices have local `[codex]` commits; the queue is idle; the worktree is clean; Next
is exactly **15.5.18**; production **critical/high audit findings are zero**; every finite
local gate above is green; and the frozen login / Metrics 2.4 / public-data boundaries are
unchanged. **Publication is not part of completion and was not performed.**
