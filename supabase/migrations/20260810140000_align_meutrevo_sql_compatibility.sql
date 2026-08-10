alter table public.users
  alter column blocked drop default,
  alter column show_in_ranking drop default;

alter table public.users
  alter column blocked type integer using case when blocked then 1 else 0 end,
  alter column show_in_ranking type integer using case when show_in_ranking then 1 else 0 end;

alter table public.users
  alter column blocked set default 0,
  alter column show_in_ranking set default 1;

alter table public.users
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_subscription_status text;

alter table public.boloes
  alter column prize_distributed drop default;

alter table public.boloes
  alter column prize_distributed type integer using case when prize_distributed then 1 else 0 end;

alter table public.boloes
  alter column prize_distributed set default 0;

alter table public.bolao_participants
  alter column paid drop default;

alter table public.bolao_participants
  alter column paid type integer using case when paid then 1 else 0 end;

alter table public.bolao_participants
  alter column paid set default 0;

alter table public.lottery_cache
  alter column data_json type text using data_json::text;

alter table public.boloes
  alter column games_json type text using games_json::text;
