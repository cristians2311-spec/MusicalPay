begin;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
grant usage on schema public to authenticated;
grant usage on schema private to authenticated;

alter table public.app_users enable row level security;
alter table public.app_users force row level security;

create policy app_users_read_self
on public.app_users
for select
to authenticated
using (user_id = (select auth.uid()));

create or replace function private.is_band_owner(target_band_id bigint)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.app_users
    where user_id = (select auth.uid())
      and band_id = target_band_id
      and is_active
      and role = 'owner'
  );
$$;

revoke execute on function private.is_band_owner(bigint) from public, anon;
grant execute on function private.is_band_owner(bigint) to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'bands', 'clients', 'members', 'member_payment_details', 'roles',
    'member_roles', 'formations', 'formation_slots', 'payment_methods',
    'expense_categories', 'quotes', 'quote_revisions', 'quote_options',
    'quote_budget_people', 'quote_budget_person_roles',
    'quote_estimated_expenses', 'quote_acceptances', 'events',
    'event_reschedules', 'event_slots', 'event_participations',
    'event_participation_roles', 'event_slot_assignments', 'event_expenses',
    'obligations', 'collections', 'payments', 'payment_allocations',
    'refunds', 'financial_corrections', 'documents', 'audit_log',
    'document_sequences', 'financial_reviews', 'daily_alert_state'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
  end loop;
end;
$$;

create policy bands_read_owner
on public.bands
for select
to authenticated
using ((select private.is_band_owner(id)));

create policy bands_update_owner
on public.bands
for update
to authenticated
using ((select private.is_band_owner(id)))
with check ((select private.is_band_owner(id)));

grant select, update on public.bands to authenticated;
grant select on public.app_users to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'clients', 'members', 'member_payment_details', 'roles', 'member_roles',
    'formations', 'formation_slots', 'payment_methods', 'expense_categories',
    'events', 'event_slots', 'event_participations',
    'event_participation_roles', 'event_expenses'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select private.is_band_owner(band_id)))',
      table_name || '_read_owner', table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select private.is_band_owner(band_id)))',
      table_name || '_insert_owner', table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select private.is_band_owner(band_id))) with check ((select private.is_band_owner(band_id)))',
      table_name || '_update_owner', table_name
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select private.is_band_owner(band_id)))',
      table_name || '_delete_owner', table_name
    );
    execute format(
      'grant select, insert, update, delete on public.%I to authenticated',
      table_name
    );
  end loop;
end;
$$;

-- Una cotización emitida conserva su cabecera como parte del historial comercial.
create policy quotes_read_owner
on public.quotes for select to authenticated
using ((select private.is_band_owner(band_id)));
create policy quotes_insert_owner
on public.quotes for insert to authenticated
with check ((select private.is_band_owner(band_id)));
create policy quotes_update_owner
on public.quotes for update to authenticated
using ((select private.is_band_owner(band_id)))
with check ((select private.is_band_owner(band_id)));
create policy quotes_delete_draft
on public.quotes for delete to authenticated
using ((select private.is_band_owner(band_id)) and status = 'draft');
grant select, insert, update, delete on public.quotes to authenticated;

-- El cierre financiero se puede reabrir con motivo, pero nunca eliminar.
create policy financial_reviews_read_owner
on public.financial_reviews for select to authenticated
using ((select private.is_band_owner(band_id)));
create policy financial_reviews_insert_owner
on public.financial_reviews for insert to authenticated
with check ((select private.is_band_owner(band_id)));
create policy financial_reviews_update_owner
on public.financial_reviews for update to authenticated
using ((select private.is_band_owner(band_id)))
with check ((select private.is_band_owner(band_id)));
grant select, insert, update on public.financial_reviews to authenticated;

-- Las revisiones y su presupuesto solo se pueden modificar antes de emitirse.
create policy quote_revisions_read_owner
on public.quote_revisions for select to authenticated
using ((select private.is_band_owner(band_id)));
create policy quote_revisions_insert_owner
on public.quote_revisions for insert to authenticated
with check ((select private.is_band_owner(band_id)));
create policy quote_revisions_update_draft
on public.quote_revisions for update to authenticated
using ((select private.is_band_owner(band_id)) and issued_at is null)
with check ((select private.is_band_owner(band_id)));
create policy quote_revisions_delete_draft
on public.quote_revisions for delete to authenticated
using ((select private.is_band_owner(band_id)) and issued_at is null);
grant select, insert, update, delete on public.quote_revisions to authenticated;

create policy quote_options_read_owner
on public.quote_options for select to authenticated
using ((select private.is_band_owner(band_id)));
create policy quote_options_insert_draft
on public.quote_options for insert to authenticated
with check (
  (select private.is_band_owner(band_id))
  and exists (
    select 1 from public.quote_revisions revision
    where revision.id = quote_options.revision_id
      and revision.band_id = quote_options.band_id
      and revision.issued_at is null
  )
);
create policy quote_options_update_draft
on public.quote_options for update to authenticated
using (
  (select private.is_band_owner(band_id))
  and exists (
    select 1 from public.quote_revisions revision
    where revision.id = quote_options.revision_id
      and revision.band_id = quote_options.band_id
      and revision.issued_at is null
  )
)
with check (
  (select private.is_band_owner(band_id))
  and exists (
    select 1 from public.quote_revisions revision
    where revision.id = quote_options.revision_id
      and revision.band_id = quote_options.band_id
      and revision.issued_at is null
  )
);
create policy quote_options_delete_draft
on public.quote_options for delete to authenticated
using (
  (select private.is_band_owner(band_id))
  and exists (
    select 1 from public.quote_revisions revision
    where revision.id = quote_options.revision_id
      and revision.band_id = quote_options.band_id
      and revision.issued_at is null
  )
);
grant select, insert, update, delete on public.quote_options to authenticated;

create policy quote_budget_people_read_owner
on public.quote_budget_people for select to authenticated
using ((select private.is_band_owner(band_id)));
create policy quote_budget_people_insert_draft
on public.quote_budget_people for insert to authenticated
with check (
  (select private.is_band_owner(band_id))
  and exists (
    select 1
    from public.quote_options option_row
    join public.quote_revisions revision on revision.id = option_row.revision_id
    where option_row.id = quote_budget_people.option_id
      and option_row.band_id = quote_budget_people.band_id
      and revision.issued_at is null
  )
);
create policy quote_budget_people_update_draft
on public.quote_budget_people for update to authenticated
using (
  (select private.is_band_owner(band_id))
  and exists (
    select 1
    from public.quote_options option_row
    join public.quote_revisions revision on revision.id = option_row.revision_id
    where option_row.id = quote_budget_people.option_id
      and option_row.band_id = quote_budget_people.band_id
      and revision.issued_at is null
  )
)
with check (
  (select private.is_band_owner(band_id))
  and exists (
    select 1
    from public.quote_options option_row
    join public.quote_revisions revision on revision.id = option_row.revision_id
    where option_row.id = quote_budget_people.option_id
      and option_row.band_id = quote_budget_people.band_id
      and revision.issued_at is null
  )
);
create policy quote_budget_people_delete_draft
on public.quote_budget_people for delete to authenticated
using (
  (select private.is_band_owner(band_id))
  and exists (
    select 1
    from public.quote_options option_row
    join public.quote_revisions revision on revision.id = option_row.revision_id
    where option_row.id = quote_budget_people.option_id
      and option_row.band_id = quote_budget_people.band_id
      and revision.issued_at is null
  )
);
grant select, insert, update, delete on public.quote_budget_people to authenticated;

create policy quote_budget_person_roles_read_owner
on public.quote_budget_person_roles for select to authenticated
using ((select private.is_band_owner(band_id)));
create policy quote_budget_person_roles_insert_draft
on public.quote_budget_person_roles for insert to authenticated
with check (
  (select private.is_band_owner(band_id))
  and exists (
    select 1
    from public.quote_budget_people person_row
    join public.quote_options option_row on option_row.id = person_row.option_id
    join public.quote_revisions revision on revision.id = option_row.revision_id
    where person_row.id = quote_budget_person_roles.budget_person_id
      and person_row.band_id = quote_budget_person_roles.band_id
      and revision.issued_at is null
  )
);
create policy quote_budget_person_roles_delete_draft
on public.quote_budget_person_roles for delete to authenticated
using (
  (select private.is_band_owner(band_id))
  and exists (
    select 1
    from public.quote_budget_people person_row
    join public.quote_options option_row on option_row.id = person_row.option_id
    join public.quote_revisions revision on revision.id = option_row.revision_id
    where person_row.id = quote_budget_person_roles.budget_person_id
      and person_row.band_id = quote_budget_person_roles.band_id
      and revision.issued_at is null
  )
);
grant select, insert, delete on public.quote_budget_person_roles to authenticated;

create policy quote_estimated_expenses_read_owner
on public.quote_estimated_expenses for select to authenticated
using ((select private.is_band_owner(band_id)));
create policy quote_estimated_expenses_insert_draft
on public.quote_estimated_expenses for insert to authenticated
with check (
  (select private.is_band_owner(band_id))
  and exists (
    select 1
    from public.quote_options option_row
    join public.quote_revisions revision on revision.id = option_row.revision_id
    where option_row.id = quote_estimated_expenses.option_id
      and option_row.band_id = quote_estimated_expenses.band_id
      and revision.issued_at is null
  )
);
create policy quote_estimated_expenses_update_draft
on public.quote_estimated_expenses for update to authenticated
using (
  (select private.is_band_owner(band_id))
  and exists (
    select 1
    from public.quote_options option_row
    join public.quote_revisions revision on revision.id = option_row.revision_id
    where option_row.id = quote_estimated_expenses.option_id
      and option_row.band_id = quote_estimated_expenses.band_id
      and revision.issued_at is null
  )
)
with check (
  (select private.is_band_owner(band_id))
  and exists (
    select 1
    from public.quote_options option_row
    join public.quote_revisions revision on revision.id = option_row.revision_id
    where option_row.id = quote_estimated_expenses.option_id
      and option_row.band_id = quote_estimated_expenses.band_id
      and revision.issued_at is null
  )
);
create policy quote_estimated_expenses_delete_draft
on public.quote_estimated_expenses for delete to authenticated
using (
  (select private.is_band_owner(band_id))
  and exists (
    select 1
    from public.quote_options option_row
    join public.quote_revisions revision on revision.id = option_row.revision_id
    where option_row.id = quote_estimated_expenses.option_id
      and option_row.band_id = quote_estimated_expenses.band_id
      and revision.issued_at is null
  )
);
grant select, insert, update, delete on public.quote_estimated_expenses to authenticated;

-- Registros históricos: lectura e inserción, sin UPDATE ni DELETE directos.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'quote_acceptances', 'event_reschedules', 'collections', 'payments',
    'payment_allocations', 'refunds', 'financial_corrections', 'audit_log'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select private.is_band_owner(band_id)))',
      table_name || '_read_owner', table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select private.is_band_owner(band_id)))',
      table_name || '_insert_owner', table_name
    );
    execute format('grant select, insert on public.%I to authenticated', table_name);
  end loop;
end;
$$;

create policy event_slot_assignments_read_owner
on public.event_slot_assignments for select to authenticated
using ((select private.is_band_owner(band_id)));
create policy event_slot_assignments_insert_owner
on public.event_slot_assignments for insert to authenticated
with check ((select private.is_band_owner(band_id)));
create policy event_slot_assignments_end_owner
on public.event_slot_assignments for update to authenticated
using ((select private.is_band_owner(band_id)) and ended_at is null)
with check ((select private.is_band_owner(band_id)) and ended_at is not null);
grant select, insert, update (ended_at, replacement_reason) on public.event_slot_assignments to authenticated;

create policy obligations_read_owner
on public.obligations for select to authenticated
using ((select private.is_band_owner(band_id)));
create policy obligations_insert_owner
on public.obligations for insert to authenticated
with check ((select private.is_band_owner(band_id)));
create policy obligations_update_status_owner
on public.obligations for update to authenticated
using ((select private.is_band_owner(band_id)))
with check ((select private.is_band_owner(band_id)));
grant select, insert, update (status, updated_at) on public.obligations to authenticated;

create policy documents_read_owner
on public.documents for select to authenticated
using ((select private.is_band_owner(band_id)));
create policy documents_insert_owner
on public.documents for insert to authenticated
with check ((select private.is_band_owner(band_id)) and removed_at is null and removed_by is null);
create policy documents_mark_removed_owner
on public.documents for update to authenticated
using ((select private.is_band_owner(band_id)) and removed_at is null)
with check ((select private.is_band_owner(band_id)) and removed_at is not null and removed_by = (select auth.uid()));
grant select, insert, update (removed_at, removed_by) on public.documents to authenticated;

create policy daily_alert_state_read_self
on public.daily_alert_state for select to authenticated
using (user_id = (select auth.uid()) and (select private.is_band_owner(band_id)));
create policy daily_alert_state_insert_self
on public.daily_alert_state for insert to authenticated
with check (user_id = (select auth.uid()) and (select private.is_band_owner(band_id)));
create policy daily_alert_state_update_self
on public.daily_alert_state for update to authenticated
using (user_id = (select auth.uid()) and (select private.is_band_owner(band_id)))
with check (user_id = (select auth.uid()) and (select private.is_band_owner(band_id)));
grant select, insert, update on public.daily_alert_state to authenticated;

grant usage, select on all sequences in schema public to authenticated;

-- Consecutivos atómicos. El llamador no elige band_id: se deriva de su cuenta activa.
create or replace function public.next_document_number(requested_type text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_band_id bigint;
  assigned_number bigint;
begin
  if requested_type not in ('quote', 'event', 'collection', 'payment') then
    raise exception 'Unsupported document type' using errcode = '22023';
  end if;

  select band_id into owner_band_id
  from public.app_users
  where user_id = (select auth.uid()) and is_active and role = 'owner';

  if owner_band_id is null then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  insert into public.document_sequences (band_id, document_type, next_number)
  values (owner_band_id, requested_type, 2)
  on conflict (band_id, document_type)
  do update set
    next_number = public.document_sequences.next_number + 1,
    updated_at = statement_timestamp()
  returning next_number - 1 into assigned_number;

  return assigned_number;
end;
$$;

revoke execute on function public.next_document_number(text) from public, anon;
grant execute on function public.next_document_number(text) to authenticated;

create or replace function private.block_historical_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Historical financial rows are immutable; create a correction instead'
    using errcode = '55000';
end;
$$;

revoke execute on function private.block_historical_mutation() from public, anon, authenticated;

create trigger collections_immutable
before update or delete on public.collections
for each row execute function private.block_historical_mutation();
create trigger payments_immutable
before update or delete on public.payments
for each row execute function private.block_historical_mutation();
create trigger payment_allocations_immutable
before update or delete on public.payment_allocations
for each row execute function private.block_historical_mutation();
create trigger refunds_immutable
before update or delete on public.refunds
for each row execute function private.block_historical_mutation();
create trigger financial_corrections_immutable
before update or delete on public.financial_corrections
for each row execute function private.block_historical_mutation();
create trigger audit_log_immutable
before update or delete on public.audit_log
for each row execute function private.block_historical_mutation();

create or replace function private.validate_payment_allocation()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  payment_row public.payments%rowtype;
  obligation_row public.obligations%rowtype;
  allocated_to_payment bigint;
  allocated_to_obligation bigint;
begin
  select * into payment_row from public.payments where id = new.payment_id for update;
  select * into obligation_row from public.obligations where id = new.obligation_id for update;

  if payment_row.id is null or obligation_row.id is null then
    raise exception 'Payment or obligation does not exist' using errcode = '23503';
  end if;

  if new.band_id <> payment_row.band_id or new.band_id <> obligation_row.band_id then
    raise exception 'Allocation crosses band boundary' using errcode = '23514';
  end if;

  if payment_row.beneficiary_type <> obligation_row.beneficiary_type
    or payment_row.member_id is distinct from obligation_row.member_id
    or payment_row.payee_name is distinct from obligation_row.payee_name then
    raise exception 'Payment beneficiary does not match obligation' using errcode = '23514';
  end if;

  select coalesce(sum(amount_cop), 0) into allocated_to_payment
  from public.payment_allocations where payment_id = new.payment_id;
  select coalesce(sum(amount_cop), 0) into allocated_to_obligation
  from public.payment_allocations where obligation_id = new.obligation_id;

  if allocated_to_payment + new.amount_cop > payment_row.amount_cop then
    raise exception 'Payment allocation exceeds payment amount' using errcode = '23514';
  end if;

  if allocated_to_obligation + new.amount_cop > obligation_row.recognized_amount_cop then
    raise exception 'Payment allocation exceeds obligation amount' using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke execute on function private.validate_payment_allocation() from public, anon, authenticated;
create trigger payment_allocations_validate
before insert on public.payment_allocations
for each row execute function private.validate_payment_allocation();

create or replace function private.refresh_obligation_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  applied_amount bigint;
  obligation_amount bigint;
begin
  select recognized_amount_cop into obligation_amount
  from public.obligations where id = new.obligation_id;

  select coalesce(sum(amount_cop), 0) into applied_amount
  from public.payment_allocations where obligation_id = new.obligation_id;

  update public.obligations
  set status = case
    when applied_amount = 0 then 'pending'
    when applied_amount < obligation_amount then 'partial'
    when applied_amount = obligation_amount then 'paid'
    else 'surplus'
  end
  where id = new.obligation_id;

  return new;
end;
$$;

revoke execute on function private.refresh_obligation_status() from public, anon, authenticated;
create trigger payment_allocations_refresh_obligation
after insert on public.payment_allocations
for each row execute function private.refresh_obligation_status();

create or replace function private.validate_refund_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  original_amount bigint;
  refunded_amount bigint;
  original_event_id bigint;
  original_band_id bigint;
begin
  if new.collection_id is not null then
    select amount_cop, event_id, band_id
      into original_amount, original_event_id, original_band_id
    from public.collections where id = new.collection_id for update;

    select coalesce(sum(amount_cop), 0) into refunded_amount
    from public.refunds where collection_id = new.collection_id;
  else
    select amount_cop, null, band_id
      into original_amount, original_event_id, original_band_id
    from public.payments where id = new.payment_id for update;

    select coalesce(sum(amount_cop), 0) into refunded_amount
    from public.refunds where payment_id = new.payment_id;
  end if;

  if original_amount is null then
    raise exception 'Original movement does not exist' using errcode = '23503';
  end if;

  if new.band_id <> original_band_id
    or (original_event_id is not null and new.event_id <> original_event_id) then
    raise exception 'Refund does not match the original movement' using errcode = '23514';
  end if;

  if refunded_amount + new.amount_cop > original_amount then
    raise exception 'Refund exceeds remaining original amount' using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke execute on function private.validate_refund_limit() from public, anon, authenticated;
create trigger refunds_validate_limit
before insert on public.refunds
for each row execute function private.validate_refund_limit();

commit;
