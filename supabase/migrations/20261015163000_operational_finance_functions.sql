-- Operaciones financieras compuestas: una llamada debe confirmar todo o revertir todo.

create or replace function public.finish_event(requested_event_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_band_id bigint;
  event_row public.events%rowtype;
  performed_timestamp timestamptz := statement_timestamp();
  active_participants integer;
begin
  select band_id into owner_band_id
  from public.app_users
  where user_id = (select auth.uid()) and is_active and role = 'owner';

  if owner_band_id is null then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select * into event_row
  from public.events
  where id = requested_event_id and band_id = owner_band_id
  for update;

  if event_row.id is null then
    raise exception 'Event not found' using errcode = 'P0002';
  end if;
  if event_row.operational_status = 'cancelled' then
    raise exception 'Cancelled event cannot be performed' using errcode = '23514';
  end if;
  if event_row.operational_status = 'performed' then
    return;
  end if;

  select count(*) into active_participants
  from public.event_participations
  where event_id = requested_event_id
    and band_id = owner_band_id
    and participation_status not in ('absent', 'replaced');

  if active_participants = 0 then
    raise exception 'Event needs at least one participant' using errcode = '23514';
  end if;

  insert into public.obligations (
    band_id, event_id, origin_type, participation_id, beneficiary_type,
    member_id, recognized_amount_cop, recognized_on
  )
  select
    owner_band_id, participation.event_id, 'participation', participation.id,
    'member', participation.member_id, participation.agreed_fee_cop, event_row.event_date
  from public.event_participations participation
  where participation.event_id = requested_event_id
    and participation.band_id = owner_band_id
    and participation.participation_status not in ('absent', 'replaced')
    and not exists (
      select 1 from public.obligations obligation
      where obligation.participation_id = participation.id
    );

  update public.event_participations
  set participation_status = 'performed', performed_at = performed_timestamp
  where event_id = requested_event_id
    and band_id = owner_band_id
    and participation_status not in ('absent', 'replaced');

  update public.events
  set operational_status = 'performed', performed_at = performed_timestamp
  where id = requested_event_id and band_id = owner_band_id;
end;
$$;

revoke execute on function public.finish_event(bigint) from public, anon;
grant execute on function public.finish_event(bigint) to authenticated;

create or replace function public.register_member_payment(
  requested_member_id bigint,
  requested_obligation_ids bigint[],
  requested_paid_on date,
  requested_payment_method_id bigint,
  requested_reference text,
  requested_notes text,
  requested_idempotency_key uuid
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_band_id bigint;
  assigned_number bigint;
  created_payment_id bigint;
  matched_obligations integer;
  requested_count integer;
  payment_total bigint;
begin
  select band_id into owner_band_id
  from public.app_users
  where user_id = (select auth.uid()) and is_active and role = 'owner';

  if owner_band_id is null then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if requested_paid_on is null or requested_idempotency_key is null then
    raise exception 'Missing payment data' using errcode = '22023';
  end if;

  requested_count := cardinality(requested_obligation_ids);
  if requested_count is null or requested_count < 1 or requested_count > 100 then
    raise exception 'Select between 1 and 100 obligations' using errcode = '22023';
  end if;
  if requested_count <> (select count(distinct value) from unnest(requested_obligation_ids) value) then
    raise exception 'Duplicate obligations are not allowed' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.payment_methods
    where id = requested_payment_method_id and band_id = owner_band_id and is_active
  ) then
    raise exception 'Payment method not available' using errcode = '23503';
  end if;

  perform 1
  from public.obligations
  where id = any(requested_obligation_ids)
    and band_id = owner_band_id
  for update;

  select count(*), sum(obligation.recognized_amount_cop - coalesce(applied.amount_cop, 0))
  into matched_obligations, payment_total
  from public.obligations obligation
  left join lateral (
    select sum(allocation.amount_cop)::bigint as amount_cop
    from public.payment_allocations allocation
    where allocation.obligation_id = obligation.id
  ) applied on true
  where obligation.id = any(requested_obligation_ids)
    and obligation.band_id = owner_band_id
    and obligation.beneficiary_type = 'member'
    and obligation.member_id = requested_member_id
    and obligation.status in ('pending', 'partial')
    and obligation.recognized_amount_cop - coalesce(applied.amount_cop, 0) > 0;

  if matched_obligations <> requested_count or payment_total is null or payment_total <= 0 then
    raise exception 'Obligations are no longer payable' using errcode = '23514';
  end if;

  assigned_number := public.next_document_number('payment');
  insert into public.payments (
    band_id, payment_number, beneficiary_type, member_id, amount_cop,
    paid_on, payment_method_id, reference, notes, idempotency_key
  ) values (
    owner_band_id, assigned_number, 'member', requested_member_id, payment_total,
    requested_paid_on, requested_payment_method_id, nullif(trim(requested_reference), ''),
    nullif(trim(requested_notes), ''), requested_idempotency_key
  ) returning id into created_payment_id;

  insert into public.payment_allocations (band_id, payment_id, obligation_id, amount_cop)
  select
    owner_band_id, created_payment_id, obligation.id,
    obligation.recognized_amount_cop - coalesce(applied.amount_cop, 0)
  from public.obligations obligation
  left join lateral (
    select sum(allocation.amount_cop)::bigint as amount_cop
    from public.payment_allocations allocation
    where allocation.obligation_id = obligation.id
  ) applied on true
  where obligation.id = any(requested_obligation_ids)
    and obligation.band_id = owner_band_id;

  return created_payment_id;
end;
$$;

revoke execute on function public.register_member_payment(bigint, bigint[], date, bigint, text, text, uuid) from public, anon;
grant execute on function public.register_member_payment(bigint, bigint[], date, bigint, text, text, uuid) to authenticated;
