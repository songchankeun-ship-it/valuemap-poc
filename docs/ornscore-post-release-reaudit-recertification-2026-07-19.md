# ORNScore Reaudit C — Full Local Recertification Dossier (2026-07-19)

**Task:** 366 — ORNScore Reaudit C — full local recertification of the Korean grammar
and locale-state repairs (Reaudit A + Reaudit B).
**Branch:** `ai-center/task-366-ornscore-reaudit-c-full-local-recert`
**Scope:** Recertification only. No source repair was required — every check passed
against the code as shipped by A/B. Writable paths were limited to this dossier,
`PROGRESS.md`, `docs/AI_HANDOFF.md`, and (unused) the exact A/B source files.

This is a single, finite, local recertification. Nothing was pushed, published,
deployed, or mutated remotely; `main` is unchanged. Metrics 2.5.1 remains shadow-only;
public stays **Metrics 2.4**.

---

## 1. Commit identifiers

| Role | Commit | Note |
|---|---|---|
| HEAD at recert | `fc98d5b` | `[codex] Recover task 364 budget-only completion state` (docs-only) |
| Reaudit B — locale-state impl | `b68cd0a` | `locale-state: Korean-only public-locale invariant + deterministic tests` |
| Reaudit A — task record | `257e4db` | `ai-center(task 363): ORNScore Reaudit A — curated comparison Korean grammar repair` |
| Reaudit A — comparison-language impl | `e41bbdd` | `comparison-language: deterministic Korean particles on curated compare pages` |
| **Git-object comparison base (known-good)** | `a1235a1` | `merge: [codex] integrate daily data before SEO release` — the last pre-A/B state |

Preceding known-good chain: `a1235a1` → `e41bbdd` (A impl) → `257e4db` (A record) →
`b68cd0a` (B impl) → `fc98d5b` (B budget-recovery, HEAD).

---

## 2. Git-object comparison against `a1235a1` (identity proofs)

All proofs use `git rev-parse <ref>:<path>` (object identity) — not textual diff — so
they are exact.

| Proof | base `a1235a1` | HEAD `fc98d5b` | Verdict |
|---|---|---|---|
| `public/data` tree | `24045925…` | `24045925…` | **identical** |
| `public/data/stocks.json` blob | `c037daf4…` | `c037daf4…` | **identical** |
| `git diff a1235a1 HEAD -- public/data` | — | — | **empty** (exit 0) |
| `src/app/login` tree | `d8ae30d…` | `d8ae30d…` | **identical** |
| `src/app/auth` tree | `983db41…` | `983db41…` | **identical** |
| `src/middleware.ts` blob | `92efe16…` | `92efe16…` | **identical** |
| `git diff a1235a1 HEAD -- src/app/login src/app/auth` | — | — | **empty** (exit 0) |

**138 stocks / Metrics 2.4:** `public/data/stocks.json` holds **138** entries;
`PYTHONUTF8=1 python scripts/verify_metrics.py` → *검사 138종목 · 오류 0건*,
brand blocklist 0, formula version **Metrics 2.4** (exit 0).

**Next/React versions unchanged:** the `package.json` blob differs from base
(`e7447f8…` → `81c64aa…`) **only** by the two added dev test-script lines
(`test:comparison-language`, `test:locale-invariant`); dependency versions are
byte-identical — `next 15.5.18`, `react ^19.2.0`, `react-dom ^19.2.0`,
`eslint-config-next 15.5.18`. Installed (resolved) versions: **next 15.5.18 /
react 19.2.7 / react-dom 19.2.7**.

**Changed-file set `a1235a1..HEAD`** (exactly the allowed A/B surface + docs):
`PROGRESS.md`, `docs/AI_HANDOFF.md`, `package.json`,
`scripts/test_comparisonLanguage.ts`, `scripts/test_localePublicInvariant.ts`,
`src/app/compare/[pair]/page.tsx`, `src/components/LanguageProvider.tsx`,
`src/lib/comparison.ts`, `src/lib/particle.ts`.

---

## 3. Offline verification suite (all green)

| Check | Command | Result |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | exit 0 |
| Grammar — comparison particles | `npm run test:comparison-language` | PASS |
| Locale — Korean-only invariant | `npm run test:locale-invariant` | PASS |
| Comparison landings | `npm run test:comparison-pages` | PASS |
| Compare query parsing | `npm run test:compare` | PASS |
| Compare entry points | `npm run test:compare-entry` | PASS |
| SEO search-surface contract | `npm run test:seo-contract` | PASS |
| SEO stability | `npm run test:seo-stability` | PASS |
| Topic/theme authority | `npm run test:theme-authority` | PASS |
| SEO ownership verification | `npm run test:seo-verification` | PASS |
| SEO release gate self-test (self-owned loopback) | `npm run test:seo-release` | PASS |
| Metrics verification | `PYTHONUTF8=1 python scripts/verify_metrics.py` | 138 / 0 errors / Metrics 2.4, exit 0 |
| Full Next build | `npm run build` | exit 0 — static; `/stock/[ticker]` **138** SSG, `/topics/[slug]` **9**, `/compare/[pair]` **7**, Middleware **90.2 kB** |
| App readiness | `npm run app:check` | passed (1 external gate **WAIT** = `assetlinks.json`, owner-only) |
| Reaudit A–M source contracts | `npm run verify:reaudit` | **13/13** passed |
| git diff whitespace | `git diff --check` (worktree + `a1235a1..HEAD`) | clean (exit 0) |
| UTF-8 corruption | U+FFFD (`EF BF BD`) scan on all 9 changed files | **0** |

---

## 4. Live loopback server + full route smoke set

**Server:** one task-owned compiled prod listener — `npm run build` then
`VERCEL_GIT_COMMIT_SHA=$(git rev-parse HEAD) npx next start -p 4495`. Ports
**3000 / 4310** (always-on AI Center) untouched. (Ports 4471 and 4487 were found
already occupied by unrelated processes and were left untouched; port 4495 was
verified free before use.)

| Gate | Command (`--base http://localhost:4495`) | Result |
|---|---|---|
| Route health | `verify:routes` | **9/9** OK (data date 2026.07.16) |
| Public SEO | `verify:public-seo` | **3/3** OK (sitemap **166** URLs) |
| Stocks SEO | `verify:stocks-seo` | **13/13** OK |
| Login preflight | `verify:login-preflight` | **5/5** OK (`lang="ko"`; no KO/EN toggle) |
| Local route-health aggregate | `verify:local` | real gates **6/6** OK (perf ADVISORY) |
| SEO release gate | `verify:seo-release --sha <HEAD>` | **11/11** OK — sitemap 166, canary **6/6**, deployment-marker == expected SHA `fc98d5b` |
| Full smoke | `smoke:check --all` | **25/25** OK |
| Release preflight | `release:preflight --no-perf` | **11/11** OK |

**Server teardown:** the task-owned listener (PID 37576 on :4495) was stopped and
**confirmed down** — post-stop `curl http://localhost:4495/` returns exit 7 and
`netstat` shows no listener on 4495. Ports 3000/4310/4471/4487 were confirmed
untouched.

---

## 5. Desktop + 390×844 view inspection (headless Chrome over CDP)

A task-owned headless Chrome (system Chrome, `--headless=new`) was driven over the
DevTools Protocol against the :4495 server. **38 rows** total = 2 viewports
(desktop 1280×800, mobile **390×844**) × [12 pages + 6 seeded-legacy paths + 1
`?lang=en` control].

Pages inspected each viewport: **home** `/`, **stocks** `/stocks`, **stock detail**
`/stock/005930`, **login** `/login`, **data deletion** `/data-deletion`, and **all 7
curated comparison pages** (`005930-vs-000660`, `032830-vs-085620`,
`000990-vs-042700`, `247540-vs-066970`, `055550-vs-105560`, `105560-vs-086790`,
`006400-vs-373220`).

| Invariant | Result |
|---|---|
| Horizontal overflow (`documentElement.scrollWidth > innerWidth+1`) | **0 / 38** rows — every page fits (all 7 compare pages: `scrollW=390=innerW` at 390px) |
| Placeholder particles (`은(는)`/`이(가)`/`와(과)`/`을(를)` etc. in rendered text) | **0 / 38** rows |
| Console errors / warnings / uncaught exceptions | **0 / 38** rows |
| `documentElement.lang` on ordinary (non-control) rows | **ko** on all 31 rows |

**Seeded-legacy-durable-state English-leak test (the core B invariant):** on each
viewport, `localStorage["ornscore.locale"]="en"` **and** `cookie ornscore_locale=en`
were seeded on-origin, then ordinary paths (no `?lang`) were loaded: `/`, `/stocks`,
`/stock/005930`, `/compare/005930-vs-000660`, `/login`, `/data-deletion`.

- **All 12 seeded rows rendered `lang=ko`** with Korean text present, and
- the legacy durable state was **self-cleared** — post-load `localStorage.getItem`
  and the `ornscore_locale` cookie were both **null**.

→ **No ordinary-path English leak from seeded legacy durable state.** The
ephemeral override control `?/stocks?lang=en` still rendered `lang=en` (2/2), so the
internal verification override remains functional (English is view-only, never
durable). This matches `resolvePublicLocale` (only the `query-en` branch returns
`en`; `default`/`query-ko` always converge to `ko` and request legacy cleanup).

---

## 6. Residual waits (owner-only; NOT performed by this task)

- **`public/.well-known/assetlinks.json`** — `app:check` reports one external WAIT;
  needs the real Android package name + SHA-256 signing fingerprint (owner-only).
- **Publication / deploy** — push, deploy the exact commit, and confirm the live
  footer build marker == the deployed SHA (owner-only; this task verified the marker
  contract locally only).
- **Search Console / Naver** — set ownership tokens in hosting env, verify ownership,
  submit `https://ornscore.com/sitemap.xml`, inspect representative URLs (owner-only;
  see `docs/ornscore-seo-ownership-verification-runbook-2026-07-18.md`).
- **Metrics 2.5.1** — remains shadow-only; not promoted. Public stays Metrics 2.4.

---

## 7. Recertification verdict

Reaudit A (deterministic Korean particles on curated compare pages) and Reaudit B
(Korean-only public-locale invariant) **recertify green** as one unit on a full local
build: identity proofs against `a1235a1` hold (public/data, login/auth, versions),
138 stocks on Metrics 2.4, the complete offline test/typecheck/build suite passes,
the full live route smoke set passes on a task-owned compiled server, and a real
headless-browser inspection of both viewports shows zero overflow, zero placeholder
particles, zero console errors/warnings, and zero English leak from seeded legacy
durable state. No defect was demonstrated, so no A/B source file was modified. One
local `[codex]` commit carries this dossier and the handoff updates; the worktree is
left clean; `main` is unchanged.
