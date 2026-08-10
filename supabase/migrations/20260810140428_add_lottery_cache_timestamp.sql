alter table public.lottery_cache
  add column if not exists cached_at timestamptz not null default now();
