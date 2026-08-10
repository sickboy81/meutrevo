create table if not exists public.users (
  id text primary key,
  email text not null unique,
  name text not null,
  password text not null,
  cpf_cnpj text not null,
  city text,
  state text,
  avatar text default 'user',
  favorite_lottery text,
  role text not null default 'free',
  blocked boolean not null default false,
  premium_until timestamptz,
  reset_token text,
  reset_token_expires timestamptz,
  show_in_ranking boolean not null default true,
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_games (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  lottery text not null,
  numbers text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_simulations (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  lottery text not null,
  numbers text not null,
  max_hits integer not null,
  hits_count text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.bets (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  lottery text not null,
  numbers text not null,
  contest_num integer not null,
  cost numeric(12,2) not null,
  prize_won numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.app_config (
  key text primary key,
  value text not null
);

insert into public.app_config (key, value) values
  ('price_monthly', '14.90'),
  ('price_annual', '129.90')
on conflict (key) do nothing;

create table if not exists public.lottery_cache (
  lottery text not null,
  contest_num integer not null,
  draw_date date not null,
  data_json jsonb not null,
  created_at timestamptz not null default now(),
  primary key (lottery, contest_num)
);

create table if not exists public.boloes (
  id text primary key,
  creator_id text not null references public.users(id) on delete cascade,
  lottery text not null,
  title text not null,
  games_json jsonb not null,
  total_cost numeric(12,2) not null default 0,
  cotas_total integer not null default 1,
  cotas_taken integer not null default 0,
  taxa_pct numeric(5,2) not null default 0,
  status text not null default 'active',
  contest_num integer,
  prize_won numeric(12,2) not null default 0,
  prize_distributed boolean not null default false,
  share_code text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bolao_participants (
  id text primary key,
  bolao_id text not null references public.boloes(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  cota_num integer not null,
  name text not null,
  paid boolean not null default false,
  amount_due numeric(12,2) not null default 0,
  amount_received numeric(12,2) not null default 0,
  joined_at timestamptz not null default now(),
  unique (bolao_id, user_id),
  unique (bolao_id, cota_num)
);

create table if not exists public.rankings (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  lottery text not null,
  contest_num integer not null,
  numbers_played text not null,
  hits integer not null default 0,
  prize_won numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id text primary key,
  user_id text references public.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text,
  auth text,
  created_at timestamptz not null default now()
);

create table if not exists public.rate_limits (
  key text primary key,
  count integer not null default 1,
  reset_at bigint not null
);

create index if not exists idx_lottery_cache_lottery_contest on public.lottery_cache (lottery, contest_num desc);
create index if not exists idx_saved_games_user_created on public.saved_games (user_id, created_at desc);
create index if not exists idx_bets_user_created on public.bets (user_id, created_at desc);
create index if not exists idx_rankings_user_lottery on public.rankings (user_id, lottery);
create index if not exists idx_rate_limits_reset_at on public.rate_limits (reset_at);

alter table public.users enable row level security;
alter table public.saved_games enable row level security;
alter table public.saved_simulations enable row level security;
alter table public.bets enable row level security;
alter table public.app_config enable row level security;
alter table public.lottery_cache enable row level security;
alter table public.boloes enable row level security;
alter table public.bolao_participants enable row level security;
alter table public.rankings enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.rate_limits enable row level security;
