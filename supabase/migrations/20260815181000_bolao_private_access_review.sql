-- Bolao data is private to its creator and participants.
drop policy if exists boloes_creator_access on public.boloes;
create policy boloes_creator_access on public.boloes
  for all to authenticated
  using ((select auth.uid())::text = creator_id)
  with check ((select auth.uid())::text = creator_id);

drop policy if exists bolao_participants_member_select on public.bolao_participants;
create policy bolao_participants_member_select on public.bolao_participants
  for select to authenticated
  using (
    (select auth.uid())::text = user_id
    or exists (
      select 1 from public.boloes b
      where b.id = bolao_id
        and b.creator_id = (select auth.uid())::text
    )
  );

drop policy if exists bolao_participants_member_insert on public.bolao_participants;
create policy bolao_participants_member_insert on public.bolao_participants
  for insert to authenticated
  with check ((select auth.uid())::text = user_id);

-- Public summaries are served by the application route, not by RPC.
revoke all on function public.get_public_bolao(text) from anon, authenticated;
