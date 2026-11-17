# ORNScore Growth Sprint 3 - 2026-11-17

## Decision

Sprint 3 answers the next growth question: not merely which channel sends a
visit, but which allow-listed campaign leads to a useful product action in the
same browser tab.

The implemented loop is:

`allow-listed ref -> route entry -> compare/save/return/share -> campaign outcome read`

This is a measurement and learning sprint. It does not open a new channel,
auto-publish content, create a tracking identity, or change the public stock
dataset.

## Attribution Contract

- Only the nine fixed campaign enums already accepted by `route_view_public`
  can be remembered.
- The value is stored in `sessionStorage` under a versioned key and therefore
  ends with the tab session.
- A new valid `ref` becomes the latest same-tab campaign. Unknown values are
  ignored and are never stored.
- Every later `trackEvent` receives that fixed campaign unless the event already
  carries an explicit valid campaign.
- No URL, referrer, raw search, email, name, note, account id, random id, or
  free-form value is stored or transmitted by this feature.

## Owner Read

The typed traffic summary now includes a complete campaign-by-outcome matrix:

| Campaign | Compare | Save | Return | Share |
| --- | ---: | ---: | ---: | ---: |
| Fixed `ref` enum | Event count | Event count | Event count | Event count |

The table contains event counts, not people or unique users. Zero is displayed
only when a configured provider returns a verified zero. Production still uses
the explicit `not_configured` state until the owner supplies a vendor API token,
server-route approval, and retention decision.

## Decision Rules

After a real provider is connected and a sufficient window is available:

1. Keep a campaign if it produces downstream compare or save actions, even if
   its raw visit count is smaller.
2. Rewrite the landing promise if entries are present but all four outcomes stay
   near zero.
3. Do not add another channel until at least one current channel has a measurable
   entry-to-action path.
4. Treat return as a repeat-routine signal, not proof of investment intent.

## Frozen Boundaries

Public data, Metrics 2.4, the 138-stock universe, formulas, auth, workflows,
packages, provider/runtime settings, hosting, and outside accounts remain
unchanged. No external analytics API or account setting is modified.

## Verification

- `npm run test:growth-sprint-3`
- `npm run verify:admin-traffic-metrics`
- `npm run verify:admin-traffic-view`
- `npm run verify:route-analytics`
- `npm run verify:click-analytics`
- `npx tsc --noEmit`
- Next production build: 194/194 pages
- Release preflight: 19/19
- Local route health: 6/6
- Dynamic OG live gate: 3/3
