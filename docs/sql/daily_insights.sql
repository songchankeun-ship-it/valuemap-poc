-- 오늘의 브리핑(AI 테마 요약) 영속화 테이블
-- Supabase Dashboard → SQL Editor 에 붙여넣고 Run.
-- cron(daily-insight)이 service_role로 upsert, 화면은 익명키로 read.

create table if not exists public.daily_insights (
  date_kst    date primary key,
  insight     jsonb not null,
  source      text,
  model       text,
  created_at  timestamptz default now()
);

alter table public.daily_insights enable row level security;

-- 공개 읽기 허용(익명 키). 쓰기는 service_role(cron)이 RLS 우회.
drop policy if exists "public read daily_insights" on public.daily_insights;
create policy "public read daily_insights"
  on public.daily_insights
  for select
  using (true);
