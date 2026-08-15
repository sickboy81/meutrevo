alter table public.game_plans
  add column if not exists objective text not null default 'balance';

alter table public.game_plans
  drop constraint if exists game_plans_objective_check;

alter table public.game_plans
  add constraint game_plans_objective_check
  check (objective in ('economy', 'coverage', 'balance', 'conference'));
