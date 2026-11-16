# ORNScore daily schedule reliability amendment (2026-11-16)

## Decision

Move the weekday daily-data cron from `0 8 * * 1-5` to `17 8 * * 1-5`.
This changes the target from 17:00 KST to 17:17 KST while keeping the run after
the 15:30 KST market close and before the 19:00 KST freshness deadline.

## Production evidence

- Production served 138 stocks on public Metrics 2.4 for business date
  `20261113` at the time of review.
- Recent successful scheduled runs were commonly starting between roughly
  21:40 and 02:50 KST despite the 17:00 KST target.
- The 2026-11-16 run was not visible by approximately 22:45 KST.
- Vercel was serving the latest published commit correctly. The observed gap
  was therefore scheduling latency before generation, not a hosting outage.

GitHub scheduled workflows are still best-effort. Moving away from minute zero
reduces a known congestion risk but does not guarantee an exact start time.
The existing finite health check remains the detection and alerting layer.

## Frozen boundaries

This amendment does not change:

- data sources, formulas, generation commands, or the 138-stock universe;
- public Metrics 2.4 or any public data file;
- workflow permissions, concurrency, bot identity, or push semantics;
- authentication, Supabase, packages, Next/React, SEO, DNS, or Vercel settings.

## Verification contract

The workflow source gate, negative-fixture self-test, and continuity baseline
all treat `17 8 * * 1-5` as the exact schedule. Any later schedule drift must
fail closed until it is separately authorized and recertified.

## Rollback

Restore `0 8 * * 1-5` in the workflow, workflow gate, self-test fixture, and
continuity baseline/verifier together. Run the same focused gates before any
rollback is synchronized.
