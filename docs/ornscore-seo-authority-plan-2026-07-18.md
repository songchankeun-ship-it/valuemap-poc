# ORNScore SEO Authority Plan

Date: 2026-07-18
Base commit: `a828c0d`
Repository: `C:\dev\OrnScore`

## 1. Objective

Finish the meaningful local SEO foundation on top of the current repository instead of applying the older external implementation kit verbatim. The current site already has stable stock metadata, canonical URLs, robots rules, a dynamic sitemap, JSON-LD, topic pages, and public SEO verifiers. This batch closes the remaining authority and release-gate gaps without creating thin pages or changing public financial data.

The completion standard is:

> Every indexable URL is backed by real repository data, has one canonical search intent, is reachable through server-rendered internal links, and can be checked against an exact deployment commit before search-engine submission.

## 2. Frozen boundaries

The following are outside this batch and must remain unchanged:

- Naver review state and all login/auth/provider/callback behavior.
- Supabase configuration, credentials, schema, RLS, email, and runtime values.
- Public Metrics 2.4, shadow Metrics 2.5.1, rollout counts, and the 138-stock output.
- `public/data/**`, daily workflow control fields, analytics event names, and public financial calculations.
- External Search Console/Search Advisor actions, DNS records, hosting settings, repository synchronization, push, publication, and deployment.
- Package additions, Next 16 migration, and speculative mass-generated content.

Only repository files and finite local verification are authorized.

## 3. Current evidence

Already present and retained:

- Root metadata, Organization/WebSite/SearchAction JSON-LD, `robots.ts`, and `sitemap.ts`.
- Stable stock detail metadata that excludes volatile score and price values.
- Query-aware `/stocks` canonical/noindex rules.
- Seven real-data `/topics/*` pages.
- `test:seo-stability`, `verify:stocks-seo`, and `verify:public-seo`.

Remaining authority gaps:

1. Legacy `/theme/*` URLs overlap topic intent; one indexed theme currently falls back to mock data.
2. `/compare` has an interactive query route but no curated, stable comparison landing pages.
3. Search-engine ownership verification is not environment-driven in repository metadata.
4. The public SEO gate does not yet prove canonical comparison pages, retired theme behavior, or an exact deployment marker together.

## 4. Ordered implementation slices

### Slice A - Search surface contract

- Add a source-of-truth verifier for indexable families, canonical ownership, retired URL behavior, and forbidden mock-backed indexing.
- Record the approved curated comparison allowlist and legacy-theme migration map in repository code/data that later slices consume.
- Do not change rendered pages in this slice.

Acceptance:

- The verifier fails on duplicate theme/topic ownership, an indexable zero-real-match theme, arbitrary comparison pairs, or sitemap drift.
- Existing SEO tests remain green.

### Slice B - Real-data topic authority and legacy theme retirement

- Add real-data topic coverage for `bio-stocks` and `shipbuilding-stocks` using the existing topic data pipeline.
- Permanently redirect `/theme/battery` to `/topics/battery-stocks`.
- Permanently redirect `/theme/semi-materials` to `/topics/semiconductor-stocks`.
- Permanently redirect `/theme/bio` to `/topics/bio-stocks`.
- Permanently redirect `/theme/shipbuilding` to `/topics/shipbuilding-stocks`.
- Remove retired theme URLs from the sitemap.
- Make `/theme/robot` non-indexable and remove it from the sitemap until real coverage exists. It must not render mock stocks as public evidence.

Acceptance:

- Every indexable topic is backed by real `public/data` input already consumed by the site.
- No mock-derived theme aggregate or mock fallback is indexable.
- Redirect and noindex behavior is covered by finite tests.

### Slice C - Curated comparison landing pages

- Add a shared curated comparison registry and stable route `/compare/[pair]`.
- Index only these exact, evidence-backed pairs:
  - `005930-vs-000660`
  - `032830-vs-085620`
  - `000990-vs-042700`
  - `247540-vs-066970`
  - `055550-vs-105560`
  - `105560-vs-086790`
  - `006400-vs-373220`
- Do not index or generate arbitrary pair combinations. Unknown and reverse-order pairs must not become alternate canonical pages.
- Render unique server-side titles, descriptions, H1 text, neutral metric differences, limitations, stock links, breadcrumb JSON-LD, and a path to the interactive compare view.
- Add server-rendered internal links from `/compare` and relevant stock pages.
- Add only curated pair URLs to the sitemap.

Acceptance:

- Curated pages build statically and emit self-canonical stable metadata without volatile prices or scores in title/description.
- Thin or arbitrary pair URLs are absent from sitemap and static generation.
- Comparison language says higher/lower, not universally better/worse.

### Slice D - Ownership verification readiness and operator runbook

- Add optional environment-driven Google and Naver ownership verification metadata.
- Add placeholder variable names to `.env.example`; never commit a real token.
- Document the exact owner-only sequence for Google Search Console and Naver Search Advisor: verify ownership, submit canonical sitemap, inspect representative URLs, and record the deployed commit marker.
- Do not open, mutate, or submit either outside service.

Acceptance:

- No token is required for local build.
- When a synthetic local value is supplied, the expected verification tag is emitted.
- The runbook clearly separates repository work from owner-only external actions.

### Slice E - SEO release gate

- Extend the finite local verifier to cover robots, sitemap, topic authority, retired theme behavior, curated comparisons, metadata, JSON-LD, noindex rules, internal links, and deployment-marker SHA matching.
- Reuse existing route and deployment-marker helpers instead of duplicating their logic.
- Add positive and negative fixtures so the gate demonstrably fails on stale SHA, duplicate canonical ownership, mock-backed indexing, arbitrary pair exposure, and volatile metadata.

Acceptance:

- One documented command can run the complete SEO release decision against a local production server.
- A stale or missing expected deployment SHA is a clear failure for publication verification, not a warning.

### Slice F - Full local SEO recertification

- Run a clean install, typecheck, production build, static SEO tests, full SEO release gate, public route checks, desktop smoke, and 390x844 mobile smoke.
- Prove login/auth blobs, Metrics/public-data Git objects, workflow control fields, and 138-stock output remain unchanged from this plan base.
- Write a concise SEO operator dossier with implemented URLs, checks, residual risks, rollback points, and exact owner-only publication/search-submission steps.
- Stop the batch when this evidence is complete. Do not add filler work.

Acceptance:

- Worktree clean after one local `[codex]` commit per slice.
- No pending local gate or unresolved failure.
- No push, deploy, runtime-value edit, or outside search-engine action has occurred.

## 5. Routing and budgets

Use model capacity selectively:

- High-consequence authority decisions and final adversarial recertification: Slices A, E, and F use the upper-tier Claude runner with 140 turns, 90 minutes, 2 retries, and a 15 USD cap.
- Focused implementation: Slices B, C, and D use the available Claude runner with 90 turns, 60 minutes, 1 retry, and a 10 USD cap.
- Planner and fallback remain off. Quality gates remain on.
- Do not attempt a global Codex CLI upgrade or AI Dev Center restart during this batch.

## 6. Completion and owner-only follow-up

Local completion does not mean public search submission is complete. After Slice F, the owner still controls:

1. Push the reviewed commits.
2. Deploy the exact reviewed commit.
3. Verify the public deployment marker equals that commit SHA.
4. Set ownership-verification values in the hosting environment if needed.
5. Verify ownership in Google Search Console and Naver Search Advisor.
6. Submit `https://ornscore.com/sitemap.xml` and inspect representative stock, topic, and comparison URLs.

No ranking promise is made. The batch creates a coherent, real-data, technically verifiable search surface.
