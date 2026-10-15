create or replace function public.issue_quote(requested_quote_id bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_band_id bigint;
  quote_row public.quotes%rowtype;
  revision_row public.quote_revisions%rowtype;
  assigned_number bigint;
  client_data jsonb;
  band_data jsonb;
begin
  select band_id into owner_band_id from public.app_users
  where user_id = (select auth.uid()) and is_active and role = 'owner';
  if owner_band_id is null then raise exception 'Not authorized' using errcode = '42501'; end if;

  select * into quote_row from public.quotes
  where id = requested_quote_id and band_id = owner_band_id for update;
  if quote_row.id is null then raise exception 'Quote not found' using errcode = 'P0002'; end if;
  if quote_row.status <> 'draft' then raise exception 'Only drafts can be issued' using errcode = '23514'; end if;

  select * into revision_row from public.quote_revisions
  where quote_id = quote_row.id and revision_number = quote_row.current_revision_number
    and band_id = owner_band_id for update;
  if revision_row.id is null or revision_row.issued_at is not null then
    raise exception 'Revision is not available' using errcode = '23514';
  end if;
  if not exists (select 1 from public.quote_options where revision_id = revision_row.id and band_id = owner_band_id) then
    raise exception 'Quote needs an option' using errcode = '23514';
  end if;

  select jsonb_build_object('name', name, 'phone', phone) into client_data
  from public.clients where id = quote_row.client_id and band_id = owner_band_id;
  select jsonb_build_object('name', name, 'timezone', timezone, 'currency', currency_code) into band_data
  from public.bands where id = owner_band_id;
  assigned_number := public.next_document_number('quote');

  update public.quote_revisions set
    issued_at = statement_timestamp(),
    expires_on = current_date + validity_days,
    client_snapshot = coalesce(client_data, '{}'::jsonb),
    band_snapshot = coalesce(band_data, '{}'::jsonb)
  where id = revision_row.id;
  update public.quotes set status = 'sent', quote_number = assigned_number
  where id = quote_row.id;
  return assigned_number;
end;
$$;

revoke execute on function public.issue_quote(bigint) from public, anon;
grant execute on function public.issue_quote(bigint) to authenticated;
