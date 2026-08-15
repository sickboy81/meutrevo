create table if not exists public.game_plans (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  title text not null,
  lottery text not null,
  budget numeric(12,2) not null default 0,
  contests_count integer not null default 1,
  strategy text not null default 'balanced',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (budget >= 0),
  check (contests_count between 1 and 100),
  check (status in ('active', 'paused', 'completed', 'cancelled'))
);

create table if not exists public.plan_games (
  id text primary key,
  plan_id text not null references public.game_plans(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  saved_game_id text references public.saved_games(id) on delete set null,
  lottery text not null,
  numbers text not null,
  contest_start integer,
  contest_end integer,
  cost numeric(12,2) not null default 0,
  source text not null default 'generator',
  created_at timestamptz not null default now()
);

create table if not exists public.game_schedules (
  id text primary key,
  plan_game_id text not null references public.plan_games(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  lottery text not null,
  contest_num integer not null,
  status text not null default 'pending',
  hits integer,
  prize_won numeric(12,2),
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (plan_game_id, contest_num),
  check (status in ('pending', 'checked', 'winner', 'cancelled'))
);

create table if not exists public.notification_preferences (
  user_id text primary key references public.users(id) on delete cascade,
  lottery_ids jsonb not null default '[]'::jsonb,
  result_available boolean not null default true,
  game_checked boolean not null default true,
  prize_found boolean not null default true,
  schedule_reminder boolean not null default false,
  email_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists idx_game_plans_user_created
  on public.game_plans (user_id, created_at desc);
create index if not exists idx_plan_games_plan
  on public.plan_games (plan_id, created_at);
create index if not exists idx_game_schedules_contest
  on public.game_schedules (lottery, contest_num, status);

alter table public.game_plans enable row level security;
alter table public.plan_games enable row level security;
alter table public.game_schedules enable row level security;
alter table public.notification_preferences enable row level security;

drop policy if exists game_plans_owner_select on public.game_plans;
create policy game_plans_owner_select on public.game_plans
  for select to authenticated using ((select auth.uid())::text = user_id);
drop policy if exists game_plans_owner_write on public.game_plans;
create policy game_plans_owner_write on public.game_plans
  for all to authenticated
  using ((select auth.uid())::text = user_id)
  with check ((select auth.uid())::text = user_id);

drop policy if exists plan_games_owner_access on public.plan_games;
create policy plan_games_owner_access on public.plan_games
  for all to authenticated
  using ((select auth.uid())::text = user_id)
  with check ((select auth.uid())::text = user_id);

drop policy if exists game_schedules_owner_access on public.game_schedules;
create policy game_schedules_owner_access on public.game_schedules
  for all to authenticated
  using ((select auth.uid())::text = user_id)
  with check ((select auth.uid())::text = user_id);

drop policy if exists notification_preferences_owner_access on public.notification_preferences;
create policy notification_preferences_owner_access on public.notification_preferences
  for all to authenticated
  using ((select auth.uid())::text = user_id)
  with check ((select auth.uid())::text = user_id);
