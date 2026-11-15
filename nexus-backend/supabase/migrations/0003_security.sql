-- Nexus backend: row-level security on every table, and exact grants.
-- Clients can only read. Tables with no policy below are server-only.
begin;

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated, public', t);
  end loop;
end $$;

-- Everyone: the category list.
grant select on public.categories to anon, authenticated;
create policy categories_read on public.categories for select to anon, authenticated using (true);

-- Own profile and role.
grant select (id, display_name, age_gate, created_at) on public.profiles to authenticated;
create policy profiles_own on public.profiles for select to authenticated using (id = (select auth.uid()));

grant select on public.user_roles to authenticated;
create policy roles_own on public.user_roles for select to authenticated using (user_id = (select auth.uid()));

-- A creator reads their own row (internal review fields are not granted at all).
grant select (id, user_id, slug, status, hidden_reason, canceled_reason, display_name, headline, about,
  category_slug, city, region, country, works_remote, starting_price_cents, price_on_request,
  portfolio_url, website_url, instagram_url, avatar_path, cover_path, founding_number, approved_at,
  reject_reason, needs_review, referral_code, created_at, updated_at)
  on public.creators to authenticated;
create policy creators_own on public.creators for select to authenticated using (user_id = (select auth.uid()));

grant select (creator_id, trial_days, trial_ends_at, approval_expires_at, stripe_status,
  cancel_at_period_end, past_due_since, contact_email, contact_phone)
  on public.creator_billing to authenticated;
create policy billing_own on public.creator_billing for select to authenticated
  using (public.owns_creator(creator_id));

-- Profile content: the owner always; signed-in users when the creator is publicly visible.
grant select on public.services, public.creator_claims to authenticated;
create policy services_read on public.services for select to authenticated
  using (public.owns_creator(creator_id) or public.is_creator_visible(creator_id));
create policy claims_read on public.creator_claims for select to authenticated
  using (public.owns_creator(creator_id) or public.is_creator_visible(creator_id));

grant select on public.media to authenticated;
create policy media_read on public.media for select to authenticated
  using (public.owns_creator(creator_id) or (status = 'approved' and public.is_creator_visible(creator_id)));

grant select on public.saves to authenticated;
create policy saves_own on public.saves for select to authenticated using (user_id = (select auth.uid()));

-- Inquiries and messages: only the two people in the conversation.
grant select (id, creator_id, client_user_id, client_name, event_date, date_flexible, budget, phone,
  people_count, status, first_reply_at, created_at) on public.inquiries to authenticated;
create policy inquiries_participants on public.inquiries for select to authenticated
  using (client_user_id = (select auth.uid()) or public.owns_creator(creator_id));

grant select on public.messages to authenticated;
create policy messages_participants on public.messages for select to authenticated
  using (public.is_inquiry_participant(inquiry_id));

grant select on public.blocks to authenticated;
create policy blocks_own on public.blocks for select to authenticated using (public.owns_creator(creator_id));

grant select (id, target_type, target_id, reason, status, created_at) on public.reports to authenticated;
create policy reports_own on public.reports for select to authenticated
  using (reporter_user_id = (select auth.uid()));

grant select (id, creator_id, rating, body, status, created_at)
  on public.reviews to authenticated;
create policy reviews_read on public.reviews for select to authenticated
  using (status = 'published' or author_user_id = (select auth.uid()) or public.owns_creator(creator_id));

-- Functions: nothing is callable by clients except the three public reads and the policy helpers.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.search_creators(text, text, text, boolean, int, int, int, int) to anon, authenticated;
grant execute on function public.creator_public(text) to anon, authenticated;
grant execute on function public.founding_spots_open() to anon, authenticated;
grant execute on function public.owns_creator(uuid), public.is_creator_visible(uuid),
  public.is_inquiry_participant(uuid) to authenticated;
grant execute on function public.is_public_file(text) to anon, authenticated;
grant execute on function public.is_file_in_use(text), public.is_path_referenced(text) to authenticated;

-- The server.
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

commit;
