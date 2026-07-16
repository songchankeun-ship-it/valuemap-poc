# OrnScore Operator Acceptance Runbook

_Analytics Ops Slice W — operator acceptance of the administrator surfaces._

The single reproducible procedure for accepting the four owner-only admin
surfaces (`/admin`, `/admin/status`, `/admin/traffic`, `/admin/users`) before an
owner-approved release. It has two halves:

1. **Automated, signed-out** — one command, repo-local + loopback only. Proves the
   properties that must hold for _any_ visitor with no session.
2. **Owner-performed, signed-in** — a short manual matrix that needs a real
   Supabase session + service-role env, so it can never be scripted here.

**Privacy contract:** every check below sends no cookies and prints no private
value. The automated verifier emits only gate names, exit codes, HTTP status /
redirect target, and generic reasons. Every example in this runbook is
**synthetic** — no real email, row, token, or error text appears in any artifact.

---

## 1. Automated signed-out acceptance (`verify:operator-acceptance`)

One command aggregates the operator gates and maps each to the acceptance
criterion it proves. It **never starts or stops a server** (the AI Center
listener on `:4310` stays untouched) and follows the same two-phase shape as
`release:preflight`.

### The five signed-out criteria

| # | Acceptance criterion | Proven by | Phase |
|---|----------------------|-----------|-------|
| A | Admin routes redirect correctly (logged-out `/admin*` → `/login?next=…`) | `verify:admin-policy` (offline contract) + `verify:admin-access` (live) | offline + live |
| B | Protected markers do not leak (no admin-only heading in a logged-out body) | `verify:admin-access` | live |
| C | Public routes remain healthy (public surface still 200s with its content anchors, no error marker) | `verify:routes` | live |
| D | Analytics contracts are consistent | `verify:route-analytics`, `verify:click-analytics`, `verify:admin-traffic-metrics`, `verify:admin-traffic-view` | offline |
| E | Diagnostic states have test coverage (five admin resource states stay distinct, labeled, secret-free) | `verify:admin-resource-state` | offline |

### Run it (two phases, one command each)

```bash
# Phase 1 — offline acceptance contracts (criteria A-offline, D, E). No server:
npm run verify:operator-acceptance

# Phase 2 — start a prod server from a fresh build on a dedicated high port
# (NOT 3000 / NOT 4310), then re-run WITH --base to add the live half (A-live, B, C):
npm run build
npx next start -p 4479
npm run verify:operator-acceptance -- --base http://127.0.0.1:4479
# When green, stop ONLY that listener you started.
```

Exit code is `1` if any acceptance gate that ran failed, else `0`. Without
`--base` the offline run still exits `0` on green but prints a `LIVE ROUTE HALF:
NOT RUN` next-step block, so a half-acceptance is never mistaken for a full one.

**Where this lives in the release flow:** the offline half (criteria A-offline,
D, E) is exactly gates 3–8 of `npm run release:preflight`. Full preflight runs
them inline as part of branch re-cert; `verify:operator-acceptance` is the
operator-scoped view of the same gates plus this runbook — use it when you only
need to accept the admin surfaces, not re-certify the whole branch.

---

## 2. Owner-performed signed-in review matrix (OWNER GATE — not automatable here)

The automated half proves only the anonymous contract. The **authorized** side —
an allow-listed operator actually sees the dashboards, a logged-in non-admin is
refused, and each panel renders its true ready state over live data — needs a
real session and service-role env. The owner performs these five checks by hand
in a browser and records pass/fail. **Use synthetic accounts and never paste any
real value into notes, screenshots, or artifacts.**

| # | Review | Setup (synthetic) | Expected result | FAIL looks like |
|---|--------|-------------------|-----------------|-----------------|
| 1 | **Allowed operator** | Sign in with an allow-listed admin email (e.g. `owner@example.test`) | `/admin` home + all four dashboards render; state badges visible | Redirect loop, 403, or blank/error page for an allow-listed email |
| 2 | **Denied signed-in user** | Sign in with a logged-in but NON-allow-listed email (e.g. `visitor@example.test`) | Any `/admin*` returns **403 Forbidden** (noindex/no-store) | A login redirect loop, or any admin content rendering to a non-admin |
| 3 | **Users data readiness** | As the allowed operator, open `/admin/users` | Auth-list, `waitlist`, and the five usage cards each show an honest state badge (healthy / configured-empty / disabled / unavailable / read-failure); **no email or row body shown** | A real outage rendering as a quiet empty state, or any PII/row leaking on screen |
| 4 | **Traffic readiness** | As the allowed operator, open `/admin/traffic` | Numeric dashboard shell renders; provider state reads `ready` (with derived totals/funnel) or `not_configured` — never a fabricated number | A `not_configured` provider showing invented counts, or a divide-by-zero rendering as `0` |
| 5 | **Report readiness** | As the allowed operator, open `/admin/status` report panel | Report resource reflects its true diagnostic state (disabled vs configured-empty vs read-failure are distinguishable) | A disabled feature or failed read masquerading as a look-alike empty panel |

### Recording results

Record only: review # (1–5), PASS/FAIL, and a generic note (e.g. "403 as
expected", "waitlist showed configured-empty"). Do **not** record emails, row
contents, tokens, or raw error text. Acceptance is complete when the automated
half is green **and** all five signed-in reviews pass.

---

## 3. Quick reference

```bash
# offline acceptance only (fast, no server):
npm run verify:operator-acceptance

# full acceptance (offline + live route half):
npm run build && npx next start -p 4479
npm run verify:operator-acceptance -- --base http://127.0.0.1:4479

# the same offline gates as part of full branch re-cert:
npm run release:preflight
```

Related: `docs/ornscore-admin-operations-checklist.md`,
`docs/ornscore-route-smoke-checklist.md`, `scripts/verify-operator-acceptance.mjs`.
