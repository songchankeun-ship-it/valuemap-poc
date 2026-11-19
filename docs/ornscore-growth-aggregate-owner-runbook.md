# Growth Sprint 5 A3 owner runbook

The daily aggregate path is shipped disabled. This packet is for a later
owner-approved activation. Keep deployment configuration and database secrets
on the server. The existing Vercel Analytics collection and account activity
dashboard keep their own sources.

## Enable

1. Review the public privacy disclosure and any consent requirements before
   activation. Verify that infrastructure access logs and APM for
   `/api/growth-aggregate` do not retain bodies, cookies, client IPs, raw
   referrers, or URLs with query strings. Disable request-level capture for
   this endpoint where necessary, including any database parameter logging.
2. Review [the SQL packet](sql/growth_aggregate.sql) in an owner-controlled
   staging database. Apply it in a transaction using the schema/table owner.
   The packet creates a private schema, a daily counter table, and two
   narrowly scoped functions. It is intentionally a one-time install and fails
   if the schema or grant role already exists.
3. Provision a dedicated PostgreSQL login. Grant it membership only in
   `ornscore_growth_runtime`, plus the database's required connection
   privileges. Verify effective grants, including anything inherited through
   `PUBLIC`. The login must not own the schema, have DDL or direct table
   access, have `BYPASSRLS`, or reach private stock or account tables. Verify
   that anonymous/authenticated API roles cannot execute either function.
   Keep the schema out of any exposed REST schema list. Configure a short
   statement timeout on the login, and a small Prisma pool with finite
   connection and pool timeouts for the dedicated DSN.
4. Set server-side `ORNSCORE_GROWTH_DATABASE_URL` to that login's PostgreSQL
   DSN using the database's TLS settings. Set `ORNSCORE_GROWTH_ORIGIN` to the
   exact canonical HTTPS origin without a trailing slash. Set
   `ORNSCORE_GROWTH_ENABLED=1` and deploy, including a fresh public build for
   prerendered pages. Other origins remain outside this deployment's collection
   scope. Missing configuration leaves the bridge inactive and the admin view
   in `not_configured`.
5. In staging, start with an empty store. Confirm the admin page shows empty
   for both windows. Follow a public `?ref=threads` link, open a stock detail,
   then start a comparison and save a stock. Verify the request carries only
   the three enum fields and no cookie or referrer. Verify one increment per
   accepted POST and the expected campaign counts in both windows. Verify
   admin navigation records no public event and a denied database read shows
   an error state. Avoid generating artificial production traffic.

## Read and retain

- Periods are the most recent 7 and 30 KST calendar dates including today's
  partial day. Counts begin at activation and can cover part of a window.
  Review the figures on days 14 and 30 alongside the activation date.
- Keep 30 KST calendar dates. Have the owner perform the following maintenance
  daily using the schema-owner role and record completion. The application
  login has no deletion permission. This packet installs no scheduled job.

  ```sql
  delete from growth_aggregate.daily
  where day < (current_timestamp at time zone 'Asia/Seoul')::date - 29;
  ```

- Set backup expiration to the approved retention policy and verify pruning.
  A successful empty read and a read failure have distinct states. Watch for
  outages and implausible spikes. Browser-origin validation blocks cross-site
  browser submissions, but the public event endpoint cannot authenticate
  events as human activity. If needed, suspend collection.

## Disable and roll back

1. Remove `ORNSCORE_GROWTH_ENABLED` (or set it to `0`) and deploy a fresh
   build. The endpoint returns 503 without writing, including for stale
   clients. The operator view reports `not_configured`.
2. For an immediate database-side stop, revoke the dedicated login's
   `ornscore_growth_runtime` membership and terminate any sessions for that
   login. Rotate or remove the credential and clear the growth-only settings.
3. Retain or purge existing aggregates under the approved retention decision.
   To uninstall, confirm the dedicated objects in staging first. As their
   owner, drop the two functions, the daily table, and then the private
   schema. Remove the dedicated grant role and login after checking their
   dependencies. These actions require a separate owner decision.
