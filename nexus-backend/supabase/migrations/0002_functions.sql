-- Nexus backend: business rules, all inside the database so app bugs cannot skip them.
-- Functions that change data take the acting user's id and are callable ONLY by the server
-- (service role). The server checks who the user is (and Turnstile, IP limits) first.
begin;

-- ── Small helpers ───────────────────────────────────────────────────────────
create function public.setting_int(p_key text, p_default int) returns int
language sql stable security definer set search_path = pg_catalog, public as $$
  select coalesce((select (value #>> '{}')::int from public.app_settings where key = p_key), p_default)
$$;

create function public.setting_text(p_key text, p_default text) returns text
language sql stable security definer set search_path = pg_catalog, public as $$
  select coalesce((select value #>> '{}' from public.app_settings where key = p_key), p_default)
$$;

create function public.is_creator_visible(p_creator_id uuid) returns boolean
language sql stable security definer set search_path = pg_catalog, public as $$
  select exists (select 1 from public.creators
                 where id = p_creator_id and status in ('trialing', 'active', 'past_due'))
$$;

create function public.owns_creator(p_creator_id uuid) returns boolean
language sql stable security definer set search_path = pg_catalog, public as $$
  select exists (select 1 from public.creators where id = p_creator_id and user_id = auth.uid())
$$;

create function public.is_inquiry_participant(p_inquiry_id uuid) returns boolean
language sql stable security definer set search_path = pg_catalog, public as $$
  select exists (
    select 1 from public.inquiries i join public.creators c on c.id = i.creator_id
    where i.id = p_inquiry_id and (i.client_user_id = auth.uid() or c.user_id = auth.uid()))
$$;

create function public.is_admin_user(p_user_id uuid) returns boolean
language sql stable security definer set search_path = pg_catalog, public as $$
  select exists (select 1 from public.user_roles where user_id = p_user_id and role = 'admin')
$$;

create function public.require_admin(p_user_id uuid) returns void
language plpgsql stable security definer set search_path = pg_catalog, public as $$
begin
  if p_user_id is null or not public.is_admin_user(p_user_id) then
    raise exception using message = 'forbidden';
  end if;
end $$;

create function public.user_email(p_user_id uuid) returns text
language sql stable security definer set search_path = pg_catalog, public as $$
  select lower(email) from auth.users where id = p_user_id
$$;

-- Verified email + passed the age gate + old enough. Raises a short code on failure.
create function public.require_verified_user(p_user_id uuid, p_min_age int) returns void
language plpgsql stable security definer set search_path = pg_catalog, public as $$
declare
  v_confirmed timestamptz;
  v_gate public.age_gate;
  v_dob date;
begin
  if p_user_id is null then raise exception using message = 'unauthenticated'; end if;
  select email_confirmed_at into v_confirmed from auth.users where id = p_user_id;
  if not found then raise exception using message = 'unauthenticated'; end if;
  if v_confirmed is null then raise exception using message = 'email_not_verified'; end if;
  select age_gate, date_of_birth into v_gate, v_dob from public.profiles where id = p_user_id;
  if v_gate is null or v_gate = 'pending' then raise exception using message = 'age_gate_required'; end if;
  if v_gate = 'blocked' then raise exception using message = 'age_restricted'; end if;
  if v_dob is null or v_dob > (current_date - make_interval(years => p_min_age)) then
    raise exception using message = 'age_restricted';
  end if;
end $$;

-- Fixed-window rate limit. True = allowed. One atomic statement, safe under concurrency.
create function public.check_rate_limit(p_key text, p_max int, p_window_seconds int) returns boolean
language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  v_start timestamptz := to_timestamp(floor(extract(epoch from clock_timestamp()) / p_window_seconds) * p_window_seconds);
  v_count int;
begin
  insert into public.rate_limits as r (key, window_start, count) values (p_key, v_start, 1)
  on conflict (key, window_start) do update set count = r.count + 1
  returning r.count into v_count;
  return v_count <= p_max;
end $$;

create function public.enqueue_email(p_to text, p_template text, p_payload jsonb, p_stream text, p_dedupe text)
returns void
language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if p_to is null then return; end if;
  if p_stream = 'marketing' and exists (select 1 from public.email_suppressions where email = lower(p_to)) then
    return;
  end if;
  insert into public.email_outbox (to_email, template, payload, stream, dedupe_key)
  values (lower(p_to), p_template, coalesce(p_payload, '{}'), p_stream, p_dedupe)
  on conflict (dedupe_key) do nothing;
end $$;

create function public.log_admin(p_admin uuid, p_action text, p_type text, p_id text, p_detail jsonb) returns void
language sql security definer set search_path = pg_catalog, public as $$
  insert into public.admin_log (admin_user_id, action, target_type, target_id, detail)
  values (p_admin, p_action, p_type, p_id, coalesce(p_detail, '{}'))
$$;

-- ── New users get a profile and the "client" role ───────────────────────────
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'client') on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;
create trigger creators_touch before update on public.creators
  for each row execute function public.touch_updated_at();

-- ── Age gate: answered once, cannot be changed afterwards ───────────────────
-- Returns 'ok' or 'blocked'. Under-13s are blocked and their birth date is not stored.
create function public.complete_profile(p_user_id uuid, p_display_name text, p_dob date) returns text
language plpgsql security definer set search_path = pg_catalog, public as $$
declare v public.profiles;
begin
  select * into v from public.profiles where id = p_user_id for update;
  if not found then raise exception using message = 'unauthenticated'; end if;
  if v.age_gate = 'blocked' then return 'blocked'; end if;
  if v.age_gate = 'passed' then
    update public.profiles set display_name = coalesce(nullif(btrim(p_display_name), ''), display_name) where id = p_user_id;
    return 'ok';
  end if;
  if p_dob is null or p_dob > current_date or p_dob < current_date - interval '120 years' then
    raise exception using message = 'invalid:date_of_birth';
  end if;
  if p_dob > current_date - interval '13 years' then
    update public.profiles set age_gate = 'blocked', date_of_birth = null where id = p_user_id;
    return 'blocked';
  end if;
  update public.profiles
     set age_gate = 'passed', date_of_birth = p_dob,
         display_name = coalesce(nullif(btrim(p_display_name), ''), display_name)
   where id = p_user_id;
  return 'ok';
end $$;

-- ── Creator application ─────────────────────────────────────────────────────
create function public.portfolio_key(p_url text) returns text
language sql immutable as $$
  select nullif(regexp_replace(regexp_replace(regexp_replace(lower(btrim(p_url)), '^https?://(www\.)?', ''), '#.*$', ''), '[/?]+$', ''), '')
$$;

create function public.make_slug(p_name text) returns text
language sql volatile as $$
  select left(coalesce(nullif(btrim(regexp_replace(lower(p_name), '[^a-z0-9]+', '-', 'g'), '-'), ''), 'creator'), 60)
         || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)
$$;

create function public.submit_application(
  p_user_id uuid, p_display_name text, p_category text, p_city text, p_region text, p_country text,
  p_portfolio_url text, p_works_remote boolean, p_starting_price_cents int, p_headline text,
  p_utm_source text, p_ref_code text, p_ip_hash text
) returns uuid
language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  v_existing public.creators;
  v_id uuid;
  v_key text := public.portfolio_key(p_portfolio_url);
  v_dup uuid;
begin
  perform public.require_verified_user(p_user_id, 18);
  if v_key is null then raise exception using message = 'invalid:portfolio_url'; end if;
  if not exists (select 1 from public.categories where slug = p_category) then
    raise exception using message = 'invalid:category';
  end if;

  select * into v_existing from public.creators where user_id = p_user_id for update;
  select id into v_dup from public.creators
   where portfolio_key = v_key and user_id <> p_user_id order by created_at limit 1;

  if v_existing.id is not null then
    if not (v_existing.status = 'rejected'
            or (v_existing.status = 'canceled' and v_existing.canceled_reason = 'approval_expired')) then
      raise exception using message = 'already_applied';
    end if;
    if v_existing.applications_count >= 3 then
      raise exception using message = 'too_many_applications';
    end if;
    update public.creators set
      status = 'applied', canceled_reason = null, reject_reason = null,
      display_name = btrim(p_display_name), category_slug = p_category, city = btrim(p_city),
      region = nullif(btrim(p_region), ''), country = nullif(btrim(p_country), ''),
      portfolio_url = btrim(p_portfolio_url), portfolio_key = v_key, duplicate_of = v_dup,
      works_remote = coalesce(p_works_remote, false), starting_price_cents = p_starting_price_cents,
      headline = nullif(btrim(p_headline), ''), applications_count = applications_count + 1
    where id = v_existing.id;
    update public.creator_billing set apply_ip_hash = p_ip_hash where creator_id = v_existing.id;
    v_id := v_existing.id;
  else
    begin
      insert into public.creators (user_id, slug, display_name, category_slug, city, region, country,
        portfolio_url, portfolio_key, duplicate_of, works_remote, starting_price_cents, headline, utm_source, ref_code)
      values (p_user_id, public.make_slug(p_display_name), btrim(p_display_name), p_category, btrim(p_city),
        nullif(btrim(p_region), ''), nullif(btrim(p_country), ''), btrim(p_portfolio_url), v_key, v_dup,
        coalesce(p_works_remote, false), p_starting_price_cents, nullif(btrim(p_headline), ''),
        nullif(btrim(p_utm_source), ''), nullif(btrim(p_ref_code), ''))
      returning id into v_id;
    exception when unique_violation then
      raise exception using message = 'already_applied';
    end;
    insert into public.creator_billing (creator_id, apply_ip_hash) values (v_id, p_ip_hash);
  end if;

  update public.user_roles set role = 'creator', updated_at = now()
   where user_id = p_user_id and role = 'client';
  perform public.enqueue_email(public.user_email(p_user_id), 'application_received',
    jsonb_build_object('name', btrim(p_display_name)), 'account', 'app_received:' || v_id || ':' ||
    (select applications_count from public.creators where id = v_id));
  return v_id;
end $$;

-- ── Approval: the Founding number is handed out here, under a lock ──────────
-- p_seen_updated_at: the profile version the admin looked at. If the applicant changed anything
-- since (for example swapped their avatar), approval is refused and the admin looks again.
create function public.approve_application(p_admin_id uuid, p_creator_id uuid, p_seen_updated_at timestamptz) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  v public.creators;
  v_next int;
  v_number int;
  v_trial_days int;
  v_limit int := least(public.setting_int('founding_limit', 100), 100);
begin
  perform public.require_admin(p_admin_id);
  select * into v from public.creators where id = p_creator_id for update;
  if not found then raise exception using message = 'not_found'; end if;
  if v.status <> 'applied' then raise exception using message = 'invalid_state'; end if;
  if p_seen_updated_at is null or date_trunc('milliseconds', v.updated_at) <> date_trunc('milliseconds', p_seen_updated_at) then
    raise exception using message = 'changed_since_viewed';
  end if;

  v_number := v.founding_number;           -- a number, once given, is kept for good
  if v_number is null then
    select next_number into v_next from public.founding_counter where id for update;
    if v_next <= v_limit then
      v_number := v_next;
      update public.founding_counter set next_number = v_next + 1 where id;
    end if;
  end if;
  v_trial_days := case when v_number is not null
                       then public.setting_int('founding_trial_days', 90)
                       else public.setting_int('standard_trial_days', 30) end;

  update public.creators set status = 'approved', approved_at = now(), founding_number = v_number,
         reviewed_by = p_admin_id, reviewed_at = now(), reject_reason = null, canceled_reason = null
   where id = p_creator_id;
  update public.creator_billing set trial_days = v_trial_days,
         trial_ends_at = now() + make_interval(days => v_trial_days),          -- trial starts at approval
         approval_expires_at = now() + make_interval(days => public.setting_int('approval_expiry_days', 30))
   where creator_id = p_creator_id;

  perform public.enqueue_email(public.user_email(v.user_id), 'application_approved',
    jsonb_build_object('name', v.display_name, 'founding_number', v_number, 'trial_days', v_trial_days),
    'account', 'approved:' || p_creator_id || ':' || v.applications_count);
  perform public.log_admin(p_admin_id, 'approve', 'creator', p_creator_id::text,
    jsonb_build_object('founding_number', v_number, 'trial_days', v_trial_days));
  return jsonb_build_object('founding_number', v_number, 'trial_days', v_trial_days);
end $$;

create function public.reject_application(p_admin_id uuid, p_creator_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = pg_catalog, public as $$
declare v public.creators;
begin
  perform public.require_admin(p_admin_id);
  select * into v from public.creators where id = p_creator_id for update;
  if not found then raise exception using message = 'not_found'; end if;
  if v.status <> 'applied' then raise exception using message = 'invalid_state'; end if;
  update public.creators set status = 'rejected', reject_reason = left(btrim(p_reason), 500),
         reviewed_by = p_admin_id, reviewed_at = now() where id = p_creator_id;
  perform public.enqueue_email(public.user_email(v.user_id), 'application_rejected',
    jsonb_build_object('name', v.display_name, 'reason', left(btrim(p_reason), 500)),
    'account', 'rejected:' || p_creator_id || ':' || v.applications_count);
  perform public.log_admin(p_admin_id, 'reject', 'creator', p_creator_id::text, jsonb_build_object('reason', p_reason));
end $$;

-- ── Billing state: the only place Stripe status becomes creator status ──────
create function public.billing_status_for(p_stripe_status text) returns public.creator_status
language sql immutable as $$
  select case p_stripe_status
    when 'trialing' then 'trialing'::public.creator_status
    when 'active' then 'active'::public.creator_status
    when 'past_due' then 'past_due'::public.creator_status
    when 'unpaid' then 'past_due'::public.creator_status
    when 'canceled' then 'canceled'::public.creator_status
    when 'incomplete_expired' then 'canceled'::public.creator_status
    else null end   -- incomplete, paused, unknown: leave the creator status alone
$$;

create function public.set_stripe_customer(p_creator_id uuid, p_customer_id text) returns text
language plpgsql security definer set search_path = pg_catalog, public as $$
declare v text;
begin
  update public.creator_billing set stripe_customer_id = p_customer_id
   where creator_id = p_creator_id and stripe_customer_id is null;
  select stripe_customer_id into v from public.creator_billing where creator_id = p_creator_id;
  if v is null then raise exception using message = 'not_found'; end if;
  return v;
end $$;

-- Step 1 of every sync: take a number BEFORE reading Stripe.
create function public.begin_billing_sync(p_creator_id uuid) returns bigint
language sql security definer set search_path = pg_catalog, public as $$
  update public.creator_billing set sync_gen = sync_gen + 1 where creator_id = p_creator_id returning sync_gen
$$;

-- Step 2: write what Stripe said. Only the read with the newest number may write: it started
-- after every earlier one, so it saw everything they saw. Webhook order therefore does not matter.
-- p_stripe_status null means "this customer has no subscription at all".
-- Returns orphan=true when Stripe has a live subscription for someone who must not be billed
-- (application not approved, or rejected): the caller cancels it at Stripe.
-- Someone whose approval lapsed but who then paid is simply made live: paying is what was asked of them.
create function public.apply_billing_state(
  p_creator_id uuid, p_subscription_id text, p_stripe_status text,
  p_cancel_at_period_end boolean, p_gen bigint
) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  c public.creators;
  b public.creator_billing;
  v_new public.creator_status;
  v_status public.creator_status;
  v_hidden_reason text;
  v_canceled_reason text;
begin
  select * into c from public.creators where id = p_creator_id for update;
  if not found then raise exception using message = 'not_found'; end if;
  select * into b from public.creator_billing where creator_id = p_creator_id for update;
  if p_gen < b.sync_gen or p_gen <= b.applied_gen then
    -- covered = a read that started after ours has already been written, so nothing is lost
    return jsonb_build_object('changed', false, 'stale', true, 'covered', b.applied_gen > p_gen,
                              'status', c.status, 'slug', c.slug);
  end if;
  if (c.status in ('applied', 'rejected') or c.approved_at is null)
     and p_stripe_status in ('trialing', 'active', 'past_due', 'unpaid') then
    update public.creator_billing set applied_gen = p_gen, synced_at = now() where creator_id = p_creator_id;
    return jsonb_build_object('changed', false, 'orphan', true, 'status', c.status, 'slug', c.slug);
  end if;

  v_status := c.status; v_hidden_reason := c.hidden_reason; v_canceled_reason := c.canceled_reason;
  v_new := public.billing_status_for(p_stripe_status);

  -- Only creators who were approved can have a billing-driven status.
  if c.status in ('applied', 'rejected') or c.approved_at is null then
    v_new := null;
  end if;
  -- No subscription at Stripe: an approved creator keeps waiting; anyone who had one is canceled.
  if p_stripe_status is null and c.status in ('trialing', 'active', 'past_due')
     then v_new := 'canceled'; end if;
  if p_stripe_status is null and c.status = 'hidden' and c.hidden_reason = 'payment'
     then v_new := 'canceled'; end if;
  -- A first checkout that never completed must not cost an approved creator their approval.
  if c.status = 'approved' and v_new = 'canceled' then v_new := null; end if;

  if v_new is not null then
    if c.status = 'hidden' and c.hidden_reason = 'admin' then
      null;                                            -- admin hide wins; remember billing only
    elsif c.status = 'hidden' and c.hidden_reason = 'payment' and v_new = 'past_due' then
      null;                                            -- still unpaid: stay hidden
    elsif c.status = 'canceled' and c.canceled_reason = 'approval_expired' and v_new in ('canceled', 'past_due') then
      null;
    else
      v_status := v_new;
      v_hidden_reason := null;
      v_canceled_reason := case when v_new = 'canceled' then 'subscription_ended' else null end;
    end if;
  end if;

  update public.creator_billing set
    stripe_subscription_id = coalesce(p_subscription_id, stripe_subscription_id),
    stripe_status = p_stripe_status,
    cancel_at_period_end = coalesce(p_cancel_at_period_end, false),
    synced_at = now(), applied_gen = p_gen,
    had_trial = had_trial or coalesce(p_stripe_status = 'trialing', false),
    past_due_since = case
      when p_stripe_status in ('past_due', 'unpaid') then coalesce(past_due_since, now())
      else null end
  where creator_id = p_creator_id;

  if v_status is distinct from c.status or v_hidden_reason is distinct from c.hidden_reason then
    update public.creators set status = v_status, hidden_reason = v_hidden_reason,
           canceled_reason = v_canceled_reason where id = p_creator_id;
    if v_status in ('trialing', 'active', 'past_due') then perform public.refresh_rank(p_creator_id); end if;
    return jsonb_build_object('changed', true, 'status', v_status, 'slug', c.slug);
  end if;
  return jsonb_build_object('changed', false, 'status', c.status, 'slug', c.slug);
end $$;

-- Same card on a second account means no second free trial. True = duplicate.
create function public.register_card_fingerprint(p_creator_id uuid, p_fingerprint text) returns boolean
language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_dup boolean;
begin
  if p_fingerprint is null or p_fingerprint = '' then return false; end if;
  perform pg_advisory_xact_lock(hashtextextended('card:' || p_fingerprint, 0));
  select exists (select 1 from public.used_card_fingerprints
                 where fingerprint = p_fingerprint and creator_id is distinct from p_creator_id) into v_dup;
  insert into public.used_card_fingerprints (fingerprint, creator_id) values (p_fingerprint, p_creator_id)
  on conflict (fingerprint) do nothing;
  update public.creator_billing set card_fingerprint = p_fingerprint,
         trial_abuse = trial_abuse or v_dup where creator_id = p_creator_id;
  return v_dup;
end $$;

-- Called by the grace job AFTER it has re-read Stripe. Re-checks everything under a lock.
create function public.hide_if_overdue(p_creator_id uuid) returns boolean
language plpgsql security definer set search_path = pg_catalog, public as $$
declare c public.creators; b public.creator_billing;
begin
  select * into c from public.creators where id = p_creator_id for update;
  if not found or c.status <> 'past_due' then return false; end if;
  select * into b from public.creator_billing where creator_id = p_creator_id for update;
  if b.past_due_since is null
     or b.past_due_since > now() - make_interval(days => public.setting_int('grace_days', 7)) then
    return false;
  end if;
  update public.creators set status = 'hidden', hidden_reason = 'payment' where id = p_creator_id;
  perform public.enqueue_email(public.user_email(c.user_id), 'profile_hidden_payment',
    jsonb_build_object('name', c.display_name), 'account',
    'hidden_payment:' || p_creator_id || ':' || b.past_due_since::date);
  return true;
end $$;

create function public.admin_set_hidden(p_admin_id uuid, p_creator_id uuid, p_hidden boolean, p_reason text)
returns text
language plpgsql security definer set search_path = pg_catalog, public as $$
declare c public.creators; b public.creator_billing; v public.creator_status;
begin
  perform public.require_admin(p_admin_id);
  select * into c from public.creators where id = p_creator_id for update;
  if not found then raise exception using message = 'not_found'; end if;
  select * into b from public.creator_billing where creator_id = p_creator_id for update;
  if p_hidden then
    if c.status not in ('trialing', 'active', 'past_due', 'hidden') then
      raise exception using message = 'invalid_state';
    end if;
    update public.creators set status = 'hidden', hidden_reason = 'admin' where id = p_creator_id;
  else
    if not (c.status = 'hidden' and c.hidden_reason = 'admin') then
      raise exception using message = 'invalid_state';
    end if;
    v := coalesce(public.billing_status_for(b.stripe_status), 'canceled');
    if v = 'past_due' and b.past_due_since <= now() - make_interval(days => public.setting_int('grace_days', 7)) then
      update public.creators set status = 'hidden', hidden_reason = 'payment' where id = p_creator_id;
    else
      update public.creators set status = v, hidden_reason = null,
             canceled_reason = case when v = 'canceled' then 'subscription_ended' else null end
       where id = p_creator_id;
    end if;
  end if;
  perform public.log_admin(p_admin_id, case when p_hidden then 'hide' else 'unhide' end, 'creator',
    p_creator_id::text, jsonb_build_object('reason', p_reason));
  return c.slug;
end $$;

-- ── Scheduled housekeeping ──────────────────────────────────────────────────
create function public.expire_approvals() returns int
language plpgsql security definer set search_path = pg_catalog, public as $$
declare r record; n int := 0;
begin
  for r in
    select c.id, c.user_id, c.display_name, c.applications_count
      from public.creators c join public.creator_billing b on b.creator_id = c.id
     where c.status = 'approved' and b.approval_expires_at < now()
       for update of c skip locked
  loop
    update public.creators set status = 'canceled', canceled_reason = 'approval_expired' where id = r.id;
    perform public.enqueue_email(public.user_email(r.user_id), 'approval_expired',
      jsonb_build_object('name', r.display_name), 'account', 'approval_expired:' || r.id || ':' || r.applications_count);
    n := n + 1;
  end loop;
  return n;
end $$;

create function public.enqueue_approval_reminders() returns int
language plpgsql security definer set search_path = pg_catalog, public as $$
declare r record; n int := 0;
begin
  for r in
    select c.id, c.user_id, c.display_name, c.applications_count, b.approval_expires_at
      from public.creators c join public.creator_billing b on b.creator_id = c.id
     where c.status = 'approved' and c.approved_at <= now() - interval '7 days'
  loop
    perform public.enqueue_email(public.user_email(r.user_id), 'approval_reminder',
      jsonb_build_object('name', r.display_name, 'expires_at', r.approval_expires_at),
      'account', 'approval_reminder:' || r.id || ':' || r.applications_count);
    n := n + 1;
  end loop;
  return n;
end $$;

-- Before a trial ends: one email at 14, 7 and 3 days left, with what the profile earned.
create function public.enqueue_trial_reminders() returns int
language plpgsql security definer set search_path = pg_catalog, public as $$
declare r record; n int := 0; v_bucket int;
begin
  for r in
    select c.id, c.user_id, c.display_name, b.trial_ends_at,
           (select count(*) from public.inquiries i where i.creator_id = c.id) as inquiries,
           (select count(*) from public.saves s where s.creator_id = c.id) as saves
      from public.creators c join public.creator_billing b on b.creator_id = c.id
     where c.status = 'trialing' and b.trial_ends_at > now() and b.trial_ends_at <= now() + interval '14 days'
  loop
    v_bucket := case when r.trial_ends_at <= now() + interval '3 days' then 3
                     when r.trial_ends_at <= now() + interval '7 days' then 7 else 14 end;
    perform public.enqueue_email(public.user_email(r.user_id), 'trial_ending',
      jsonb_build_object('name', r.display_name, 'days_left', v_bucket, 'trial_ends_at', r.trial_ends_at,
                         'inquiries', r.inquiries, 'saves', r.saves),
      'account', 'trial_ending:' || r.id || ':' || v_bucket);
    n := n + 1;
  end loop;
  return n;
end $$;

create function public.enqueue_weekly_digests() returns int
language plpgsql security definer set search_path = pg_catalog, public as $$
declare r record; n int := 0;
begin
  for r in
    select c.id, c.user_id, c.display_name,
           (select count(*) from public.inquiries i
             where i.creator_id = c.id and i.created_at > now() - interval '7 days') as inquiries,
           (select count(*) from public.inquiries i
             where i.creator_id = c.id and i.status = 'new') as unanswered
      from public.creators c where c.status in ('trialing', 'active', 'past_due')
  loop
    perform public.enqueue_email(public.user_email(r.user_id), 'weekly_digest',
      jsonb_build_object('name', r.display_name, 'inquiries', r.inquiries, 'unanswered', r.unanswered),
      'marketing', 'digest:' || r.id || ':' || to_char(now(), 'IYYY-IW'));
    n := n + 1;
  end loop;
  return n;
end $$;

create function public.cleanup_old_rows() returns void
language sql security definer set search_path = pg_catalog, public as $$
  delete from public.rate_limits where window_start < now() - interval '2 days';
  delete from public.stripe_events where processed_at < now() - interval '90 days';
  delete from public.email_outbox where status = 'sent' and sent_at < now() - interval '30 days';
  delete from public.email_outbox where status in ('dead', 'failed') and created_at < now() - interval '30 days';
$$;

-- ── Stripe event ledger ─────────────────────────────────────────────────────
-- 'new' = first time seen, 'retry' = seen but never finished, 'done' = already processed.
create function public.claim_stripe_event(p_id text, p_type text, p_created timestamptz) returns text
language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_processed timestamptz; v_inserted boolean;
begin
  insert into public.stripe_events (id, type, created) values (p_id, p_type, p_created)
  on conflict (id) do update set attempts = public.stripe_events.attempts + 1
  returning processed_at, (xmax = 0) into v_processed, v_inserted;
  if v_inserted then return 'new'; end if;
  if v_processed is not null then return 'done'; end if;
  return 'retry';
end $$;

create function public.finish_stripe_event(p_id text, p_error text) returns void
language sql security definer set search_path = pg_catalog, public as $$
  update public.stripe_events
     set processed_at = case when p_error is null then now() else processed_at end,
         last_error = left(p_error, 500)
   where id = p_id
$$;

-- ── Email outbox ────────────────────────────────────────────────────────────
create function public.claim_outbox(p_limit int) returns setof public.email_outbox
language sql security definer set search_path = pg_catalog, public as $$
  -- an email whose worker died six times is given up on, not retried for ever
  update public.email_outbox set status = 'dead', locked_at = null, last_error = coalesce(last_error, 'worker died')
   where status = 'sending' and locked_at < now() - interval '10 minutes' and attempts >= 6;
  update public.email_outbox o
     set status = 'sending', attempts = o.attempts + 1, locked_at = now()
   where o.id in (
     select id from public.email_outbox
      where ((status in ('queued', 'failed') and next_attempt_at <= now())
          or (status = 'sending' and locked_at < now() - interval '10 minutes'))
      order by created_at
      for update skip locked
      limit least(greatest(p_limit, 1), 100))
  returning o.*
$$;

create function public.outbox_sent(p_id uuid) returns void
language sql security definer set search_path = pg_catalog, public as $$
  update public.email_outbox set status = 'sent', sent_at = now(), last_error = null, locked_at = null
   where id = p_id and status = 'sending'
$$;

-- Retry with backoff: 2, 4, 8, 16, 32 minutes, then give up ("dead") after 6 tries.
create function public.outbox_failed(p_id uuid, p_error text) returns void
language sql security definer set search_path = pg_catalog, public as $$
  update public.email_outbox
     set status = case when attempts >= 6 then 'dead' else 'failed' end,
         next_attempt_at = now() + make_interval(mins => (power(2, least(attempts, 6)))::int),
         last_error = left(p_error, 500), locked_at = null
   where id = p_id and status = 'sending'
$$;

-- ── Waitlist ────────────────────────────────────────────────────────────────
create function public.create_waitlist_lead(
  p_role text, p_email text, p_need text, p_craft text, p_city text,
  p_utm_source text, p_utm_medium text, p_utm_campaign text, p_ref_code text, p_landing text, p_ip_hash text
) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  v_email text := lower(btrim(p_email));
  v_need text := nullif(btrim(p_need), '');
  r public.waitlist_leads;
begin
  insert into public.waitlist_leads (role, email, need, need_key, craft, city, utm_source, utm_medium,
    utm_campaign, ref_code, landing, ip_hash)
  values (p_role, v_email, v_need, md5(lower(coalesce(v_need, ''))), nullif(btrim(p_craft), ''),
    nullif(btrim(p_city), ''), nullif(btrim(p_utm_source), ''), nullif(btrim(p_utm_medium), ''),
    nullif(btrim(p_utm_campaign), ''), nullif(btrim(p_ref_code), ''), nullif(btrim(p_landing), ''), p_ip_hash)
  on conflict (email, role, need_key) do nothing
  returning * into r;
  if r.id is null then
    -- Already on the list. Answer exactly as for a new lead, with a token that opens nothing.
    return jsonb_build_object('edit_token', gen_random_uuid(),
      'referral_code', substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  end if;
  perform public.enqueue_email(v_email, 'waitlist_confirm',
    jsonb_build_object('role', p_role, 'referral_code', r.referral_code),
    'account', 'waitlist:' || r.id);
  return jsonb_build_object('edit_token', r.edit_token, 'referral_code', r.referral_code);
end $$;

create function public.update_waitlist_details(p_token uuid, p_date_text text, p_budget text) returns void
language sql security definer set search_path = pg_catalog, public as $$
  update public.waitlist_leads
     set event_date_text = nullif(btrim(p_date_text), ''), budget = nullif(btrim(p_budget), '')
   where edit_token = p_token and created_at > now() - interval '1 day'
$$;

create function public.founding_spots_open() returns int
language sql stable security definer set search_path = pg_catalog, public as $$
  select greatest(0, least(public.setting_int('founding_limit', 100), 100) - (next_number - 1))
    from public.founding_counter where id
$$;

-- ── Profile editing ─────────────────────────────────────────────────────────
create function public.creator_for_user(p_user_id uuid) returns public.creators
language plpgsql security definer set search_path = pg_catalog, public as $$
declare c public.creators;
begin
  select * into c from public.creators where user_id = p_user_id for update;
  if not found then raise exception using message = 'not_a_creator'; end if;
  if c.status = 'rejected' then raise exception using message = 'invalid_state'; end if;
  return c;
end $$;

-- p_patch may contain only the keys listed here; anything else is ignored.
create function public.update_creator_profile(p_user_id uuid, p_patch jsonb) returns void
language plpgsql security definer set search_path = pg_catalog, public as $$
declare c public.creators; v_big boolean; v_key text;
begin
  c := public.creator_for_user(p_user_id);
  if p_patch ? 'category_slug' and not exists
     (select 1 from public.categories where slug = p_patch ->> 'category_slug') then
    raise exception using message = 'invalid:category';
  end if;
  if p_patch ? 'avatar_path' and p_patch ->> 'avatar_path' is not null
     and (p_patch ->> 'avatar_path' not like c.id || '/%' or p_patch ->> 'avatar_path' like c.id || '/%/%'
          or not public.file_exists(p_patch ->> 'avatar_path')) then
    raise exception using message = 'invalid:avatar_path';
  end if;
  if p_patch ? 'cover_path' and p_patch ->> 'cover_path' is not null
     and (p_patch ->> 'cover_path' not like c.id || '/%' or p_patch ->> 'cover_path' like c.id || '/%/%'
          or not public.file_exists(p_patch ->> 'cover_path')) then
    raise exception using message = 'invalid:cover_path';
  end if;
  v_big := c.approved_at is not null and (   -- any time after a person approved it, live or not
       (p_patch ? 'display_name' and p_patch ->> 'display_name' is distinct from c.display_name)
    or (p_patch ? 'headline' and p_patch ->> 'headline' is distinct from c.headline)
    or (p_patch ? 'about' and p_patch ->> 'about' is distinct from c.about)
    or (p_patch ? 'category_slug' and p_patch ->> 'category_slug' is distinct from c.category_slug)
    or (p_patch ? 'portfolio_url' and p_patch ->> 'portfolio_url' is distinct from c.portfolio_url)
    or (p_patch ? 'website_url' and p_patch ->> 'website_url' is distinct from c.website_url)
    or (p_patch ? 'avatar_path' and p_patch ->> 'avatar_path' is distinct from c.avatar_path)
    or (p_patch ? 'cover_path' and p_patch ->> 'cover_path' is distinct from c.cover_path));
  v_key := case when p_patch ? 'portfolio_url' then public.portfolio_key(p_patch ->> 'portfolio_url') else c.portfolio_key end;
  if p_patch ? 'portfolio_url' and v_key is null then raise exception using message = 'invalid:portfolio_url'; end if;

  update public.creators set
    display_name = case when p_patch ? 'display_name' then btrim(p_patch ->> 'display_name') else display_name end,
    headline = case when p_patch ? 'headline' then nullif(btrim(p_patch ->> 'headline'), '') else headline end,
    about = case when p_patch ? 'about' then nullif(btrim(p_patch ->> 'about'), '') else about end,
    category_slug = case when p_patch ? 'category_slug' then p_patch ->> 'category_slug' else category_slug end,
    city = case when p_patch ? 'city' then btrim(p_patch ->> 'city') else city end,
    region = case when p_patch ? 'region' then nullif(btrim(p_patch ->> 'region'), '') else region end,
    country = case when p_patch ? 'country' then nullif(btrim(p_patch ->> 'country'), '') else country end,
    works_remote = case when p_patch ? 'works_remote' then (p_patch ->> 'works_remote')::boolean else works_remote end,
    starting_price_cents = case when p_patch ? 'starting_price_cents' then (p_patch ->> 'starting_price_cents')::int else starting_price_cents end,
    price_on_request = case when p_patch ? 'price_on_request' then (p_patch ->> 'price_on_request')::boolean else price_on_request end,
    portfolio_url = case when p_patch ? 'portfolio_url' then btrim(p_patch ->> 'portfolio_url') else portfolio_url end,
    portfolio_key = v_key,
    website_url = case when p_patch ? 'website_url' then nullif(btrim(p_patch ->> 'website_url'), '') else website_url end,
    instagram_url = case when p_patch ? 'instagram_url' then nullif(btrim(p_patch ->> 'instagram_url'), '') else instagram_url end,
    avatar_path = case when p_patch ? 'avatar_path' then p_patch ->> 'avatar_path' else avatar_path end,
    cover_path = case when p_patch ? 'cover_path' then p_patch ->> 'cover_path' else cover_path end,
    needs_review = needs_review or v_big
  where id = c.id;
  if p_patch ? 'contact_email' or p_patch ? 'contact_phone' then
    update public.creator_billing set
      contact_email = case when p_patch ? 'contact_email' then nullif(lower(btrim(p_patch ->> 'contact_email')), '') else contact_email end,
      contact_phone = case when p_patch ? 'contact_phone' then nullif(btrim(p_patch ->> 'contact_phone'), '') else contact_phone end
    where creator_id = c.id;
  end if;
  perform public.refresh_rank(c.id);
end $$;

create function public.save_service(p_user_id uuid, p_service_id uuid, p jsonb) returns uuid
language plpgsql security definer set search_path = pg_catalog, public as $$
declare c public.creators; v_id uuid;
begin
  c := public.creator_for_user(p_user_id);
  if p_service_id is null then
    if (select count(*) from public.services where creator_id = c.id) >= 20 then
      raise exception using message = 'limit_reached';
    end if;
    insert into public.services (creator_id, kind, title, description, price_cents, price_on_request,
      duration_minutes, group_size, skill_level, format, sort)
    values (c.id, coalesce(p ->> 'kind', 'service'), btrim(p ->> 'title'), nullif(btrim(p ->> 'description'), ''),
      (p ->> 'price_cents')::int, coalesce((p ->> 'price_on_request')::boolean, false),
      (p ->> 'duration_minutes')::int, (p ->> 'group_size')::int, p ->> 'skill_level', p ->> 'format',
      coalesce((p ->> 'sort')::int, 0))
    returning id into v_id;
  else
    update public.services set
      kind = coalesce(p ->> 'kind', kind), title = btrim(p ->> 'title'),
      description = nullif(btrim(p ->> 'description'), ''), price_cents = (p ->> 'price_cents')::int,
      price_on_request = coalesce((p ->> 'price_on_request')::boolean, false),
      duration_minutes = (p ->> 'duration_minutes')::int, group_size = (p ->> 'group_size')::int,
      skill_level = p ->> 'skill_level', format = p ->> 'format', sort = coalesce((p ->> 'sort')::int, sort)
    where id = p_service_id and creator_id = c.id returning id into v_id;
    if v_id is null then raise exception using message = 'not_found'; end if;
  end if;
  perform public.refresh_rank(c.id);
  return v_id;
end $$;

create function public.delete_service(p_user_id uuid, p_service_id uuid) returns void
language plpgsql security definer set search_path = pg_catalog, public as $$
declare c public.creators;
begin
  c := public.creator_for_user(p_user_id);
  delete from public.services where id = p_service_id and creator_id = c.id;
  if not found then raise exception using message = 'not_found'; end if;
  perform public.refresh_rank(c.id);
end $$;

-- New media always waits for a person to approve it before the public can see it.
create function public.add_media(p_user_id uuid, p_kind text, p_storage_path text, p_url text) returns uuid
language plpgsql security definer set search_path = pg_catalog, public as $$
declare c public.creators; v_id uuid; v_provider text; v_host text;
begin
  c := public.creator_for_user(p_user_id);
  if (select count(*) from public.media where creator_id = c.id and status <> 'removed') >= 30 then
    raise exception using message = 'limit_reached';
  end if;
  if p_kind = 'image' then
    if p_storage_path is null or p_storage_path not like c.id || '/%' or p_storage_path like c.id || '/%/%'
       or p_storage_path like '%..%' or not public.file_exists(p_storage_path) then
      raise exception using message = 'invalid:storage_path';   -- must be uploaded first
    end if;
    begin
      insert into public.media (creator_id, kind, storage_path) values (c.id, 'image', p_storage_path)
      returning id into v_id;
    exception when unique_violation then
      raise exception using message = 'invalid:storage_path';   -- this file is already registered
    end;
  elsif p_kind = 'video_link' then
    v_host := lower(substring(coalesce(p_url, '') from '^https://([^/?#]+)'));
    v_provider := case
      when v_host in ('youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be') then 'youtube'
      when v_host in ('vimeo.com', 'www.vimeo.com', 'player.vimeo.com') then 'vimeo'
      when v_host in ('tiktok.com', 'www.tiktok.com', 'vm.tiktok.com') then 'tiktok' end;
    if v_provider is null then raise exception using message = 'invalid:url'; end if;
    insert into public.media (creator_id, kind, url, provider) values (c.id, 'video_link', btrim(p_url), v_provider)
    returning id into v_id;
  else
    raise exception using message = 'invalid:kind';
  end if;
  return v_id;
end $$;

create function public.delete_media(p_user_id uuid, p_media_id uuid) returns text
language plpgsql security definer set search_path = pg_catalog, public as $$
declare c public.creators; v_path text;
begin
  c := public.creator_for_user(p_user_id);
  delete from public.media where id = p_media_id and creator_id = c.id returning storage_path into v_path;
  if not found then raise exception using message = 'not_found'; end if;
  perform public.refresh_rank(c.id);
  -- still the avatar or cover: keep the file (the caller deletes only what is returned)
  if v_path is not null and public.is_file_in_use(v_path) then v_path := null; end if;
  return v_path;
end $$;

create function public.add_claim(p_user_id uuid, p_claim text) returns uuid
language plpgsql security definer set search_path = pg_catalog, public as $$
declare c public.creators; v_id uuid;
begin
  c := public.creator_for_user(p_user_id);
  if (select count(*) from public.creator_claims where creator_id = c.id) >= 10 then
    raise exception using message = 'limit_reached';
  end if;
  insert into public.creator_claims (creator_id, claim) values (c.id, btrim(p_claim))
  on conflict (creator_id, claim) do update set claim = excluded.claim returning id into v_id;
  return v_id;
end $$;

-- ── Saves ───────────────────────────────────────────────────────────────────
create function public.set_save(p_user_id uuid, p_creator_id uuid, p_on boolean) returns void
language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if p_user_id is null then raise exception using message = 'unauthenticated'; end if;
  if p_on then
    if not public.is_creator_visible(p_creator_id) then raise exception using message = 'not_found'; end if;
    if (select count(*) from public.saves where user_id = p_user_id) >= 500 then
      raise exception using message = 'limit_reached';
    end if;
    insert into public.saves (user_id, creator_id) values (p_user_id, p_creator_id) on conflict do nothing;
  else
    delete from public.saves where user_id = p_user_id and creator_id = p_creator_id;
  end if;
end $$;

-- ── Inquiries ───────────────────────────────────────────────────────────────
create function public.send_inquiry(
  p_user_id uuid, p_creator_id uuid, p_name text, p_event_date date, p_date_flexible boolean,
  p_budget text, p_phone text, p_people int, p_message text, p_ip_hash text
) returns uuid
language plpgsql security definer set search_path = pg_catalog, public as $$
declare c public.creators; v_id uuid; v_body text := btrim(coalesce(p_message, ''));
begin
  perform public.require_verified_user(p_user_id, 18);
  select * into c from public.creators where id = p_creator_id;
  if not found or c.status not in ('trialing', 'active', 'past_due') then
    raise exception using message = 'not_found';
  end if;
  if c.user_id = p_user_id then raise exception using message = 'forbidden'; end if;
  if exists (select 1 from public.blocks where creator_id = p_creator_id and blocked_user_id = p_user_id) then
    raise exception using message = 'forbidden';
  end if;
  if char_length(v_body) < 20 then raise exception using message = 'invalid:message'; end if;
  if not public.check_rate_limit('inq:pair:' || p_user_id || ':' || p_creator_id, 1, 86400)
     or not public.check_rate_limit('inq:user:' || p_user_id, 10, 86400)
     or not public.check_rate_limit('inq:creator:' || p_creator_id, 60, 86400) then
    raise exception using message = 'rate_limited';
  end if;

  insert into public.inquiries (creator_id, client_user_id, client_name, event_date, date_flexible,
    budget, phone, people_count, ip_hash)
  values (p_creator_id, p_user_id, btrim(p_name), p_event_date, coalesce(p_date_flexible, false),
    nullif(btrim(p_budget), ''), nullif(btrim(p_phone), ''), p_people, p_ip_hash)
  returning id into v_id;
  insert into public.messages (inquiry_id, sender_user_id, body) values (v_id, p_user_id, v_body);

  -- Saved first; the email is queued and retried separately. The inbox is the backup.
  perform public.enqueue_email(public.user_email(c.user_id), 'inquiry_new',
    jsonb_build_object('inquiry_id', v_id, 'creator_name', c.display_name, 'client_name', btrim(p_name),
      'event_date', p_event_date, 'budget', nullif(btrim(p_budget), ''), 'snippet', left(v_body, 240)),
    'inquiry', 'inquiry:' || v_id);
  return v_id;
end $$;

create function public.post_message(p_user_id uuid, p_inquiry_id uuid, p_body text) returns uuid
language plpgsql security definer set search_path = pg_catalog, public as $$
declare i public.inquiries; c public.creators; v_id uuid; v_is_creator boolean; v_to uuid;
        v_body text := btrim(coalesce(p_body, ''));
begin
  if p_user_id is null then raise exception using message = 'unauthenticated'; end if;
  select * into i from public.inquiries where id = p_inquiry_id for update;
  if not found then raise exception using message = 'not_found'; end if;
  select * into c from public.creators where id = i.creator_id;
  v_is_creator := (c.user_id = p_user_id);
  if not v_is_creator and i.client_user_id <> p_user_id then raise exception using message = 'not_found'; end if;
  if i.status in ('blocked', 'closed') then raise exception using message = 'forbidden'; end if;
  if char_length(v_body) < 1 then raise exception using message = 'invalid:body'; end if;
  if not public.check_rate_limit('msg:user:' || p_user_id, 60, 3600) then
    raise exception using message = 'rate_limited';
  end if;

  insert into public.messages (inquiry_id, sender_user_id, body) values (p_inquiry_id, p_user_id, v_body)
  returning id into v_id;
  if v_is_creator and i.first_reply_at is null then      -- response speed counts real replies only
    update public.inquiries set first_reply_at = now(), status = 'replied' where id = p_inquiry_id;
  end if;
  v_to := case when v_is_creator then i.client_user_id else c.user_id end;
  perform public.enqueue_email(public.user_email(v_to), 'message_new',
    jsonb_build_object('inquiry_id', p_inquiry_id, 'from_name',
      case when v_is_creator then c.display_name else i.client_name end, 'snippet', left(v_body, 240)),
    'inquiry', 'message:' || v_id);
  return v_id;
end $$;

create function public.block_sender(p_user_id uuid, p_inquiry_id uuid) returns void
language plpgsql security definer set search_path = pg_catalog, public as $$
declare i public.inquiries;
begin
  select i2.* into i from public.inquiries i2 join public.creators c on c.id = i2.creator_id
   where i2.id = p_inquiry_id and c.user_id = p_user_id for update of i2;
  if not found then raise exception using message = 'not_found'; end if;
  insert into public.blocks (creator_id, blocked_user_id) values (i.creator_id, i.client_user_id)
  on conflict do nothing;
  update public.inquiries set status = 'blocked'
   where creator_id = i.creator_id and client_user_id = i.client_user_id;
end $$;

-- A creator's own email/phone is only shown to signed-in, verified adults, and not in bulk.
create function public.get_creator_contact(p_user_id uuid, p_creator_id uuid) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public as $$
declare b public.creator_billing;
begin
  perform public.require_verified_user(p_user_id, 18);
  if not public.is_creator_visible(p_creator_id) then raise exception using message = 'not_found'; end if;
  if not public.check_rate_limit('contact:user:' || p_user_id, 30, 86400) then
    raise exception using message = 'rate_limited';
  end if;
  select * into b from public.creator_billing where creator_id = p_creator_id;
  return jsonb_build_object('email', b.contact_email, 'phone', b.contact_phone);
end $$;

create function public.submit_report(p_user_id uuid, p_target_type text, p_target_id uuid, p_reason text)
returns uuid
language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_id uuid;
begin
  if p_user_id is null then raise exception using message = 'unauthenticated'; end if;
  if not public.check_rate_limit('report:user:' || p_user_id, 10, 86400) then
    raise exception using message = 'rate_limited';
  end if;
  insert into public.reports (reporter_user_id, target_type, target_id, reason)
  values (p_user_id, p_target_type, p_target_id, btrim(p_reason)) returning id into v_id;
  return v_id;
end $$;

-- ── Reviews ─────────────────────────────────────────────────────────────────
-- Only the client of a real inquiry the creator answered, at least 7 days later,
-- from an account at least 7 days old. Always held for moderation.
create function public.submit_review(p_user_id uuid, p_inquiry_id uuid, p_rating int, p_body text, p_ip_hash text)
returns uuid
language plpgsql security definer set search_path = pg_catalog, public as $$
declare i public.inquiries; c public.creators; v_id uuid; v_suspect boolean;
begin
  perform public.require_verified_user(p_user_id, 18);
  select * into i from public.inquiries where id = p_inquiry_id;
  if not found or i.client_user_id <> p_user_id then raise exception using message = 'not_found'; end if;
  select * into c from public.creators where id = i.creator_id;
  if c.user_id = p_user_id then raise exception using message = 'forbidden'; end if;
  if i.first_reply_at is null or i.status = 'blocked' then raise exception using message = 'not_eligible'; end if;
  if i.created_at > now() - interval '7 days' then raise exception using message = 'too_early'; end if;
  if (select created_at from auth.users where id = p_user_id) > now() - interval '7 days' then
    raise exception using message = 'too_early';
  end if;
  select exists (select 1 from public.creator_billing b
                  where b.creator_id = i.creator_id and b.apply_ip_hash is not null
                    and b.apply_ip_hash in (p_ip_hash, i.ip_hash)) into v_suspect;
  begin
    insert into public.reviews (inquiry_id, creator_id, author_user_id, rating, body, suspect)
    values (p_inquiry_id, i.creator_id, p_user_id, p_rating, nullif(btrim(p_body), ''), v_suspect)
    returning id into v_id;
  exception when unique_violation then
    raise exception using message = 'already_reviewed';
  end;
  return v_id;
end $$;

create function public.dispute_review(p_user_id uuid, p_review_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  -- One dispute per review. The review stays where it is until a person has looked.
  update public.reviews r set dispute_reason = left(btrim(p_reason), 1000), disputed_at = now(), dispute_open = true
   where r.id = p_review_id and r.status in ('pending', 'published') and r.disputed_at is null
     and exists (select 1 from public.creators c where c.id = r.creator_id and c.user_id = p_user_id);
  if not found then raise exception using message = 'not_found'; end if;
end $$;

-- ── Admin moderation ────────────────────────────────────────────────────────
create function public.moderate_review(p_admin_id uuid, p_review_id uuid, p_status text) returns void
language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  perform public.require_admin(p_admin_id);
  if p_status not in ('published', 'rejected') then raise exception using message = 'invalid:status'; end if;
  update public.reviews set status = p_status, dispute_open = false where id = p_review_id;
  if not found then raise exception using message = 'not_found'; end if;
  perform public.log_admin(p_admin_id, 'review_' || p_status, 'review', p_review_id::text, null);
end $$;

create function public.moderate_media(p_admin_id uuid, p_media_id uuid, p_status text) returns text
language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_creator uuid; v_path text;
begin
  perform public.require_admin(p_admin_id);
  if p_status not in ('approved', 'removed') then raise exception using message = 'invalid:status'; end if;
  update public.media set status = p_status where id = p_media_id returning creator_id, storage_path into v_creator, v_path;
  if not found then raise exception using message = 'not_found'; end if;
  if p_status = 'removed' and v_path is not null then   -- also take it off the profile header
    update public.creators set avatar_path = nullif(avatar_path, v_path), cover_path = nullif(cover_path, v_path)
     where id = v_creator and (avatar_path = v_path or cover_path = v_path);
  end if;
  perform public.refresh_rank(v_creator);
  perform public.log_admin(p_admin_id, 'media_' || p_status, 'media', p_media_id::text, null);
  return case when p_status = 'removed' then v_path end;  -- the caller deletes this file
end $$;

create function public.handle_report(p_admin_id uuid, p_report_id uuid, p_status text) returns void
language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  perform public.require_admin(p_admin_id);
  if p_status not in ('actioned', 'dismissed') then raise exception using message = 'invalid:status'; end if;
  update public.reports set status = p_status, handled_by = p_admin_id where id = p_report_id;
  if not found then raise exception using message = 'not_found'; end if;
  perform public.log_admin(p_admin_id, 'report_' || p_status, 'report', p_report_id::text, null);
end $$;

create function public.verify_claim(p_admin_id uuid, p_claim_id uuid, p_verified boolean) returns void
language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  perform public.require_admin(p_admin_id);
  update public.creator_claims set verified = p_verified,
         verified_by = case when p_verified then p_admin_id else null end where id = p_claim_id;
  if not found then raise exception using message = 'not_found'; end if;
  perform public.log_admin(p_admin_id, 'claim_verify', 'claim', p_claim_id::text, jsonb_build_object('verified', p_verified));
end $$;

create function public.clear_needs_review(p_admin_id uuid, p_creator_id uuid) returns void
language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  perform public.require_admin(p_admin_id);
  update public.creators set needs_review = false where id = p_creator_id;
  if not found then raise exception using message = 'not_found'; end if;
  perform public.log_admin(p_admin_id, 'edit_reviewed', 'creator', p_creator_id::text, null);
end $$;

-- ── Ranking ─────────────────────────────────────────────────────────────────
create function public.creator_completeness(p_creator_id uuid) returns int
language sql stable security definer set search_path = pg_catalog, public as $$
  select 10
       + case when c.headline is not null then 15 else 0 end
       + case when char_length(coalesce(c.about, '')) >= 80 then 15 else 0 end
       + case when c.starting_price_cents is not null or c.price_on_request then 10 else 0 end
       + case when c.avatar_path is not null then 10 else 0 end
       + case when c.cover_path is not null then 10 else 0 end
       + case when exists (select 1 from public.services s where s.creator_id = c.id) then 15 else 0 end
       + case when (select count(*) from public.media m where m.creator_id = c.id and m.status = 'approved') >= 3
              then 15 else 0 end
    from public.creators c where c.id = p_creator_id
$$;

create function public.refresh_rank(p_creator_id uuid) returns void
language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  c public.creators; v_comp int; v_resp numeric; v_act numeric; v_int numeric; v_new numeric;
  v_total int; v_fast int;
begin
  select * into c from public.creators where id = p_creator_id;
  if not found then return; end if;
  v_comp := coalesce(public.creator_completeness(p_creator_id), 0);

  -- response: share of inquiries (older than a day, last 90 days) answered within 24h
  select count(*), count(*) filter (where first_reply_at is not null and first_reply_at <= created_at + interval '24 hours')
    into v_total, v_fast from public.inquiries
   where creator_id = p_creator_id and created_at > now() - interval '90 days' and created_at < now() - interval '1 day'
     and status <> 'blocked';
  v_resp := case when v_total = 0 then 0.5 else v_fast::numeric / v_total end;
  v_act := case when c.updated_at > now() - interval '30 days' then 1
                when c.updated_at > now() - interval '90 days' then 0.5 else 0 end;
  -- interest: one point per verified account older than 7 days that saved or inquired (so capped per account)
  select least(1, count(distinct u.id)::numeric / 20) into v_int
    from auth.users u
   where u.email_confirmed_at is not null and u.created_at < now() - interval '7 days' and u.id <> c.user_id
     and (exists (select 1 from public.saves s where s.user_id = u.id and s.creator_id = p_creator_id
                    and s.created_at > now() - interval '90 days')
       or exists (select 1 from public.inquiries i where i.client_user_id = u.id and i.creator_id = p_creator_id
                    and i.created_at > now() - interval '90 days' and i.status <> 'blocked'));
  v_new := case when c.approved_at > now() - interval '30 days' then 1 else 0 end;

  insert into public.creator_rank (creator_id, completeness, launch_score, weighted_score, computed_at)
  values (p_creator_id, v_comp,
    (case when v_comp >= 60 then 4e10 else 0 end) + (case when c.founding_number is not null then 2e10 else 0 end)
      + coalesce(extract(epoch from c.approved_at), 0),
    v_comp * 0.30 + v_resp * 25 + v_act * 15 + v_int * 20 + v_new * 10
      + (case when c.founding_number is not null then 2 else 0 end),
    now())
  on conflict (creator_id) do update set completeness = excluded.completeness,
    launch_score = excluded.launch_score, weighted_score = excluded.weighted_score, computed_at = now();
end $$;

create function public.recompute_ranks() returns int
language plpgsql security definer set search_path = pg_catalog, public as $$
declare r record; n int := 0;
begin
  for r in select id from public.creators where status in ('trialing', 'active', 'past_due') loop
    perform public.refresh_rank(r.id); n := n + 1;
  end loop;
  return n;
end $$;

-- ── Public reads (safe columns only; anyone may call these) ─────────────────
create function public.search_creators(
  p_q text default null, p_category text default null, p_city text default null,
  p_remote boolean default null, p_min_price int default null, p_max_price int default null,
  p_limit int default 24, p_offset int default 0
) returns table (
  id uuid, slug text, display_name text, headline text, category_slug text, city text, region text,
  works_remote boolean, starting_price_cents int, price_on_request boolean, avatar_path text,
  cover_path text, founding_number int, total bigint
)
language sql stable security definer set search_path = pg_catalog, public as $$
  select c.id, c.slug, c.display_name, c.headline, c.category_slug, c.city, c.region, c.works_remote,
         c.starting_price_cents, c.price_on_request, c.avatar_path, c.cover_path, c.founding_number,
         count(*) over () as total
    from public.creators c
    join public.creator_rank r on r.creator_id = c.id
   where c.status in ('trialing', 'active', 'past_due')
     and r.completeness >= public.setting_int('min_completeness', 40)
     and (p_category is null or c.category_slug = p_category)
     and (p_city is null or lower(c.city) = lower(btrim(left(p_city, 80))))
     and (p_remote is null or c.works_remote = p_remote)
     and (p_min_price is null or c.starting_price_cents >= p_min_price)
     and (p_max_price is null or c.starting_price_cents <= p_max_price)
     and (p_q is null or btrim(p_q) = '' or position(lower(btrim(left(p_q, 80))) in
            lower(c.display_name || ' ' || coalesce(c.headline, '') || ' ' || c.category_slug || ' ' || c.city)) > 0)
   order by case when public.setting_text('ranking_mode', 'launch') = 'weighted'
                 then r.weighted_score else r.launch_score end desc, c.id
   limit least(greatest(coalesce(p_limit, 24), 1), 50)
  offset least(greatest(coalesce(p_offset, 0), 0), 5000)
$$;

-- state: 'visible' (full profile), 'unavailable' (was live, now hidden/ended), 'not_found'.
create function public.creator_public(p_slug text) returns jsonb
language plpgsql stable security definer set search_path = pg_catalog, public as $$
declare c public.creators;
begin
  select * into c from public.creators where slug = p_slug;
  if not found then return jsonb_build_object('state', 'not_found'); end if;
  if c.status not in ('trialing', 'active', 'past_due') then
    if c.status in ('hidden', 'canceled') and c.canceled_reason is distinct from 'approval_expired' then
      return jsonb_build_object('state', 'unavailable');
    end if;
    return jsonb_build_object('state', 'not_found');
  end if;
  return jsonb_build_object(
    'state', 'visible',
    'creator', jsonb_build_object('id', c.id, 'slug', c.slug, 'display_name', c.display_name,
      'headline', c.headline, 'about', c.about, 'category_slug', c.category_slug, 'city', c.city,
      'region', c.region, 'country', c.country, 'works_remote', c.works_remote,
      'starting_price_cents', c.starting_price_cents, 'price_on_request', c.price_on_request,
      'website_url', c.website_url, 'instagram_url', c.instagram_url, 'portfolio_url', c.portfolio_url,
      'avatar_path', c.avatar_path, 'cover_path', c.cover_path, 'founding_number', c.founding_number),
    'services', coalesce((select jsonb_agg(to_jsonb(s) - 'creator_id' order by s.sort, s.created_at)
                            from public.services s where s.creator_id = c.id), '[]'),
    'media', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'kind', m.kind, 'storage_path', m.storage_path,
                              'url', m.url, 'provider', m.provider) order by m.sort, m.created_at)
                         from public.media m where m.creator_id = c.id and m.status = 'approved'), '[]'),
    'claims', coalesce((select jsonb_agg(jsonb_build_object('claim', k.claim, 'verified', k.verified))
                          from public.creator_claims k where k.creator_id = c.id), '[]'),
    'reviews', coalesce((select jsonb_agg(jsonb_build_object('rating', v.rating, 'body', v.body, 'created_at', v.created_at)
                               order by v.created_at desc)
                           from public.reviews v where v.creator_id = c.id and v.status = 'published'), '[]'));
end $$;

-- ── Storage rules (used by the policies in 0004) ───────────────────────────
-- A file is public only if it is an approved image, or the current avatar/cover, of a live creator.
create function public.is_public_file(p_name text) returns boolean
language sql stable security definer set search_path = pg_catalog, public as $$
  select exists (
    select 1 from public.creators c
     where c.status in ('trialing', 'active', 'past_due')
       and (c.avatar_path = p_name or c.cover_path = p_name
            or exists (select 1 from public.media m
                        where m.creator_id = c.id and m.storage_path = p_name and m.status = 'approved')))
$$;

-- A file the public can (or could) see may not be deleted or replaced by its owner directly:
-- they remove it through the app, which takes it out of the profile first.
create function public.is_file_in_use(p_name text) returns boolean
language sql stable security definer set search_path = pg_catalog, public as $$
  select exists (select 1 from public.media m where m.storage_path = p_name and m.status = 'approved')
      or exists (select 1 from public.creators c
                  where c.approved_at is not null and (c.avatar_path = p_name or c.cover_path = p_name))
$$;

-- Is anything already pointing at this path? Then nobody may upload to it: the bytes a person
-- reviewed (or will review) must be the bytes that exist. A path can only be referenced AFTER upload.
create function public.is_path_referenced(p_name text) returns boolean
language sql stable security definer set search_path = pg_catalog, public as $$
  select exists (select 1 from public.media where storage_path = p_name)
      or exists (select 1 from public.creators where avatar_path = p_name or cover_path = p_name)
$$;

create function public.file_exists(p_name text) returns boolean
language sql stable security definer set search_path = pg_catalog, public, storage as $$
  select exists (select 1 from storage.objects where bucket_id = 'media' and name = p_name)
$$;

-- ── Account deletion: clear what does not cascade from the auth user ────────
create function public.purge_user_data(p_user_id uuid) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_email text := public.user_email(p_user_id); v_creator uuid; v_customer text;
begin
  if v_email is null then raise exception using message = 'not_found'; end if;
  select c.id, b.stripe_customer_id into v_creator, v_customer
    from public.creators c left join public.creator_billing b on b.creator_id = c.id where c.user_id = p_user_id;
  delete from public.email_outbox where to_email = v_email;
  -- queued emails to other people that quote this person's name or message
  delete from public.email_outbox o
   where o.payload ? 'inquiry_id'
     and (o.payload ->> 'inquiry_id') in (
       select i.id::text from public.inquiries i
        where i.client_user_id = p_user_id or i.creator_id = v_creator);
  delete from public.waitlist_leads where email = v_email;
  return jsonb_build_object('creator_id', v_creator, 'stripe_customer_id', v_customer);
end $$;

commit;
