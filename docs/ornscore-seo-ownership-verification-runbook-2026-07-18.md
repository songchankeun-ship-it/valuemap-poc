# ORNScore — Search-Engine Ownership Verification Runbook

Date: 2026-07-18
Slice: SEO authority Slice D (docs/ornscore-seo-authority-plan-2026-07-18.md §4 Slice D)
Scope: environment-driven Google / Naver ownership-verification metadata + the exact
owner-only publication and search-submission sequence.

> **Read this first.** This runbook is split into two hard-separated parts. **Part A** is
> repository work already completed in this slice — no external service is touched. **Part B**
> is an **owner-only external checklist** that this batch does **not** execute: no browser is
> opened, no network request is made, no token is committed, and no sitemap is submitted.
> An AI agent or CI job must stop at the Part A / Part B boundary.

---

## Part A — Repository work (done in this slice, no external action)

The site emits the ownership-verification `<meta>` tags **only when an environment variable is
present**, so nothing is hard-coded and a local build needs no token.

| Concern | Where |
| --- | --- |
| Pure metadata helper | `src/lib/seoVerification.ts` (`ownershipVerification(env)`) |
| Wired into root metadata | `src/app/layout.tsx` (`verification: ownershipVerification()`) |
| Placeholder variable names (blank, never a real token) | `.env.example` |
| Finite offline test | `scripts/test_seoOwnershipVerification.ts` (`npm run test:seo-verification`) |

Environment variables (single source of truth: `src/lib/seoVerification.ts`):

- `GOOGLE_SITE_VERIFICATION` → emits `<meta name="google-site-verification" content="…">`.
- `NAVER_SITE_VERIFICATION` → emits `<meta name="naver-site-verification" content="…">`.

Behavior contract:

- **Unset or blank** → the tag is **not** emitted (`verification` is `undefined`). Local
  `npm run build` succeeds with no placeholder content.
- **Set to a synthetic/real value** → the corresponding tag is emitted with exactly that value.
- Whitespace-only values are treated as unset (a blank `.env.example` entry never leaks a tag).
- The tokens are public head values; they are **build/SSR-time** only and are **never committed**.

Local proof that no token is required (repository work — safe to run):

```bash
# 1) tag helper unit contract (offline)
npm run test:seo-verification

# 2) local build with NO verification env → build succeeds, no *-site-verification meta
npm run build

# 3) optional: prove a synthetic value emits the tag, then discard it
GOOGLE_SITE_VERIFICATION=synthetic-google NAVER_SITE_VERIFICATION=synthetic-naver \
  npm run build     # head now contains google-/naver-site-verification (synthetic, throwaway)
```

Do **not** paste a real console-issued token into `.env.example` or any committed file. Real
values belong only in the hosting environment (Part B, step 4).

---

## Part B — Owner-only external checklist (NOT performed by this batch)

Every step below is performed by the human repository owner, signed into the real services.
An automated agent must not do any of these. They happen **after** the reviewed commits are
pushed and the exact commit is deployed.

### B0. Preconditions

- The reviewed SEO commits (Slices A–F) are pushed and the exact commit is deployed to
  `https://ornscore.com`.
- The public footer build marker equals the deployed commit SHA (see B5 — record it).

### B1. Set the verification values in the hosting environment

1. In Google Search Console, add the `https://ornscore.com` property and choose the
   **HTML tag** method; copy the `content` value.
2. In Naver Search Advisor (서치어드바이저), add the site and choose the **HTML 태그** method;
   copy the `content` value.
3. In the hosting provider's environment settings (not the repository), set:
   - `GOOGLE_SITE_VERIFICATION` = the Google value.
   - `NAVER_SITE_VERIFICATION` = the Naver value.
4. Redeploy (or trigger a rebuild) so the deployed HTML `<head>` now contains both
   `*-site-verification` meta tags. Confirm with **View Source** on the live home page.

### B2. Verify ownership

1. In Google Search Console, click **Verify** for the HTML-tag method. Expect success.
2. In Naver Search Advisor, click **소유확인 / Verify**. Expect success.

If verification fails, confirm the deployed `<head>` actually contains the tag (B1.4) and that
the environment value matches the console-issued value exactly.

### B3. Submit the canonical sitemap

- Submit exactly `https://ornscore.com/sitemap.xml` in both:
  - Google Search Console → **Sitemaps**.
  - Naver Search Advisor → **요청 › 사이트맵 제출**.
- Submit the canonical origin only. Do not submit per-page or query-string URLs.

### B4. Inspect representative URLs

Use each console's URL-inspection / 수집요청 tool on one representative URL per indexable family:

- A stock detail page, e.g. `https://ornscore.com/stock/005930`.
- A topic page, e.g. `https://ornscore.com/topics/battery-stocks`.
- A curated comparison page, e.g. `https://ornscore.com/compare/005930-vs-000660`.

Confirm each is crawlable, returns the self-canonical URL, and is `index,follow`. Do **not**
request indexing for retired `/theme/*` URLs or arbitrary `/compare/*` pairs — those are
intentionally redirected or `noindex`.

### B5. Record the deployed commit marker

- Read the deployed commit SHA from the public footer build marker
  (`title="코드 <sha>"`, emitted from `VERCEL_GIT_COMMIT_SHA` in `src/app/layout.tsx`).
- Record it alongside the verification date so a later audit can prove *which* commit's search
  surface was submitted. Example line to keep with your operator notes:

  ```
  2026-07-__ ownership verified (Google+Naver) · sitemap submitted · deployed marker <sha7>
  ```

The repository-side commit-status / route-canary helpers
(`npm run verify:commit-status`, `npm run verify:route-canary`) can confirm the live marker
equals the expected SHA before you record it. Those are read-only GET probes — they never
trigger a deploy or mutate a console.

---

## Boundary reminder

- Part A = repository files only (metadata helper, `.env.example` blanks, offline test, this doc).
- Part B = owner-only, in the real Google/Naver consoles and the hosting environment.
- No real token is committed. No browser, network request, or console action is part of this slice.
