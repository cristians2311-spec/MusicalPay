begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'brand-assets',
    'brand-assets',
    false,
    10485760,
    array['image/jpeg', 'image/png']
  ),
  (
    'proofs',
    'proofs',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'application/pdf']
  ),
  (
    'issued-documents',
    'issued-documents',
    false,
    10485760,
    array['application/pdf']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function private.storage_object_belongs_to_owner(object_name text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select case
    when (storage.foldername(object_name))[1] ~ '^[1-9][0-9]*$'
      then private.is_band_owner(((storage.foldername(object_name))[1])::bigint)
    else false
  end;
$$;

revoke execute on function private.storage_object_belongs_to_owner(text) from public, anon;
grant execute on function private.storage_object_belongs_to_owner(text) to authenticated;

create policy private_files_read_owner
on storage.objects
for select
to authenticated
using (
  bucket_id in ('brand-assets', 'proofs', 'issued-documents')
  and (select private.storage_object_belongs_to_owner(name))
);

create policy private_files_insert_owner
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('brand-assets', 'proofs', 'issued-documents')
  and (select private.storage_object_belongs_to_owner(name))
);

create policy private_files_update_owner
on storage.objects
for update
to authenticated
using (
  bucket_id in ('brand-assets', 'proofs', 'issued-documents')
  and (select private.storage_object_belongs_to_owner(name))
)
with check (
  bucket_id in ('brand-assets', 'proofs', 'issued-documents')
  and (select private.storage_object_belongs_to_owner(name))
);

create policy private_files_delete_owner
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('brand-assets', 'proofs', 'issued-documents')
  and (select private.storage_object_belongs_to_owner(name))
);

commit;
