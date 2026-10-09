begin;

create or replace function public.create_quote_draft(
  p_client_id bigint,
  p_event_date date,
  p_starts_at timestamptz,
  p_venue text,
  p_address text,
  p_occasion text,
  p_validity_days smallint,
  p_general_conditions text,
  p_internal_notes text,
  p_options jsonb
)
returns table (quote_id bigint, revision_id bigint)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  owner_row public.app_users%rowtype;
  client_row public.clients%rowtype;
  band_row public.bands%rowtype;
  created_quote_id bigint;
  created_revision_id bigint;
  option_row jsonb;
  option_position bigint;
begin
  select * into owner_row
  from public.app_users
  where user_id = (select auth.uid())
    and role = 'owner'
    and is_active;

  if not found then
    raise exception 'La cuenta no es propietaria de una agrupación activa';
  end if;

  select * into client_row
  from public.clients
  where id = p_client_id
    and band_id = owner_row.band_id
    and archived_at is null;

  if not found then
    raise exception 'El cliente no existe o está archivado';
  end if;

  select * into band_row
  from public.bands
  where id = owner_row.band_id;

  if jsonb_typeof(p_options) <> 'array'
    or jsonb_array_length(p_options) not between 1 and 5 then
    raise exception 'La cotización debe tener entre una y cinco opciones';
  end if;

  insert into public.quotes (band_id, client_id, current_revision_number)
  values (owner_row.band_id, client_row.id, 1)
  returning id into created_quote_id;

  insert into public.quote_revisions (
    band_id, quote_id, revision_number, event_date, starts_at, venue, address,
    occasion, validity_days, general_conditions, internal_notes,
    client_snapshot, band_snapshot
  )
  values (
    owner_row.band_id,
    created_quote_id,
    1,
    p_event_date,
    p_starts_at,
    trim(p_venue),
    nullif(trim(p_address), ''),
    trim(p_occasion),
    p_validity_days,
    nullif(trim(p_general_conditions), ''),
    nullif(trim(p_internal_notes), ''),
    jsonb_build_object('name', client_row.name, 'phone', client_row.phone),
    jsonb_build_object('name', band_row.name, 'timezone', band_row.timezone, 'currency', band_row.currency_code)
  )
  returning id into created_revision_id;

  for option_row, option_position in
    select value, ordinality
    from jsonb_array_elements(p_options) with ordinality
  loop
    insert into public.quote_options (
      band_id, revision_id, option_number, name, price_cop,
      half_tanda_units, break_minutes, required_advance_cop, customer_conditions
    )
    values (
      owner_row.band_id,
      created_revision_id,
      option_position,
      trim(option_row->>'name'),
      (option_row->>'price_cop')::bigint,
      (option_row->>'half_tanda_units')::smallint,
      coalesce((option_row->>'break_minutes')::integer, 0),
      nullif(option_row->>'required_advance_cop', '')::bigint,
      nullif(trim(option_row->>'customer_conditions'), '')
    );
  end loop;

  return query select created_quote_id, created_revision_id;
end;
$$;

revoke execute on function public.create_quote_draft(
  bigint, date, timestamptz, text, text, text, smallint, text, text, jsonb
) from public, anon;
grant execute on function public.create_quote_draft(
  bigint, date, timestamptz, text, text, text, smallint, text, text, jsonb
) to authenticated;

commit;
