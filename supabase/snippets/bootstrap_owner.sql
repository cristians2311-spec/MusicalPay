-- EJECUCIÓN MANUAL ÚNICA DESPUÉS DEL PRIMER LOGIN CON GOOGLE.
-- La cuenta autorizada debe haber iniciado sesión antes de ejecutar este bloque.
-- El script se detiene si el usuario no existe o ya tiene un espacio de trabajo.

do $$
declare
  owner_email text := 'cristians2311@gmail.com';
  owner_user_id uuid;
  owner_band_id bigint;
  owner_member_id bigint;
  default_formation_id bigint;
  accordion_role_id bigint;
begin
  select id into owner_user_id
  from auth.users
  where lower(email) = lower(owner_email);

  if owner_user_id is null then
    raise exception 'La cuenta debe iniciar sesión con Google una vez antes del bootstrap';
  end if;

  if exists (select 1 from public.app_users where user_id = owner_user_id) then
    raise exception 'La cuenta ya tiene un espacio de trabajo configurado';
  end if;

  insert into public.bands (name)
  values ('Cristian Santiago Music')
  returning id into owner_band_id;

  insert into public.app_users (user_id, band_id)
  values (owner_user_id, owner_band_id);

  insert into public.members (
    band_id, name, nickname, is_owner_profile, created_by
  ) values (
    owner_band_id, 'Cristian Santiago', 'Cristian', true, owner_user_id
  ) returning id into owner_member_id;

  insert into public.roles (band_id, name, sort_order, created_by)
  values
    (owner_band_id, 'Voz', 10, owner_user_id),
    (owner_band_id, 'Acordeón', 20, owner_user_id),
    (owner_band_id, 'Caja', 30, owner_user_id),
    (owner_band_id, 'Guacharaca', 40, owner_user_id),
    (owner_band_id, 'Bajo', 50, owner_user_id),
    (owner_band_id, 'Guitarra', 60, owner_user_id),
    (owner_band_id, 'Auxiliar', 70, owner_user_id);

  select id into accordion_role_id
  from public.roles
  where band_id = owner_band_id and name = 'Acordeón';

  insert into public.member_roles (member_id, role_id, band_id)
  values (owner_member_id, accordion_role_id, owner_band_id);

  insert into public.formations (band_id, name, is_default, created_by)
  values (owner_band_id, 'Formación habitual', true, owner_user_id)
  returning id into default_formation_id;

  insert into public.formation_slots (
    formation_id, band_id, role_id, suggested_member_id, sort_order
  ) values (
    default_formation_id, owner_band_id, accordion_role_id, owner_member_id, 20
  );

  insert into public.payment_methods (band_id, name, sort_order)
  values
    (owner_band_id, 'Efectivo', 10),
    (owner_band_id, 'Transferencia bancaria', 20),
    (owner_band_id, 'Nequi', 30),
    (owner_band_id, 'Daviplata', 40);

  insert into public.expense_categories (band_id, name, sort_order)
  values
    (owner_band_id, 'Transporte', 10),
    (owner_band_id, 'Sonido', 20),
    (owner_band_id, 'Alimentación', 30),
    (owner_band_id, 'Hospedaje', 40),
    (owner_band_id, 'Alquiler', 50),
    (owner_band_id, 'Comisión', 60),
    (owner_band_id, 'Otro', 70);

  insert into public.document_sequences (band_id, document_type, next_number)
  values
    (owner_band_id, 'quote', 1),
    (owner_band_id, 'event', 1),
    (owner_band_id, 'collection', 1),
    (owner_band_id, 'payment', 1);
end;
$$;

