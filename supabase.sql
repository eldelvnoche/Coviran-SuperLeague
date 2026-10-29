-- Base de datos de la Superliga Covirán (Supabase, plan gratuito).
-- Cómo usarlo:
--   1. Crea un proyecto en https://supabase.com
--   2. Abre "SQL Editor", pega este archivo entero y pulsa "Run".
--   3. Cambia el correo de la última línea por el tuyo y vuelve a ejecutar esa línea.
--   4. En Authentication > Users > "Add user" crea tu usuario con ese mismo correo y una contraseña.
--   5. En Authentication > Sign In / Providers desactiva "Allow new users to sign up".
--   6. En Project Settings > API copia la "Project URL" y la clave "anon" o "publishable"
--      y pégalas en config.json (supabase.url y supabase.anonKey). Esa clave es pública: no pasa nada por subirla.

-- Quién puede ver y gestionar las inscripciones desde el admin
create table if not exists admins (
  email text primary key
);
alter table admins enable row level security;

create or replace function es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where email = auth.jwt() ->> 'email');
$$;

-- Inscripciones para participar en la liga
create table if not exists inscripciones (
  id bigint generated always as identity primary key,
  creado timestamptz not null default now(),
  nombre text not null check (char_length(nombre) between 2 and 60),
  usuario text not null check (char_length(usuario) between 2 and 40),
  equipo text check (char_length(equipo) <= 40),
  contacto text not null check (char_length(contacto) between 3 and 80),
  mensaje text check (char_length(mensaje) <= 400),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aceptado', 'rechazado'))
);
alter table inscripciones enable row level security;

drop policy if exists "cualquiera puede inscribirse" on inscripciones;
create policy "cualquiera puede inscribirse" on inscripciones
  for insert to anon, authenticated with check (estado = 'pendiente');
drop policy if exists "solo admins leen" on inscripciones;
create policy "solo admins leen" on inscripciones
  for select to authenticated using (es_admin());
drop policy if exists "solo admins cambian" on inscripciones;
create policy "solo admins cambian" on inscripciones
  for update to authenticated using (es_admin()) with check (es_admin());
drop policy if exists "solo admins borran" on inscripciones;
create policy "solo admins borran" on inscripciones
  for delete to authenticated using (es_admin());

-- Visitas por día (la web cuenta una por navegador y día)
create table if not exists visitas (
  dia date primary key,
  n integer not null default 0
);
alter table visitas enable row level security;
drop policy if exists "solo admins ven el detalle" on visitas;
create policy "solo admins ven el detalle" on visitas
  for select to authenticated using (es_admin());

create or replace function sumar_visita() returns bigint
language plpgsql security definer set search_path = public as $$
begin
  insert into visitas (dia, n) values (current_date, 1)
  on conflict (dia) do update set n = visitas.n + 1;
  return (select coalesce(sum(n), 0) from visitas);
end;
$$;

create or replace function total_visitas() returns bigint
language sql stable security definer set search_path = public as $$
  select coalesce(sum(n), 0) from visitas;
$$;

grant execute on function sumar_visita() to anon, authenticated;
grant execute on function total_visitas() to anon, authenticated;

-- Pon aquí tu correo (el mismo del usuario que crees en el paso 4)
insert into admins (email) values ('tu-correo@ejemplo.com') on conflict do nothing;
