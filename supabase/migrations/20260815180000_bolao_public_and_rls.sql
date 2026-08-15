-- Keep every newly created bolao shareable through the dedicated public-access table.
insert into public.bolao_public_access (bolao_id, share_code)
select b.id, lower(trim(b.share_code))
from public.boloes b
where b.share_code is not null
  and trim(b.share_code) <> ''
  and not exists (
    select 1 from public.bolao_public_access access
    where access.bolao_id = b.id
  )
on conflict (share_code) do nothing;

-- Public data is read-only. Writes remain server-side.
drop policy if exists app_config_public_select on public.app_config;
create policy app_config_public_select on public.app_config
  for select to anon, authenticated using (true);

drop policy if exists lottery_cache_public_select on public.lottery_cache;
create policy lottery_cache_public_select on public.lottery_cache
  for select to anon, authenticated using (true);

-- User-owned records are never directly readable or writable by another user.
drop policy if exists saved_games_owner_access on public.saved_games;
create policy saved_games_owner_access on public.saved_games
  for all to authenticated
  using ((select auth.uid())::text = user_id)
  with check ((select auth.uid())::text = user_id);

drop policy if exists saved_simulations_owner_access on public.saved_simulations;
create policy saved_simulations_owner_access on public.saved_simulations
  for all to authenticated
  using ((select auth.uid())::text = user_id)
  with check ((select auth.uid())::text = user_id);

drop policy if exists bets_owner_access on public.bets;
create policy bets_owner_access on public.bets
  for all to authenticated
  using ((select auth.uid())::text = user_id)
  with check ((select auth.uid())::text = user_id);

drop policy if exists rankings_owner_write on public.rankings;
create policy rankings_owner_write on public.rankings
  for insert to authenticated
  with check ((select auth.uid())::text = user_id);

drop policy if exists push_subscriptions_owner_access on public.push_subscriptions;
create policy push_subscriptions_owner_access on public.push_subscriptions
  for all to authenticated
  using ((select auth.uid())::text = user_id)
  with check ((select auth.uid())::text = user_id);
