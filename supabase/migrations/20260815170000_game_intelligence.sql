create table if not exists public.generated_games (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  lottery text not null,
  selected_numbers jsonb not null,
  source text not null,
  strategy_id text,
  score_json jsonb not null,
  analysis_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source in ('smart_generator', 'strategy', 'closure', 'bolao', 'manual'))
);

create table if not exists public.notification_events (
  id text primary key,
  recipient_id text not null references public.users(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  deduplication_key text not null,
  created_at timestamptz not null default now(),
  unique (recipient_id, deduplication_key),
  check (
    event_type in (
      'resultado_atualizado',
      'premio_acumulado',
      'jogo_conferido',
      'jogo_premiado',
      'lembrete_de_concurso'
    )
  )
);

create table if not exists public.bolao_public_access (
  bolao_id text primary key references public.boloes(id) on delete cascade,
  share_code text not null unique,
  is_active boolean not null default true,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not is_active or revoked_at is null)
);

create index if not exists idx_generated_games_user_created
  on public.generated_games (user_id, created_at desc);
create index if not exists idx_generated_games_lottery_created
  on public.generated_games (lottery, created_at desc);
create index if not exists idx_notification_events_unread
  on public.notification_events (recipient_id, created_at desc)
  where read_at is null;
create index if not exists idx_bolao_public_access_active_code
  on public.bolao_public_access (share_code)
  where is_active and revoked_at is null;

create or replace function public.prevent_generated_game_snapshot_update()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.analysis_snapshot is distinct from old.analysis_snapshot then
    raise exception 'analysis_snapshot is immutable';
  end if;

  return new;
end;
$$;

drop trigger if exists generated_games_analysis_snapshot_immutable on public.generated_games;
create trigger generated_games_analysis_snapshot_immutable
  before update on public.generated_games
  for each row execute function public.prevent_generated_game_snapshot_update();

alter table public.generated_games enable row level security;
alter table public.notification_events enable row level security;
alter table public.bolao_public_access enable row level security;

drop policy if exists generated_games_owner_select on public.generated_games;
create policy generated_games_owner_select on public.generated_games
  for select to authenticated
  using ((select auth.uid())::text = user_id);

drop policy if exists generated_games_owner_insert on public.generated_games;
create policy generated_games_owner_insert on public.generated_games
  for insert to authenticated
  with check ((select auth.uid())::text = user_id);

drop policy if exists notification_events_recipient_select on public.notification_events;
create policy notification_events_recipient_select on public.notification_events
  for select to authenticated
  using ((select auth.uid())::text = recipient_id);

drop policy if exists notification_events_recipient_read on public.notification_events;
create policy notification_events_recipient_read on public.notification_events
  for update to authenticated
  using ((select auth.uid())::text = recipient_id)
  with check ((select auth.uid())::text = recipient_id);

revoke all on table public.notification_events from anon;
revoke insert, delete on table public.notification_events from authenticated;
revoke update on table public.notification_events from authenticated;
grant select, update (read_at) on table public.notification_events to authenticated;

create or replace function public.get_public_bolao(p_share_code text)
returns table (
  lottery text,
  title text,
  contest_num integer,
  total_cost numeric,
  cotas_total integer,
  cotas_taken integer,
  status text
)
language sql
security definer
set search_path = pg_catalog, public
as $$
  select
    b.lottery,
    b.title,
    b.contest_num,
    b.total_cost,
    b.cotas_total,
    b.cotas_taken,
    b.status
  from public.bolao_public_access as access
  join public.boloes as b on b.id = access.bolao_id
  where access.share_code = p_share_code
    and access.is_active
    and access.revoked_at is null
  limit 1;
$$;

revoke all on function public.get_public_bolao(text) from public;
grant execute on function public.get_public_bolao(text) to anon, authenticated;
