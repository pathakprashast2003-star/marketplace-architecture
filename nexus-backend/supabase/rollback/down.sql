-- Rolls back migrations 0001-0004. DESTROYS ALL NEXUS DATA. Take a backup first.
begin;
drop policy if exists media_public_read on storage.objects;
drop policy if exists media_owner_read on storage.objects;
drop policy if exists media_owner_insert on storage.objects;
drop policy if exists media_owner_delete on storage.objects;
drop trigger if exists on_auth_user_created on auth.users;
drop table if exists public.admin_log, public.rate_limits, public.email_suppressions, public.email_outbox,
  public.stripe_events, public.creator_rank, public.reviews, public.reports, public.blocks, public.messages,
  public.inquiries, public.saves, public.waitlist_leads, public.media, public.services, public.creator_claims,
  public.founding_counter, public.used_card_fingerprints, public.creator_billing, public.creators, public.categories, public.user_roles,
  public.profiles, public.app_settings cascade;
do $$
declare r record;
begin
  for r in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.prokind = 'f'
              and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e') loop
    execute 'drop function if exists ' || r.sig || ' cascade';
  end loop;
end $$;
drop type if exists public.creator_status, public.user_role, public.age_gate;
commit;
