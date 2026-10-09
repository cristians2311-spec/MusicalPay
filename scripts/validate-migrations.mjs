import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";

import { PGlite } from "@electric-sql/pglite";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const migrationsDirectory = join(projectRoot, "supabase", "migrations");

const supabaseStubs = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;

  create schema auth;
  create table auth.users (
    id uuid primary key,
    email text unique
  );
  create function auth.uid()
  returns uuid
  language sql
  stable
  as $$ select null::uuid $$;

  create schema storage;
  create table storage.buckets (
    id text primary key,
    name text not null,
    public boolean not null default false,
    file_size_limit bigint,
    allowed_mime_types text[]
  );
  create table storage.objects (
    id bigint generated always as identity primary key,
    bucket_id text not null references storage.buckets(id),
    name text not null
  );
  create function storage.foldername(object_name text)
  returns text[]
  language sql
  immutable
  as $$
    select regexp_split_to_array(trim(both '/' from object_name), '/')
  $$;
`;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const database = new PGlite();

try {
  await database.exec(supabaseStubs);

  const migrationFiles = (await readdir(migrationsDirectory))
    .filter((name) => name.endsWith(".sql"))
    .toSorted();

  for (const migrationFile of migrationFiles) {
    const sql = await readFile(join(migrationsDirectory, migrationFile), "utf8");
    try {
      await database.exec(sql);
      process.stdout.write(`✓ ${migrationFile}\n`);
    } catch (error) {
      error.message = `Falló ${migrationFile}: ${error.message}`;
      throw error;
    }
  }

  const publicTables = await database.query(`
    select count(*)::integer as count
    from pg_class relation
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public' and relation.relkind = 'r'
  `);
  assert(publicTables.rows[0].count === 36, "Se esperaban 36 tablas de negocio");

  const tablesWithoutRls = await database.query(`
    select relation.relname as table_name
    from pg_class relation
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relkind = 'r'
      and not relation.relrowsecurity
  `);
  assert(tablesWithoutRls.rows.length === 0, "Todas las tablas públicas deben tener RLS");

  const crossBandForeignKeys = await database.query(`
    select count(*)::integer as count
    from pg_constraint
    where contype = 'f' and conname like '%_band_fkey'
  `);
  assert(
    crossBandForeignKeys.rows[0].count >= 45,
    "Faltan claves foráneas compuestas para conservar el límite de agrupación",
  );

  const immutableTriggers = await database.query(`
    select count(*)::integer as count
    from pg_trigger
    where not tgisinternal and tgname like '%_immutable'
  `);
  assert(immutableTriggers.rows[0].count === 6, "Faltan protecciones de historial financiero");

  const policyCount = await database.query(`
    select count(*)::integer as count from pg_policy
  `);
  assert(policyCount.rows[0].count >= 70, "La cobertura RLS es menor que la esperada");

  const exposedSecurityDefiners = await database.query(`
    select namespace.nspname, procedure.proname
    from pg_proc procedure
    join pg_namespace namespace on namespace.oid = procedure.pronamespace
    join information_schema.routine_privileges privilege
      on privilege.specific_schema = namespace.nspname
      and privilege.routine_name = procedure.proname
    where procedure.prosecdef
      and privilege.grantee in ('PUBLIC', 'anon')
  `);
  assert(
    exposedSecurityDefiners.rows.length === 0,
    "Una función SECURITY DEFINER quedó ejecutable por PUBLIC o anon",
  );

  process.stdout.write(
    `Migraciones válidas: ${publicTables.rows[0].count} tablas, ` +
      `${policyCount.rows[0].count} políticas RLS y ` +
      `${crossBandForeignKeys.rows[0].count} relaciones con límite de agrupación.\n`,
  );
} finally {
  await database.close();
}

