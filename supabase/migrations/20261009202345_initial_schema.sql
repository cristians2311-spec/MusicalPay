begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = statement_timestamp();
  return new;
end;
$$;

revoke execute on function private.set_updated_at() from public, anon, authenticated;

create table public.bands (
  id bigint generated always as identity primary key,
  name text not null check (char_length(trim(name)) between 2 and 120),
  timezone text not null default 'America/Bogota',
  currency_code text not null default 'COP' check (currency_code = 'COP'),
  quote_validity_days smallint not null default 7 check (quote_validity_days between 1 and 90),
  logo_path text,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp()
);

create table public.app_users (
  user_id uuid primary key references auth.users(id) on delete restrict,
  band_id bigint not null references public.bands(id) on delete restrict,
  role text not null default 'owner' check (role = 'owner'),
  is_active boolean not null default true,
  created_at timestamptz not null default statement_timestamp(),
  unique (band_id, user_id)
);

create index app_users_band_id_idx on public.app_users (band_id);

create table public.clients (
  id bigint generated always as identity primary key,
  band_id bigint not null references public.bands(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 2 and 160),
  phone text,
  normalized_phone text,
  notes text,
  archived_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  check (phone is null or char_length(trim(phone)) between 7 and 30),
  check (normalized_phone is null or normalized_phone ~ '^\+[1-9][0-9]{6,14}$')
);

create index clients_band_name_idx on public.clients (band_id, name);
create index clients_band_phone_idx on public.clients (band_id, normalized_phone)
  where normalized_phone is not null;

create table public.members (
  id bigint generated always as identity primary key,
  band_id bigint not null references public.bands(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 2 and 160),
  nickname text,
  phone text,
  notes text,
  is_owner_profile boolean not null default false,
  is_active boolean not null default true,
  archived_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  check (phone is null or char_length(trim(phone)) between 7 and 30)
);

create unique index members_one_owner_profile_per_band_idx
  on public.members (band_id)
  where is_owner_profile;
create index members_band_active_name_idx on public.members (band_id, is_active, name);

create table public.member_payment_details (
  member_id bigint primary key references public.members(id) on delete cascade,
  band_id bigint not null references public.bands(id) on delete restrict,
  institution text,
  account_type text check (account_type in ('bank_account', 'wallet')),
  account_reference text,
  payment_phone text,
  notes text,
  updated_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  updated_at timestamptz not null default statement_timestamp(),
  check (
    account_reference is not null
    or payment_phone is not null
    or institution is not null
  )
);

create index member_payment_details_band_id_idx on public.member_payment_details (band_id);

create table public.roles (
  id bigint generated always as identity primary key,
  band_id bigint not null references public.bands(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 2 and 80),
  is_active boolean not null default true,
  sort_order smallint not null default 0,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  unique (band_id, name)
);

create table public.member_roles (
  member_id bigint not null references public.members(id) on delete cascade,
  role_id bigint not null references public.roles(id) on delete restrict,
  band_id bigint not null references public.bands(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  primary key (member_id, role_id)
);

create index member_roles_role_id_idx on public.member_roles (role_id);
create index member_roles_band_id_idx on public.member_roles (band_id);

create table public.formations (
  id bigint generated always as identity primary key,
  band_id bigint not null references public.bands(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 2 and 120),
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  unique (band_id, name)
);

create unique index formations_one_default_per_band_idx
  on public.formations (band_id)
  where is_default and is_active;

create table public.formation_slots (
  id bigint generated always as identity primary key,
  formation_id bigint not null references public.formations(id) on delete cascade,
  band_id bigint not null references public.bands(id) on delete restrict,
  role_id bigint not null references public.roles(id) on delete restrict,
  suggested_member_id bigint references public.members(id) on delete restrict,
  sort_order smallint not null default 0,
  created_at timestamptz not null default statement_timestamp(),
  unique (formation_id, role_id)
);

create index formation_slots_band_id_idx on public.formation_slots (band_id);
create index formation_slots_role_id_idx on public.formation_slots (role_id);
create index formation_slots_suggested_member_id_idx on public.formation_slots (suggested_member_id)
  where suggested_member_id is not null;

create table public.payment_methods (
  id bigint generated always as identity primary key,
  band_id bigint not null references public.bands(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 2 and 80),
  is_active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  unique (band_id, name)
);

create table public.expense_categories (
  id bigint generated always as identity primary key,
  band_id bigint not null references public.bands(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 2 and 80),
  is_active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  unique (band_id, name)
);

create table public.quotes (
  id bigint generated always as identity primary key,
  band_id bigint not null references public.bands(id) on delete restrict,
  client_id bigint not null references public.clients(id) on delete restrict,
  quote_number bigint,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'accepted', 'rejected', 'expired', 'cancelled')),
  current_revision_number smallint not null default 0 check (current_revision_number >= 0),
  sent_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  unique (band_id, quote_number),
  check (quote_number is not null or status = 'draft')
);

create index quotes_band_status_idx on public.quotes (band_id, status, created_at desc);
create index quotes_client_id_idx on public.quotes (client_id);

create table public.quote_revisions (
  id bigint generated always as identity primary key,
  band_id bigint not null references public.bands(id) on delete restrict,
  quote_id bigint not null references public.quotes(id) on delete restrict,
  revision_number smallint not null check (revision_number > 0),
  event_date date not null,
  starts_at timestamptz,
  timezone text not null default 'America/Bogota',
  venue text not null check (char_length(trim(venue)) between 2 and 180),
  address text,
  occasion text not null check (char_length(trim(occasion)) between 2 and 160),
  validity_days smallint not null default 7 check (validity_days between 1 and 90),
  expires_on date,
  general_conditions text,
  internal_notes text,
  client_snapshot jsonb not null default '{}'::jsonb,
  band_snapshot jsonb not null default '{}'::jsonb,
  issued_at timestamptz,
  issued_document_id bigint,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  unique (quote_id, revision_number),
  unique (id, quote_id)
);

create index quote_revisions_band_id_idx on public.quote_revisions (band_id);
create index quote_revisions_quote_id_idx on public.quote_revisions (quote_id);
create index quote_revisions_expiry_idx on public.quote_revisions (band_id, expires_on)
  where issued_at is not null;

create table public.quote_options (
  id bigint generated always as identity primary key,
  band_id bigint not null references public.bands(id) on delete restrict,
  revision_id bigint not null references public.quote_revisions(id) on delete restrict,
  option_number smallint not null check (option_number > 0),
  name text not null check (char_length(trim(name)) between 2 and 120),
  price_cop bigint not null check (price_cop >= 0),
  half_tanda_units smallint not null check (half_tanda_units > 0),
  break_minutes integer not null default 0 check (break_minutes >= 0),
  required_advance_cop bigint check (required_advance_cop >= 0),
  promised_balance_on date,
  customer_conditions text,
  created_at timestamptz not null default statement_timestamp(),
  unique (revision_id, option_number),
  unique (id, revision_id)
);

create index quote_options_band_id_idx on public.quote_options (band_id);

create table public.quote_budget_people (
  id bigint generated always as identity primary key,
  band_id bigint not null references public.bands(id) on delete restrict,
  option_id bigint not null references public.quote_options(id) on delete cascade,
  member_id bigint references public.members(id) on delete restrict,
  label text,
  cost_cop bigint not null check (cost_cop >= 0),
  sort_order smallint not null default 0,
  created_at timestamptz not null default statement_timestamp(),
  check (member_id is not null or char_length(trim(label)) >= 2)
);

create index quote_budget_people_option_id_idx on public.quote_budget_people (option_id);
create index quote_budget_people_member_id_idx on public.quote_budget_people (member_id)
  where member_id is not null;

create table public.quote_budget_person_roles (
  budget_person_id bigint not null references public.quote_budget_people(id) on delete cascade,
  role_id bigint not null references public.roles(id) on delete restrict,
  band_id bigint not null references public.bands(id) on delete restrict,
  primary key (budget_person_id, role_id)
);

create index quote_budget_person_roles_role_id_idx on public.quote_budget_person_roles (role_id);
create index quote_budget_person_roles_band_id_idx on public.quote_budget_person_roles (band_id);

create table public.quote_estimated_expenses (
  id bigint generated always as identity primary key,
  band_id bigint not null references public.bands(id) on delete restrict,
  option_id bigint not null references public.quote_options(id) on delete cascade,
  category_id bigint not null references public.expense_categories(id) on delete restrict,
  description text not null check (char_length(trim(description)) between 2 and 240),
  amount_cop bigint not null check (amount_cop >= 0),
  created_at timestamptz not null default statement_timestamp()
);

create index quote_estimated_expenses_option_id_idx on public.quote_estimated_expenses (option_id);
create index quote_estimated_expenses_category_id_idx on public.quote_estimated_expenses (category_id);

create table public.quote_acceptances (
  id bigint generated always as identity primary key,
  band_id bigint not null references public.bands(id) on delete restrict,
  quote_id bigint not null unique references public.quotes(id) on delete restrict,
  revision_id bigint not null,
  option_id bigint not null,
  accepted_at timestamptz not null default statement_timestamp(),
  advance_waived boolean not null default false,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  foreign key (revision_id, quote_id)
    references public.quote_revisions(id, quote_id) on delete restrict,
  foreign key (option_id, revision_id)
    references public.quote_options(id, revision_id) on delete restrict
);

create index quote_acceptances_revision_id_idx on public.quote_acceptances (revision_id);
create index quote_acceptances_option_id_idx on public.quote_acceptances (option_id);

create table public.events (
  id bigint generated always as identity primary key,
  band_id bigint not null references public.bands(id) on delete restrict,
  client_id bigint not null references public.clients(id) on delete restrict,
  acceptance_id bigint unique references public.quote_acceptances(id) on delete restrict,
  event_number bigint not null,
  occasion text not null check (char_length(trim(occasion)) between 2 and 160),
  agreed_price_cop bigint not null check (agreed_price_cop >= 0),
  operational_status text not null default 'pending'
    check (operational_status in ('pending', 'confirmed', 'performed', 'cancelled')),
  financial_status text not null default 'open'
    check (financial_status in ('open', 'review', 'closed')),
  event_date date not null,
  starts_at timestamptz,
  timezone text not null default 'America/Bogota',
  half_tanda_units smallint not null check (half_tanda_units > 0),
  break_minutes integer not null default 0 check (break_minutes >= 0),
  estimated_ends_at timestamptz,
  venue text not null check (char_length(trim(venue)) between 2 and 180),
  address text,
  internal_notes text,
  promised_balance_on date,
  performed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  unique (band_id, event_number),
  check ((operational_status = 'performed') = (performed_at is not null)),
  check ((operational_status = 'cancelled') = (cancelled_at is not null)),
  check (cancelled_at is null or char_length(trim(cancellation_reason)) >= 3)
);

create index events_band_date_idx on public.events (band_id, event_date, starts_at);
create index events_band_status_idx on public.events (band_id, operational_status, financial_status);
create index events_client_id_idx on public.events (client_id);

create table public.event_reschedules (
  id bigint generated always as identity primary key,
  band_id bigint not null references public.bands(id) on delete restrict,
  event_id bigint not null references public.events(id) on delete restrict,
  previous_event_date date not null,
  previous_starts_at timestamptz,
  new_event_date date,
  new_starts_at timestamptz,
  reason text not null check (char_length(trim(reason)) >= 3),
  changed_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  changed_at timestamptz not null default statement_timestamp()
);

create index event_reschedules_event_id_idx on public.event_reschedules (event_id, changed_at desc);

create table public.event_slots (
  id bigint generated always as identity primary key,
  band_id bigint not null references public.bands(id) on delete restrict,
  event_id bigint not null references public.events(id) on delete restrict,
  role_id bigint not null references public.roles(id) on delete restrict,
  sort_order smallint not null default 0,
  created_at timestamptz not null default statement_timestamp(),
  unique (event_id, role_id),
  unique (id, event_id)
);

create index event_slots_band_id_idx on public.event_slots (band_id);
create index event_slots_role_id_idx on public.event_slots (role_id);

create table public.event_participations (
  id bigint generated always as identity primary key,
  band_id bigint not null references public.bands(id) on delete restrict,
  event_id bigint not null references public.events(id) on delete restrict,
  member_id bigint not null references public.members(id) on delete restrict,
  agreed_fee_cop bigint not null check (agreed_fee_cop >= 0),
  participation_status text not null default 'assigned'
    check (participation_status in ('assigned', 'confirmed', 'performed', 'absent', 'replaced')),
  confirmed_at timestamptz,
  performed_at timestamptz,
  notes text,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  unique (event_id, member_id),
  unique (id, event_id),
  check ((participation_status = 'performed') = (performed_at is not null))
);

create index event_participations_band_status_idx
  on public.event_participations (band_id, participation_status);
create index event_participations_member_id_idx
  on public.event_participations (member_id, event_id);

create table public.event_participation_roles (
  participation_id bigint not null references public.event_participations(id) on delete cascade,
  role_id bigint not null references public.roles(id) on delete restrict,
  band_id bigint not null references public.bands(id) on delete restrict,
  primary key (participation_id, role_id)
);

create index event_participation_roles_role_id_idx on public.event_participation_roles (role_id);
create index event_participation_roles_band_id_idx on public.event_participation_roles (band_id);

create table public.event_slot_assignments (
  id bigint generated always as identity primary key,
  band_id bigint not null references public.bands(id) on delete restrict,
  event_id bigint not null references public.events(id) on delete restrict,
  slot_id bigint not null,
  participation_id bigint not null,
  assigned_at timestamptz not null default statement_timestamp(),
  ended_at timestamptz,
  replacement_reason text,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  foreign key (slot_id, event_id)
    references public.event_slots(id, event_id) on delete restrict,
  foreign key (participation_id, event_id)
    references public.event_participations(id, event_id) on delete restrict,
  check (ended_at is null or ended_at >= assigned_at),
  check (ended_at is null or char_length(trim(replacement_reason)) >= 3)
);

create unique index event_slot_assignments_one_active_idx
  on public.event_slot_assignments (slot_id)
  where ended_at is null;
create index event_slot_assignments_participation_id_idx
  on public.event_slot_assignments (participation_id);
create index event_slot_assignments_band_id_idx on public.event_slot_assignments (band_id);

create table public.event_expenses (
  id bigint generated always as identity primary key,
  band_id bigint not null references public.bands(id) on delete restrict,
  event_id bigint not null references public.events(id) on delete restrict,
  category_id bigint not null references public.expense_categories(id) on delete restrict,
  description text not null check (char_length(trim(description)) between 2 and 240),
  payee_name text not null check (char_length(trim(payee_name)) between 2 and 160),
  estimated_amount_cop bigint check (estimated_amount_cop >= 0),
  actual_amount_cop bigint check (actual_amount_cop >= 0),
  expense_date date,
  notes text,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  check (estimated_amount_cop is not null or actual_amount_cop is not null)
);

create index event_expenses_event_id_idx on public.event_expenses (event_id);
create index event_expenses_category_id_idx on public.event_expenses (category_id);
create index event_expenses_band_date_idx on public.event_expenses (band_id, expense_date);

create table public.obligations (
  id bigint generated always as identity primary key,
  band_id bigint not null references public.bands(id) on delete restrict,
  event_id bigint not null references public.events(id) on delete restrict,
  origin_type text not null check (origin_type in ('participation', 'expense')),
  participation_id bigint references public.event_participations(id) on delete restrict,
  expense_id bigint references public.event_expenses(id) on delete restrict,
  beneficiary_type text not null check (beneficiary_type in ('member', 'provider')),
  member_id bigint references public.members(id) on delete restrict,
  payee_name text,
  recognized_amount_cop bigint not null check (recognized_amount_cop >= 0),
  recognized_on date not null,
  status text not null default 'pending' check (status in ('pending', 'partial', 'paid', 'surplus')),
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  check ((participation_id is not null)::integer + (expense_id is not null)::integer = 1),
  check (
    (beneficiary_type = 'member' and member_id is not null and payee_name is null)
    or
    (beneficiary_type = 'provider' and member_id is null and char_length(trim(payee_name)) >= 2)
  ),
  check (
    (origin_type = 'participation' and participation_id is not null)
    or
    (origin_type = 'expense' and expense_id is not null)
  )
);

create unique index obligations_participation_origin_idx
  on public.obligations (participation_id)
  where participation_id is not null;
create unique index obligations_expense_origin_idx
  on public.obligations (expense_id)
  where expense_id is not null;
create index obligations_member_status_idx
  on public.obligations (member_id, status, recognized_on)
  where member_id is not null;
create index obligations_band_status_idx on public.obligations (band_id, status, recognized_on);
create index obligations_event_id_idx on public.obligations (event_id);

create table public.collections (
  id bigint generated always as identity primary key,
  band_id bigint not null references public.bands(id) on delete restrict,
  event_id bigint not null references public.events(id) on delete restrict,
  collection_number bigint not null,
  amount_cop bigint not null check (amount_cop > 0),
  received_on date not null,
  payment_method_id bigint not null references public.payment_methods(id) on delete restrict,
  reference text,
  notes text,
  idempotency_key uuid not null,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  unique (band_id, collection_number),
  unique (band_id, idempotency_key)
);

create index collections_event_id_idx on public.collections (event_id, received_on);
create index collections_band_date_idx on public.collections (band_id, received_on);
create index collections_payment_method_id_idx on public.collections (payment_method_id);

create table public.payments (
  id bigint generated always as identity primary key,
  band_id bigint not null references public.bands(id) on delete restrict,
  payment_number bigint not null,
  beneficiary_type text not null check (beneficiary_type in ('member', 'provider')),
  member_id bigint references public.members(id) on delete restrict,
  payee_name text,
  amount_cop bigint not null check (amount_cop > 0),
  paid_on date not null,
  payment_method_id bigint not null references public.payment_methods(id) on delete restrict,
  reference text,
  notes text,
  idempotency_key uuid not null,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  unique (band_id, payment_number),
  unique (band_id, idempotency_key),
  check (
    (beneficiary_type = 'member' and member_id is not null and payee_name is null)
    or
    (beneficiary_type = 'provider' and member_id is null and char_length(trim(payee_name)) >= 2)
  )
);

create index payments_member_date_idx on public.payments (member_id, paid_on)
  where member_id is not null;
create index payments_band_date_idx on public.payments (band_id, paid_on);
create index payments_payment_method_id_idx on public.payments (payment_method_id);

create table public.payment_allocations (
  id bigint generated always as identity primary key,
  band_id bigint not null references public.bands(id) on delete restrict,
  payment_id bigint not null references public.payments(id) on delete restrict,
  obligation_id bigint not null references public.obligations(id) on delete restrict,
  amount_cop bigint not null check (amount_cop > 0),
  created_at timestamptz not null default statement_timestamp(),
  unique (payment_id, obligation_id)
);

create index payment_allocations_obligation_id_idx on public.payment_allocations (obligation_id);
create index payment_allocations_band_id_idx on public.payment_allocations (band_id);

create table public.refunds (
  id bigint generated always as identity primary key,
  band_id bigint not null references public.bands(id) on delete restrict,
  event_id bigint not null references public.events(id) on delete restrict,
  direction text not null check (direction in ('customer_out', 'payee_in')),
  collection_id bigint references public.collections(id) on delete restrict,
  payment_id bigint references public.payments(id) on delete restrict,
  amount_cop bigint not null check (amount_cop > 0),
  refunded_on date not null,
  payment_method_id bigint not null references public.payment_methods(id) on delete restrict,
  reason text not null check (char_length(trim(reason)) >= 3),
  reference text,
  idempotency_key uuid not null,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  unique (band_id, idempotency_key),
  check ((collection_id is not null)::integer + (payment_id is not null)::integer = 1),
  check (
    (direction = 'customer_out' and collection_id is not null)
    or
    (direction = 'payee_in' and payment_id is not null)
  )
);

create index refunds_event_id_idx on public.refunds (event_id, refunded_on);
create index refunds_collection_id_idx on public.refunds (collection_id)
  where collection_id is not null;
create index refunds_payment_id_idx on public.refunds (payment_id)
  where payment_id is not null;

create table public.financial_corrections (
  id bigint generated always as identity primary key,
  band_id bigint not null references public.bands(id) on delete restrict,
  event_id bigint references public.events(id) on delete restrict,
  target_type text not null
    check (target_type in ('collection', 'payment', 'refund', 'obligation', 'expense', 'participation')),
  target_id bigint not null,
  reason text not null check (char_length(trim(reason)) >= 5),
  correction_data jsonb not null check (jsonb_typeof(correction_data) = 'object'),
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp()
);

create index financial_corrections_target_idx
  on public.financial_corrections (target_type, target_id, created_at desc);
create index financial_corrections_event_id_idx on public.financial_corrections (event_id)
  where event_id is not null;

create table public.documents (
  id bigint generated always as identity primary key,
  band_id bigint not null references public.bands(id) on delete restrict,
  document_type text not null
    check (document_type in ('brand_logo', 'issued_quote', 'collection_proof', 'payment_proof', 'expense_proof')),
  storage_bucket text not null,
  storage_path text not null,
  original_filename text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'application/pdf')),
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  quote_revision_id bigint references public.quote_revisions(id) on delete restrict,
  collection_id bigint references public.collections(id) on delete restrict,
  payment_id bigint references public.payments(id) on delete restrict,
  expense_id bigint references public.event_expenses(id) on delete restrict,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  removed_at timestamptz,
  removed_by uuid references auth.users(id) on delete restrict,
  unique (storage_bucket, storage_path),
  check (
    (document_type = 'brand_logo' and quote_revision_id is null and collection_id is null and payment_id is null and expense_id is null)
    or
    (document_type = 'issued_quote' and quote_revision_id is not null and collection_id is null and payment_id is null and expense_id is null)
    or
    (document_type = 'collection_proof' and quote_revision_id is null and collection_id is not null and payment_id is null and expense_id is null)
    or
    (document_type = 'payment_proof' and quote_revision_id is null and collection_id is null and payment_id is not null and expense_id is null)
    or
    (document_type = 'expense_proof' and quote_revision_id is null and collection_id is null and payment_id is null and expense_id is not null)
  )
);

alter table public.quote_revisions
  add constraint quote_revisions_issued_document_id_fkey
  foreign key (issued_document_id) references public.documents(id) on delete restrict;

create index documents_band_type_idx on public.documents (band_id, document_type, created_at desc);
create index documents_quote_revision_id_idx on public.documents (quote_revision_id)
  where quote_revision_id is not null;
create index documents_collection_id_idx on public.documents (collection_id)
  where collection_id is not null;
create index documents_payment_id_idx on public.documents (payment_id)
  where payment_id is not null;
create index documents_expense_id_idx on public.documents (expense_id)
  where expense_id is not null;

create table public.audit_log (
  id bigint generated always as identity primary key,
  band_id bigint not null references public.bands(id) on delete restrict,
  event_id bigint references public.events(id) on delete restrict,
  action text not null check (char_length(trim(action)) between 3 and 80),
  target_type text not null check (char_length(trim(target_type)) between 2 and 80),
  target_id bigint not null,
  reason text,
  change_summary jsonb not null default '{}'::jsonb check (jsonb_typeof(change_summary) = 'object'),
  actor_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp()
);

create index audit_log_band_created_idx on public.audit_log (band_id, created_at desc);
create index audit_log_target_idx on public.audit_log (target_type, target_id, created_at desc);
create index audit_log_event_id_idx on public.audit_log (event_id, created_at desc)
  where event_id is not null;

create table public.document_sequences (
  band_id bigint not null references public.bands(id) on delete restrict,
  document_type text not null check (document_type in ('quote', 'event', 'collection', 'payment')),
  next_number bigint not null default 1 check (next_number > 0),
  updated_at timestamptz not null default statement_timestamp(),
  primary key (band_id, document_type)
);

create table public.financial_reviews (
  event_id bigint primary key references public.events(id) on delete restrict,
  band_id bigint not null references public.bands(id) on delete restrict,
  participants_reviewed boolean not null default false,
  expenses_reviewed boolean not null default false,
  balances_reviewed boolean not null default false,
  closed_at timestamptz,
  closed_by uuid references auth.users(id) on delete restrict,
  reopened_at timestamptz,
  reopened_by uuid references auth.users(id) on delete restrict,
  reopen_reason text,
  updated_at timestamptz not null default statement_timestamp(),
  check (reopened_at is null or char_length(trim(reopen_reason)) >= 5)
);

create index financial_reviews_band_id_idx on public.financial_reviews (band_id);

create table public.daily_alert_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  band_id bigint not null references public.bands(id) on delete restrict,
  last_shown_on date,
  updated_at timestamptz not null default statement_timestamp()
);

create index daily_alert_state_band_id_idx on public.daily_alert_state (band_id);

-- Las claves compuestas hacen que cada relación conserve el mismo band_id.
-- Esta defensa sigue siendo necesaria aunque RLS oculte las otras agrupaciones.
alter table public.clients add constraint clients_id_band_unique unique (id, band_id);
alter table public.members add constraint members_id_band_unique unique (id, band_id);
alter table public.roles add constraint roles_id_band_unique unique (id, band_id);
alter table public.formations add constraint formations_id_band_unique unique (id, band_id);
alter table public.formation_slots add constraint formation_slots_id_band_unique unique (id, band_id);
alter table public.payment_methods add constraint payment_methods_id_band_unique unique (id, band_id);
alter table public.expense_categories add constraint expense_categories_id_band_unique unique (id, band_id);
alter table public.quotes add constraint quotes_id_band_unique unique (id, band_id);
alter table public.quote_revisions add constraint quote_revisions_id_band_unique unique (id, band_id);
alter table public.quote_options add constraint quote_options_id_band_unique unique (id, band_id);
alter table public.quote_budget_people add constraint quote_budget_people_id_band_unique unique (id, band_id);
alter table public.quote_acceptances add constraint quote_acceptances_id_band_unique unique (id, band_id);
alter table public.events add constraint events_id_band_unique unique (id, band_id);
alter table public.event_slots add constraint event_slots_id_band_unique unique (id, band_id);
alter table public.event_participations add constraint event_participations_id_band_unique unique (id, band_id);
alter table public.event_expenses add constraint event_expenses_id_band_unique unique (id, band_id);
alter table public.obligations add constraint obligations_id_band_unique unique (id, band_id);
alter table public.collections add constraint collections_id_band_unique unique (id, band_id);
alter table public.payments add constraint payments_id_band_unique unique (id, band_id);
alter table public.documents add constraint documents_id_band_unique unique (id, band_id);

alter table public.member_payment_details
  add constraint member_payment_details_member_band_fkey
  foreign key (member_id, band_id) references public.members(id, band_id) on delete cascade;
alter table public.member_roles
  add constraint member_roles_member_band_fkey
  foreign key (member_id, band_id) references public.members(id, band_id) on delete cascade,
  add constraint member_roles_role_band_fkey
  foreign key (role_id, band_id) references public.roles(id, band_id) on delete restrict;
alter table public.formation_slots
  add constraint formation_slots_formation_band_fkey
  foreign key (formation_id, band_id) references public.formations(id, band_id) on delete cascade,
  add constraint formation_slots_role_band_fkey
  foreign key (role_id, band_id) references public.roles(id, band_id) on delete restrict,
  add constraint formation_slots_member_band_fkey
  foreign key (suggested_member_id, band_id) references public.members(id, band_id) on delete restrict;
alter table public.quotes
  add constraint quotes_client_band_fkey
  foreign key (client_id, band_id) references public.clients(id, band_id) on delete restrict;
alter table public.quote_revisions
  add constraint quote_revisions_quote_band_fkey
  foreign key (quote_id, band_id) references public.quotes(id, band_id) on delete restrict;
alter table public.quote_options
  add constraint quote_options_revision_band_fkey
  foreign key (revision_id, band_id) references public.quote_revisions(id, band_id) on delete restrict;
alter table public.quote_budget_people
  add constraint quote_budget_people_option_band_fkey
  foreign key (option_id, band_id) references public.quote_options(id, band_id) on delete cascade,
  add constraint quote_budget_people_member_band_fkey
  foreign key (member_id, band_id) references public.members(id, band_id) on delete restrict;
alter table public.quote_budget_person_roles
  add constraint quote_budget_person_roles_person_band_fkey
  foreign key (budget_person_id, band_id) references public.quote_budget_people(id, band_id) on delete cascade,
  add constraint quote_budget_person_roles_role_band_fkey
  foreign key (role_id, band_id) references public.roles(id, band_id) on delete restrict;
alter table public.quote_estimated_expenses
  add constraint quote_estimated_expenses_option_band_fkey
  foreign key (option_id, band_id) references public.quote_options(id, band_id) on delete cascade,
  add constraint quote_estimated_expenses_category_band_fkey
  foreign key (category_id, band_id) references public.expense_categories(id, band_id) on delete restrict;
alter table public.quote_acceptances
  add constraint quote_acceptances_quote_band_fkey
  foreign key (quote_id, band_id) references public.quotes(id, band_id) on delete restrict,
  add constraint quote_acceptances_revision_band_fkey
  foreign key (revision_id, band_id) references public.quote_revisions(id, band_id) on delete restrict,
  add constraint quote_acceptances_option_band_fkey
  foreign key (option_id, band_id) references public.quote_options(id, band_id) on delete restrict;
alter table public.events
  add constraint events_client_band_fkey
  foreign key (client_id, band_id) references public.clients(id, band_id) on delete restrict,
  add constraint events_acceptance_band_fkey
  foreign key (acceptance_id, band_id) references public.quote_acceptances(id, band_id) on delete restrict;
alter table public.event_reschedules
  add constraint event_reschedules_event_band_fkey
  foreign key (event_id, band_id) references public.events(id, band_id) on delete restrict;
alter table public.event_slots
  add constraint event_slots_event_band_fkey
  foreign key (event_id, band_id) references public.events(id, band_id) on delete restrict,
  add constraint event_slots_role_band_fkey
  foreign key (role_id, band_id) references public.roles(id, band_id) on delete restrict;
alter table public.event_participations
  add constraint event_participations_event_band_fkey
  foreign key (event_id, band_id) references public.events(id, band_id) on delete restrict,
  add constraint event_participations_member_band_fkey
  foreign key (member_id, band_id) references public.members(id, band_id) on delete restrict;
alter table public.event_participation_roles
  add constraint event_participation_roles_participation_band_fkey
  foreign key (participation_id, band_id) references public.event_participations(id, band_id) on delete cascade,
  add constraint event_participation_roles_role_band_fkey
  foreign key (role_id, band_id) references public.roles(id, band_id) on delete restrict;
alter table public.event_slot_assignments
  add constraint event_slot_assignments_event_band_fkey
  foreign key (event_id, band_id) references public.events(id, band_id) on delete restrict,
  add constraint event_slot_assignments_slot_band_fkey
  foreign key (slot_id, band_id) references public.event_slots(id, band_id) on delete restrict,
  add constraint event_slot_assignments_participation_band_fkey
  foreign key (participation_id, band_id) references public.event_participations(id, band_id) on delete restrict;
alter table public.event_expenses
  add constraint event_expenses_event_band_fkey
  foreign key (event_id, band_id) references public.events(id, band_id) on delete restrict,
  add constraint event_expenses_category_band_fkey
  foreign key (category_id, band_id) references public.expense_categories(id, band_id) on delete restrict;
alter table public.obligations
  add constraint obligations_event_band_fkey
  foreign key (event_id, band_id) references public.events(id, band_id) on delete restrict,
  add constraint obligations_participation_band_fkey
  foreign key (participation_id, band_id) references public.event_participations(id, band_id) on delete restrict,
  add constraint obligations_expense_band_fkey
  foreign key (expense_id, band_id) references public.event_expenses(id, band_id) on delete restrict,
  add constraint obligations_member_band_fkey
  foreign key (member_id, band_id) references public.members(id, band_id) on delete restrict;
alter table public.collections
  add constraint collections_event_band_fkey
  foreign key (event_id, band_id) references public.events(id, band_id) on delete restrict,
  add constraint collections_method_band_fkey
  foreign key (payment_method_id, band_id) references public.payment_methods(id, band_id) on delete restrict;
alter table public.payments
  add constraint payments_member_band_fkey
  foreign key (member_id, band_id) references public.members(id, band_id) on delete restrict,
  add constraint payments_method_band_fkey
  foreign key (payment_method_id, band_id) references public.payment_methods(id, band_id) on delete restrict;
alter table public.payment_allocations
  add constraint payment_allocations_payment_band_fkey
  foreign key (payment_id, band_id) references public.payments(id, band_id) on delete restrict,
  add constraint payment_allocations_obligation_band_fkey
  foreign key (obligation_id, band_id) references public.obligations(id, band_id) on delete restrict;
alter table public.refunds
  add constraint refunds_event_band_fkey
  foreign key (event_id, band_id) references public.events(id, band_id) on delete restrict,
  add constraint refunds_collection_band_fkey
  foreign key (collection_id, band_id) references public.collections(id, band_id) on delete restrict,
  add constraint refunds_payment_band_fkey
  foreign key (payment_id, band_id) references public.payments(id, band_id) on delete restrict,
  add constraint refunds_method_band_fkey
  foreign key (payment_method_id, band_id) references public.payment_methods(id, band_id) on delete restrict;
alter table public.financial_corrections
  add constraint financial_corrections_event_band_fkey
  foreign key (event_id, band_id) references public.events(id, band_id) on delete restrict;
alter table public.documents
  add constraint documents_revision_band_fkey
  foreign key (quote_revision_id, band_id) references public.quote_revisions(id, band_id) on delete restrict,
  add constraint documents_collection_band_fkey
  foreign key (collection_id, band_id) references public.collections(id, band_id) on delete restrict,
  add constraint documents_payment_band_fkey
  foreign key (payment_id, band_id) references public.payments(id, band_id) on delete restrict,
  add constraint documents_expense_band_fkey
  foreign key (expense_id, band_id) references public.event_expenses(id, band_id) on delete restrict;
alter table public.audit_log
  add constraint audit_log_event_band_fkey
  foreign key (event_id, band_id) references public.events(id, band_id) on delete restrict;
alter table public.financial_reviews
  add constraint financial_reviews_event_band_fkey
  foreign key (event_id, band_id) references public.events(id, band_id) on delete restrict;

create trigger bands_set_updated_at before update on public.bands
  for each row execute function private.set_updated_at();
create trigger clients_set_updated_at before update on public.clients
  for each row execute function private.set_updated_at();
create trigger members_set_updated_at before update on public.members
  for each row execute function private.set_updated_at();
create trigger roles_set_updated_at before update on public.roles
  for each row execute function private.set_updated_at();
create trigger formations_set_updated_at before update on public.formations
  for each row execute function private.set_updated_at();
create trigger payment_methods_set_updated_at before update on public.payment_methods
  for each row execute function private.set_updated_at();
create trigger expense_categories_set_updated_at before update on public.expense_categories
  for each row execute function private.set_updated_at();
create trigger quotes_set_updated_at before update on public.quotes
  for each row execute function private.set_updated_at();
create trigger events_set_updated_at before update on public.events
  for each row execute function private.set_updated_at();
create trigger event_participations_set_updated_at before update on public.event_participations
  for each row execute function private.set_updated_at();
create trigger event_expenses_set_updated_at before update on public.event_expenses
  for each row execute function private.set_updated_at();
create trigger obligations_set_updated_at before update on public.obligations
  for each row execute function private.set_updated_at();
create trigger financial_reviews_set_updated_at before update on public.financial_reviews
  for each row execute function private.set_updated_at();
create trigger daily_alert_state_set_updated_at before update on public.daily_alert_state
  for each row execute function private.set_updated_at();

commit;
