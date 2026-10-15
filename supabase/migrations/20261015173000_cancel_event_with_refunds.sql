create or replace function public.cancel_event(
  requested_event_id bigint,
  requested_reason text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_band_id bigint;
  event_row public.events%rowtype;
  refunded_total bigint := 0;
begin
  select band_id into owner_band_id from public.app_users
  where user_id = (select auth.uid()) and is_active and role = 'owner';
  if owner_band_id is null then raise exception 'Not authorized' using errcode = '42501'; end if;
  if char_length(trim(requested_reason)) < 3 then raise exception 'Cancellation reason is required' using errcode = '22023'; end if;

  select * into event_row from public.events
  where id = requested_event_id and band_id = owner_band_id for update;
  if event_row.id is null then raise exception 'Event not found' using errcode = 'P0002'; end if;
  if event_row.operational_status = 'performed' then raise exception 'Performed event cannot be cancelled' using errcode = '23514'; end if;
  if event_row.operational_status = 'cancelled' then return 0; end if;

  insert into public.refunds (
    band_id, event_id, direction, collection_id, amount_cop, refunded_on,
    payment_method_id, reason, idempotency_key
  )
  select
    owner_band_id, requested_event_id, 'customer_out', collection.id,
    collection.amount_cop - coalesce(refunded.amount_cop, 0), current_date,
    collection.payment_method_id, trim(requested_reason), gen_random_uuid()
  from public.collections collection
  left join lateral (
    select sum(refund.amount_cop)::bigint as amount_cop
    from public.refunds refund
    where refund.collection_id = collection.id and refund.direction = 'customer_out'
  ) refunded on true
  where collection.event_id = requested_event_id
    and collection.band_id = owner_band_id
    and collection.amount_cop - coalesce(refunded.amount_cop, 0) > 0;

  select coalesce(sum(refund.amount_cop), 0) into refunded_total
  from public.refunds refund
  where refund.event_id = requested_event_id and refund.direction = 'customer_out';

  update public.events set
    operational_status = 'cancelled',
    cancelled_at = statement_timestamp(),
    cancellation_reason = trim(requested_reason)
  where id = requested_event_id and band_id = owner_band_id;

  return refunded_total;
end;
$$;

revoke execute on function public.cancel_event(bigint, text) from public, anon;
grant execute on function public.cancel_event(bigint, text) to authenticated;
