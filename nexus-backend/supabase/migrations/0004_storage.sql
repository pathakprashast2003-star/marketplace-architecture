-- Nexus backend: image storage. Files live at media/<creator_id>/<file> (no sub-folders).
-- The bucket is private. The public can load a file only while it is an approved image (or the
-- current avatar/cover) of a live creator, so hiding a creator or removing an image cuts the link at once.
begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create function public.storage_creator_id(p_name text) returns uuid
language plpgsql immutable as $$
begin
  if p_name !~ '^[0-9a-f-]{36}/[^/]+$' then return null; end if;   -- exactly <uuid>/<file>
  return split_part(p_name, '/', 1)::uuid;
exception when others then
  return null;
end $$;

-- How many files a creator already has (counted as the owner, not through the caller's view).
-- Takes a short lock per creator so parallel uploads cannot slip past the cap together.
create function public.media_file_count(p_creator_id uuid) returns bigint
language plpgsql volatile security definer set search_path = pg_catalog, public as $$
declare n bigint;
begin
  perform pg_advisory_xact_lock(hashtextextended('media:' || p_creator_id::text, 0));
  select count(*) into n from storage.objects o
   where o.bucket_id = 'media' and o.name like p_creator_id::text || '/%';
  return n;
end $$;

revoke execute on function public.storage_creator_id(text), public.media_file_count(uuid) from public;
grant execute on function public.storage_creator_id(text) to anon, authenticated, service_role;
grant execute on function public.media_file_count(uuid) to authenticated, service_role;

create policy media_public_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'media' and public.is_public_file(name));
create policy media_owner_read on storage.objects for select to authenticated
  using (bucket_id = 'media' and public.owns_creator(public.storage_creator_id(name)));
create policy media_owner_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'media'
    and public.owns_creator(public.storage_creator_id(name))
    and public.media_file_count(public.storage_creator_id(name)) < 60
    and not public.is_path_referenced(name)   -- never upload under a name already in use or under review
  );
create policy media_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.owns_creator(public.storage_creator_id(name))
         and not public.is_file_in_use(name));
-- There is no update policy on purpose: a file can never be overwritten in place.

commit;
