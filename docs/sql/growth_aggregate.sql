begin;

-- Owner packet only. Apply with a schema owner, using a fresh schema and role.
create role ornscore_growth_runtime nologin;
create schema growth_aggregate;
revoke all on schema growth_aggregate from public;
grant usage on schema growth_aggregate to ornscore_growth_runtime;

create table growth_aggregate.daily (
  day date not null,
  event text not null check (event in (
    'route_view_public', 'home_candidate_open', 'search_result_open', 'topic_stock_open',
    'compare_toggle', 'topic_compare_start', 'compare_curated_interactive_open',
    'watchlist_toggle', 'auth_cta_click', 'stock_recent_compare_open',
    'watchlist_routine_complete', 'stock_share', 'compare_share'
  )),
  campaign text not null check (campaign in (
    'disquiet', 'geeknews', 'naver-blog', 'threads', 'linkedin', 'kakao',
    'community', 'share', 'direct', 'unattributed'
  )),
  route_kind text not null check (
    (event = 'route_view_public' and route_kind in (
      'home', 'stocks', 'stock_detail', 'topic', 'compare_pair', 'compare',
      'watchlist', 'today', 'disclosures', 'backtest', 'metrics_guide',
      'login', 'pricing', 'beta', 'about', 'status', 'other_public'
    )) or (event <> 'route_view_public' and route_kind = 'none')
  ),
  hits bigint not null check (hits between 1 and 9007199254740991),
  primary key (day, event, campaign, route_kind)
);
alter table growth_aggregate.daily enable row level security;
revoke all on growth_aggregate.daily from public, ornscore_growth_runtime;

create function growth_aggregate.increment(p_day date, p_event text, p_campaign text, p_route_kind text)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  today date := (statement_timestamp() at time zone 'Asia/Seoul')::date;
begin
  -- Accept a previous-day request still in flight at midnight.
  if p_day is null or p_day not between today - 1 and today then
    raise exception 'Invalid aggregate day';
  end if;
  insert into growth_aggregate.daily as counters (day, event, campaign, route_kind, hits)
    values (p_day, p_event, p_campaign, p_route_kind, 1)
    on conflict (day, event, campaign, route_kind)
    do update set hits = counters.hits + 1;
  return true;
end;
$function$;

create function growth_aggregate.read_days(p_from date, p_through date)
returns table (day text, event text, campaign text, "routeKind" text, count double precision)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  today date := (statement_timestamp() at time zone 'Asia/Seoul')::date;
begin
  if p_from is null or p_through is null or p_through not between today - 1 and today
    or p_from not between p_through - 29 and p_through then
    raise exception 'Invalid aggregate window';
  end if;
  return query
    select to_char(d.day, 'YYYY-MM-DD'), d.event, d.campaign, d.route_kind, d.hits::double precision
    from growth_aggregate.daily as d
    where d.day between p_from and p_through;
end;
$function$;

revoke all on function growth_aggregate.increment(date, text, text, text) from public;
revoke all on function growth_aggregate.read_days(date, date) from public;
grant execute on function growth_aggregate.increment(date, text, text, text) to ornscore_growth_runtime;
grant execute on function growth_aggregate.read_days(date, date) to ornscore_growth_runtime;

commit;
