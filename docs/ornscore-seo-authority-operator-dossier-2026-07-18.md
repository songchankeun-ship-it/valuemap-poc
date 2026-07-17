# ORNScore SEO authority — operator dossier (Slice F, 2026-07-18)

Governing plan: `docs/ornscore-seo-authority-plan-2026-07-18.md` (Base commit `a828c0d`).
Recertified HEAD before this commit: `265a40ca44cb0352882e2a1347d9e90a9a06643e` (`265a40c`, Slice E wrapper).
Plan-definition commit: `28972ed` (`docs: [codex] define SEO authority batch`).
Toolchain: Node `v24.16.0`, npm `11.13.0`, Git `2.54.0.windows.1`, Python `3.12.10`.

This is the batch-close deliverable for the SEO authority batch. It re-certifies
Slices A–E as one unit from a clean `npm ci`, records exact command/state
evidence, and lists the owner-only steps that must precede any push, deploy, or
outside search-engine action. Nothing here pushes, publishes, deploys, connects
an outside service, mutates a remote resource, or changes a runtime value.
Public Metrics 2.4, `public/data`, the 138-stock universe, workflow control
fields, and the frozen login/auth surface are byte-for-byte unchanged from the
plan base `a828c0d`. Metrics 2.5.1 remains shadow-only and is **not** promoted.

---

## 1. Recertification result (one unit)

Every finite local gate below ran from HEAD `265a40c` after a clean `npm ci`.
All passed. The live gates ran against a task-owned local production server on a
dedicated port (`4489`, not `3000`, not AI Center `4310`) that this task started
with `VERCEL_GIT_COMMIT_SHA=<HEAD>` and stopped afterward (post-kill `curl` exit
7 — unreachable).

### 1.1 Install / typecheck / build

| Command | Result | Exit |
| --- | --- | --- |
| `npm ci` | clean deterministic install — added 410 packages, audited 411 | 0 |
| `npx tsc --noEmit` | no type errors | 0 |
| `npm run build` | Compiled successfully; `Generating static pages (192/192)`; `/stock/[ticker]` SSG = 138, `/topics/[slug]` SSG = 9, `/compare/[pair]` SSG = 7; Middleware 90.2 kB | 0 |

Exact resolved versions in `node_modules` after `npm ci`:

| Package | Version |
| --- | --- |
| next | 15.5.18 |
| react | 19.2.7 |
| react-dom | 19.2.7 |
| eslint-config-next | 15.5.18 |
| typescript | 5.9.3 |
| tsx | 4.22.4 |

### 1.2 Audit

| Scope | critical | high | moderate | low | total |
| --- | --- | --- | --- | --- | --- |
| `npm audit --omit=dev` (production/public path) | 0 | 0 | 2 | 0 | 2 |
| `npm audit` (full, incl. dev tooling) | 0 | 1 | 2 | 1 | 4 |

- Production **critical=0 / high=0** — the zero-high release gate holds.
- Production moderate=2 = the `postcss` advisory (GHSA-qx2v-qp2m-jg93, XSS via
  unescaped `</style>` in CSS stringify, `<8.5.10`), pulled through `next`'s
  bundled `postcss`. Build-time CSS stringify only; not on the public request
  path; not owner-fixable without a Next-line change.
- Full-audit extras are **dev-only, no public exposure**: `HIGH xlsx` (SheetJS
  prototype pollution + ReDoS — offline spreadsheet scripts only) and `LOW
  esbuild` (dev-server file read on Windows, via `tsx`). Neither ships to
  production. `npm audit fix --force` is a forbidden downgrade path and was not
  run.

### 1.3 Static (offline) SEO tests + Metrics 2.4

| Gate | Command | Result | Exit |
| --- | --- | --- | --- |
| SEO meta stability | `npm run test:seo-stability` | PASS — stable stock meta + deterministic sitemap lastmod + controlled former-name aliases | 0 |
| Search-surface contract | `npm run test:seo-contract` | PASS — indexable families, canonical ownership, 7-pair allowlist, theme migration map, mock exclusions; verifier fails on duplicate ownership / zero-real theme / arbitrary pair / sitemap drift | 0 |
| Topic authority + theme retirement | `npm run test:theme-authority` | PASS — bio/shipbuilding real topics + 4 legacy `/theme/*` 308 redirects + `robot` noindex + sitemap removal + no mock fallback | 0 |
| Curated comparison pages | `npm run test:comparison-pages` | PASS — 7-pair allowlist only, `dynamicParams=false`, price/score-free metadata, higher/lower language, breadcrumb JSON-LD, internal links, curated-only sitemap; arbitrary/reverse pairs never resolve or index | 0 |
| Ownership verification (Slice D) | `npm run test:seo-verification` | PASS — env-driven Google/Naver tags, empty-token safe | 0 |
| SEO release gate self-test | `npm run test:seo-release` | PASS — positive/negative fixtures + loopback runs; fails on stale/missing SHA, duplicate canonical, mock-backed indexing, arbitrary/reverse pair, volatile metadata; task-owned mock stopped | 0 |
| Metrics 2.4 output (frozen) | `PYTHONUTF8=1 python scripts/verify_metrics.py` | 138 stocks · 0 errors · brand banned-term 0 · formula = Metrics 2.4 | 0 |

### 1.4 Live gates (task-owned server, port 4489, marker = HEAD)

| Gate | Command | Result | Exit |
| --- | --- | --- | --- |
| **SEO release gate** | `npm run verify:seo-release -- --base http://127.0.0.1:4489 --sha 265a40c…` | **11/11 OK**; sitemap 166 URLs; route/marker canary 6/6; deployment-marker == expected SHA | 0 |
| Public routes | `npm run verify:routes -- --base …` | 9/9 · expected data date 2026.07.16 | 0 |
| Public SEO surface | `npm run verify:public-seo -- --base …` | 3/3 · sitemap 166 URLs · robots + cross-consistency | 0 |
| Stocks SEO | `npm run verify:stocks-seo -- --base …` | 13/13 | 0 |
| Smoke, full (desktop) | `npm run smoke:check -- --base … --all` | 25/25 (incl. 404 + invalid-ticker degrade) | 0 |
| Release preflight (live) | `npm run release:preflight -- --base … --no-perf` | 11/11 all green | 0 |
| Mobile smoke 390×844 | `curl` (iPhone UA) over 8 representative routes incl. `/topics/bio-stocks`, `/topics/shipbuilding-stocks`, `/compare/005930-vs-000660` | 8/8 · 200 · no critical runtime markers · `lang="ko"` | 0 |

### 1.5 Negative controls (gate is a real fail-closed decision)

| Scenario | Command | Result | Exit |
| --- | --- | --- | --- |
| Stale deployment SHA | `verify:seo-release … --sha deadbeef1234` | FAIL — `STALE build served`; canary 0/6 (stale_marker=6); 10/11 | 1 |
| Missing deployment SHA | `verify:seo-release …` (no `--sha`) | FAIL — `no expected deployment SHA … cannot verify`; 10/11 | 1 |

A stale or missing expected SHA is a hard publication failure, not a warning.

---

## 2. Implemented canonical URL families (indexable, real-data)

All families are backed by real `public/data` input already consumed by the site;
each has one canonical search intent, is reachable via server-rendered internal
links, and appears in `sitemap.xml` (166 URLs total = 12 static + 9 topics + 7
curated comparisons + 138 stocks).

- **`/stock/[ticker]`** — 138 stock detail pages (SSG). Stable metadata excludes
  volatile score/price values.
- **`/topics/[slug]`** — 9 real-data topic pages (SSG): `undervalued-stocks`,
  `dividend-stocks`, `low-per-stocks`, `low-pbr-stocks`, `high-roe-stocks`,
  `battery-stocks`, `semiconductor-stocks`, `bio-stocks`, `shipbuilding-stocks`.
- **`/compare/[pair]`** — 7 curated comparison landing pages (SSG,
  `dynamicParams=false`): `005930-vs-000660`, `032830-vs-085620`,
  `000990-vs-042700`, `247540-vs-066970`, `055550-vs-105560`,
  `105560-vs-086790`, `006400-vs-373220`. Neutral higher/lower language,
  breadcrumb JSON-LD, self-canonical, links to both stock pages and the
  interactive compare view.
- Root `/`, `/stocks` (query-aware canonical/noindex), and other static pages as
  before.

Retired / non-indexable (proven by live gate + tests):

- Permanent **308** redirects: `/theme/battery → /topics/battery-stocks`,
  `/theme/semi-materials → /topics/semiconductor-stocks`,
  `/theme/bio → /topics/bio-stocks`,
  `/theme/shipbuilding → /topics/shipbuilding-stocks`.
- `/theme/robot` — **noindex**, removed from sitemap; no mock stocks exposed to
  index.
- Arbitrary and reverse-order `/compare/*` pairs — `notFound()` in static
  generation, `robots:{index:false}` with no alternate self-canonical.

---

## 3. Command results summary

Green (exit 0): `npm ci`, `tsc --noEmit`, `build`, `test:seo-stability`,
`test:seo-contract`, `test:theme-authority`, `test:comparison-pages`,
`test:seo-verification`, `test:seo-release`, `verify_metrics.py`,
`verify:seo-release` (11/11), `verify:routes` (9/9), `verify:public-seo` (3/3),
`verify:stocks-seo` (13/13), `smoke:check --all` (25/25),
`release:preflight --no-perf` (11/11), mobile 390×844 fetch smoke (8/8).

Intended failures (exit 1, negative controls): stale `--sha`, missing `--sha`.

No pending local gate, no unresolved failure.

---

## 4. Frozen-boundary proof (byte-identical to plan base `a828c0d`)

| Family | Path | Git object (base == HEAD) |
| --- | --- | --- |
| Public data / Metrics / 138-stock output | `public/data` (tree) | `1ab0e42dd5e3f95df04f3324616d6bae51f40b8c` |
| Stock universe blob | `public/data/stocks.json` | `b9d09f33268ed3fe232ce37ddbe052640c8bd695` |
| Login surface | `src/app/login` (tree) | `d8ae30d6a25c9d294de6cb4969ca79ee39b5f987` |
| Auth surface | `src/app/auth` (tree) | `983db4152e8be56b36f131b79c1bd58e5171ee34` |
| Workflow control | `.github/workflows` (tree) | `bdffea9cd95393f244a41be32d52018dfd9c951a` |

- `git diff -- public/data` = **0 bytes**; 138 stocks in `stocks.json`; 138 price
  files in `public/data/prices/`.
- `git diff --check` clean; worktree `git status --porcelain` = 0 lines before
  the Slice F documentation commit.
- Supabase / runtime values, analytics event names, public financial
  calculations, and the scoring formula unchanged. Next stays 15.5.18 (no Next 16
  migration); no dependency additions.
- No `.env` token committed; `.env.example` carries empty Google/Naver
  placeholders only.
- Task-owned server started and stopped by this task (post-kill `curl` exit 7);
  ports `3000` / `4310` untouched. No push; `main` unchanged; no external Search
  Console / Search Advisor action.

---

## 5. Rollback points

Each slice is one local `[codex]` commit; revert in reverse order to unwind.

| Slice | `[codex]` commit | Wrapper commit |
| --- | --- | --- |
| A — search-surface contract | `540eddf` | `bf58544` |
| B — real topic authority + theme retirement | `6e4a6ad` | `36e9bcf` |
| C — curated comparison landing pages | `4813aae` | `87cf0ff` |
| D — ownership verification readiness + runbook | `3db60a0` | `b7fc5c6` |
| E — exact-SHA SEO release gate | `fcc5297` | `265a40c` |
| F — this recertification dossier | (this commit) | — |

Slice F is documentation only (`PROGRESS.md`, `docs/AI_HANDOFF.md`, this
dossier); reverting it changes no runtime code, route, or data.

---

## 6. Residual risks

1. **Real-device pixel QA is an owner gate.** No headless browser (puppeteer/
   playwright) is installed and new deps are forbidden. The 390×844 mobile smoke
   proves HTTP 200, absence of critical runtime markers, and `lang="ko"` on
   representative routes — not exact pixel fold, horizontal overflow, or sticky
   overlap. Real-device 390×844 and desktop layout inspection remain owner-only.
2. **Ownership tokens are environment-driven and intentionally absent.** Local
   build works with no `GOOGLE_SITE_VERIFICATION` / `NAVER_SITE_VERIFICATION`.
   The owner must set them in the hosting environment before external ownership
   verification; the emitted tag is proven by the Slice D self-test with a
   synthetic local value.
3. **`postcss` moderate advisory** is pulled through `next` and is not
   owner-fixable without a Next-line change. It is build-time only, off the
   public request path.
4. **Deployment-marker gate depends on the deploy environment** setting
   `VERCEL_GIT_COMMIT_SHA` for the reviewed commit. Locally proven with the SHA
   injected; the owner must confirm the live footer marker equals the reviewed
   SHA after the real deploy (step §7.3).
5. **Metrics 2.5.1 remains shadow-only** and out of this batch. Public stays
   Metrics 2.4. Do not declare it ready or switch the public formula here.

---

## 7. Owner-only follow-up (plan §6 — NOT executed by this batch)

Local completion does not mean public search submission is complete. The
following remain owner-controlled and were deliberately **not** performed:

1. Push the reviewed commits.
2. Deploy the exact reviewed commit.
3. Verify the public deployment marker equals that commit SHA (re-run
   `verify:seo-release -- --base https://ornscore.com --sha <deployed>` after
   deploy).
4. Set ownership-verification values in the hosting environment if needed.
5. Verify ownership in Google Search Console and Naver Search Advisor.
6. Submit `https://ornscore.com/sitemap.xml` and inspect representative stock,
   topic, and comparison URLs.

No ranking promise is made. The batch delivers a coherent, real-data,
technically verifiable search surface, gated on an exact deployment commit.
</content>
</invoke>
