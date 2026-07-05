# OrnScore OAuth Preflight Checklist

Purpose: reduce OAuth **release risk** that can be settled **inside this repo**, and draw
a hard line around the part that can only be settled by the **owner** in a real
browser against real provider/Supabase consoles. Nothing here submits a real login,
enters account details, or touches an outside account console.

The auth surface audited: `src/app/login/page.tsx`, `src/app/login/LoginContent.tsx`,
`src/lib/auth/providers.ts`, `src/lib/auth/returnPath.ts`,
`src/app/auth/callback/route.ts`, and `loginCopy` in `src/lib/i18n.ts`.

---

## A. Repo-local checks (automatable, no provider round-trip)

These hold in the **server-rendered HTML** because `/login` is a **Dynamic**
route (`ƒ` in `next build`): `useSearchParams()` resolves server-side, so the full
form — not the Suspense skeleton — is in the initial HTML. That is what makes them
gate-able by a plain `fetch` with **no headless browser and no new dependency**.

Automated by `scripts/verify-login-preflight.mjs` (`npm run verify:login-preflight`).
It fetches five `/login` states against an already-running server and asserts:

| # | Check | Where it comes from |
|---|-------|---------------------|
| A1 | HTTP 200 on every `/login` state | route renders |
| A2 | No critical runtime markers (`Application error`, `Hydration failed`, …) | shared with `smoke:check` / `verify:routes` |
| A3 | Enabled provider buttons render: `카카오로 시작하기`, `구글로 시작하기` | `enabledOAuthProviders()` → i18n `providers[id].label` |
| A4 | Planned-provider marker renders: `설정 필요` (Naver, no fake success path) | `plannedProviders()` + `PLANNED_PROVIDERS` |
| A5 | Previous-page context copy per `next`: `/watchlist` → “관심 종목을 여러 기기에서…”, `/compare` → “비교 목록을 저장하려면…” | `loginCopy.contexts` |
| A6 | Generic `contextFallback` for internal paths with no mapped context (e.g. `/stock/005930`) | `loginCopy.contextFallback` |
| A7 | Root-origin (`next=/`) shows `홈으로`; internal-origin shows `이전 페이지로` | `next === "/" ? backHome : backPrevious` |
| A8 | Friendly Korean error for `?error=auth_callback_no_code`: “앱에서 로그인 후 돌아오지 못했어요” | `friendlyAuthError()` → `loginCopy.errors.noCode` |
| A9 | **No raw provider error leaks** (`provider is not enabled`, `unsupported provider`, `validation_failed`, `provider_disabled`) | `friendlyAuthError()` translation |
| A10 | `lang="ko"` present, and no KO/EN toggle (`hreflang`, `lang="en"`, `LanguageSwitcher`) | Korean-only public v1 |

Run it:

```bash
npm run build
npx next start -p 4463            # dedicated high port — NOT 3000, NOT AI Center 4310
npm run verify:login-preflight -- --base http://localhost:4463
```

Prove the gate can actually FAIL (assertions have teeth) — point it at a page that
is not the login form (on Git Bash prefix `MSYS_NO_PATHCONV=1` so the leading slash
is not path-mangled):

```bash
MSYS_NO_PATHCONV=1 node scripts/verify-login-preflight.mjs --base http://localhost:4463 --login-path /about
# → HTTP 200 but every content assertion FAILs → exits 1
```

Privacy: the script prints **no private values** — only route path, HTTP status,
OK/FAIL, and generic reason strings. It never reads env secrets and never echoes
HTML bodies.

### Static (source) invariants confirmed by the audit — no drift found
- **Provider single source of truth.** Buttons/legal copy derive from
  `OAUTH_PROVIDERS` / `PLANNED_PROVIDERS`; there are no copy-pasted per-provider
  handlers. Enabled in local env = Kakao + Google; Apple is intentionally
  `enabled:false`; Naver is `custom:naver`, gated by `NEXT_PUBLIC_ENABLE_NAVER_LOGIN`.
- **No label drift.** The UI reads i18n `loginCopy.providers[id]` for labels; every
  enabled/planned id (`kakao`, `google`, `custom:naver`, `apple`) has a matching i18n
  entry **and** an inline brand SVG in `LoginContent.tsx`.
- **`next` normalization is shared.** Both the login form and `auth/callback/route.ts`
  route `next` through `safeInternalPath()` (open-redirect guard: rejects `://`,
  `//`, backslash tricks, control chars; length-capped; preserves internal query/hash).
- **Callback contract.** On success `/auth/callback` redirects to the validated `next`
  with `welcome=1`; missing `code` → `auth_callback_no_code`; exchange failure →
  `auth_callback_failed` — both surface as friendly Korean copy, never raw text.

---

## B. Owner gate (manual, real browser + real consoles) — CANNOT be automated here

The OAuth **round-trip** stays an owner responsibility. A `fetch` gate proves the UI
contract; it can not (and must not) click a provider's final submit, deliver an
email, or exchange a real `code`. The owner must do these once against the real
Supabase project and provider consoles:

- **B1. Kakao round-trip** — click `카카오로 시작하기`, complete Kakao consent, confirm
  return to `next` with a signed-in session and `welcome=1` toast.
- **B2. Google round-trip** — same, via `구글로 시작하기` (requires the Supabase Google
  provider toggle + Google Cloud OAuth client).
- **B3. Naver round-trip** — only after Supabase Custom OAuth provider `custom:naver`
  + Naver Developers app are configured **and** `NEXT_PUBLIC_ENABLE_NAVER_LOGIN=true`.
  With the flag off, confirm Naver stays the disabled `설정 필요` item (no auth call).
- **B4. Magic-link email** — submit a real email, confirm the sign-in link is
  delivered (check spam), and that clicking it lands on `next` signed in.
- **B5. Callback return-to-`next`** — after B1/B2/B4, confirm `/auth/callback` returns
  to the exact `next` (e.g. `/watchlist`) with `welcome=1`, and that a tampered/expired
  `code` degrades to the friendly `auth_callback_failed` copy.
- **B6. Error-from-disabled provider** — before a console toggle is on, clicking that
  provider should show the friendly `설정 중` copy, never a raw provider error. (A9
  covers the *rendered* form; B6 covers the *live* Supabase error message.)

Client-only note: the states in section A render in SSR HTML (Dynamic route), so the
`fetch` gate can see them. The **interactive** transitions after a click —
`oauth_redirecting` spinner, `sending`/`sent` magic-link states, and any live
Supabase error — are produced only after hydration and JS, so they require an owner
browser pass (B1–B6). They are not something this repo can assert.

---

## C. Do-not list (kept true this task)

- No provider final submit, no account details entered, no accounts created.
- No changes to Supabase/Vercel/provider consoles or any secret/env value.
- No scores/data/`direction`/auth-flow changes; public framing stays free Korean
  beta v1 (no buy/sell/recommendation/return-guarantee copy).
