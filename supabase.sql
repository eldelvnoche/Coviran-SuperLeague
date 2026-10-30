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


-- =====================================================================
-- FASE 3 · cuentas de jugadores, publicaciones en crónicas, comentarios y fotos
-- Pégalo entero en el SQL Editor y pulsa Run (se puede ejecutar más de una vez).
-- Después ejecuta el archivo "crear-usuarios-superliga.sql" (lo generó Claude en tu Escritorio, NO está en el repo).
-- =====================================================================

-- Cada cuenta de acceso (auth.users) pertenece a un jugador de la liga
create table if not exists jugadores (
  id text primary key check (id ~ '^[a-z]{2}$'),
  usuario text unique not null check (usuario ~ '^[a-z0-9]{3,20}$'),
  user_id uuid unique references auth.users (id) on delete cascade,
  pass_cambiada boolean not null default false
);
alter table jugadores enable row level security;
drop policy if exists "todos ven los jugadores" on jugadores;
create policy "todos ven los jugadores" on jugadores for select to anon, authenticated using (true);

create or replace function mi_jugador() returns text
language sql stable security definer set search_path = public as $$
  select id from jugadores where user_id = auth.uid();
$$;
grant execute on function mi_jugador() to authenticated;

create or replace function marcar_pass_cambiada() returns void
language sql security definer set search_path = public as $$
  update jugadores set pass_cambiada = true where user_id = auth.uid();
$$;
grant execute on function marcar_pass_cambiada() to authenticated;

-- Publicaciones de los jugadores en la pestaña Crónicas
create table if not exists publicaciones (
  id bigint generated always as identity primary key,
  creado timestamptz not null default now(),
  autor text not null references jugadores (id) on delete cascade,
  titulo text not null check (char_length(titulo) between 3 and 90),
  texto text not null check (char_length(texto) between 1 and 4000),
  foto text check (foto is null or foto ~ '^[a-z]{2}/[A-Za-z0-9_.-]{1,80}$'),
  jornada integer check (jornada between 1 and 60),
  oculto boolean not null default false
);
alter table publicaciones enable row level security;
drop policy if exists "ver publicaciones" on publicaciones;
create policy "ver publicaciones" on publicaciones for select to anon, authenticated using (not oculto or es_admin());
drop policy if exists "publicar como jugador" on publicaciones;
create policy "publicar como jugador" on publicaciones for insert to authenticated with check (autor = mi_jugador() and not oculto);
drop policy if exists "borrar la propia o admin" on publicaciones;
create policy "borrar la propia o admin" on publicaciones for delete to authenticated using (autor = mi_jugador() or es_admin());
drop policy if exists "moderar publicaciones" on publicaciones;
create policy "moderar publicaciones" on publicaciones for update to authenticated using (es_admin()) with check (es_admin());

-- Comentarios. "ref" apunta a una crónica del admin ("c:ID") o a una publicación de jugador ("p:ID")
create table if not exists comentarios (
  id bigint generated always as identity primary key,
  creado timestamptz not null default now(),
  autor text not null references jugadores (id) on delete cascade,
  ref text not null check (ref ~ '^[cp]:[0-9]{1,16}$'),
  texto text not null check (char_length(texto) between 1 and 600),
  foto text check (foto is null or foto ~ '^[a-z]{2}/[A-Za-z0-9_.-]{1,80}$'),
  oculto boolean not null default false
);
create index if not exists comentarios_ref on comentarios (ref);
alter table comentarios enable row level security;
drop policy if exists "ver comentarios" on comentarios;
create policy "ver comentarios" on comentarios for select to anon, authenticated using (not oculto or es_admin());
drop policy if exists "comentar como jugador" on comentarios;
create policy "comentar como jugador" on comentarios for insert to authenticated with check (autor = mi_jugador() and not oculto);
drop policy if exists "borrar el propio o admin" on comentarios;
create policy "borrar el propio o admin" on comentarios for delete to authenticated using (autor = mi_jugador() or es_admin());
drop policy if exists "moderar comentarios" on comentarios;
create policy "moderar comentarios" on comentarios for update to authenticated using (es_admin()) with check (es_admin());

-- Freno contra spam: máximo 10 publicaciones y 40 comentarios por hora y jugador
create or replace function limitar_ritmo() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'publicaciones' then
    if (select count(*) from publicaciones where autor = new.autor and creado > now() - interval '1 hour') >= 10 then
      raise exception 'Demasiadas publicaciones seguidas. Espera un rato.';
    end if;
  else
    if (select count(*) from comentarios where autor = new.autor and creado > now() - interval '1 hour') >= 40 then
      raise exception 'Demasiados comentarios seguidos. Espera un rato.';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists limitar_publicaciones on publicaciones;
create trigger limitar_publicaciones before insert on publicaciones for each row execute function limitar_ritmo();
drop trigger if exists limitar_comentarios on comentarios;
create trigger limitar_comentarios before insert on comentarios for each row execute function limitar_ritmo();

-- Fotos: cubo público de lectura. Cada jugador solo puede subir dentro de su carpeta (su id de 2 letras)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos-liga', 'fotos-liga', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 3145728, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "subir foto en mi carpeta" on storage.objects;
create policy "subir foto en mi carpeta" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos-liga' and (storage.foldername(name))[1] = mi_jugador());
drop policy if exists "borrar mi foto o admin" on storage.objects;
create policy "borrar mi foto o admin" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos-liga' and ((storage.foldername(name))[1] = mi_jugador() or es_admin()));


-- =====================================================================
-- AVISOS · notificaciones push (ejecutar DESPUÉS de la parte FASE 3)
-- =====================================================================

-- Dispositivos que han activado los avisos. Nadie puede leerla ni escribirla directamente (sin políticas):
-- solo se usa a través de las funciones de abajo y de la función de envío (que usa la clave de servicio).
create table if not exists suscripciones (
  id bigint generated always as identity primary key,
  creado timestamptz not null default now(),
  endpoint text unique not null check (endpoint ~ '^https://' and char_length(endpoint) <= 700),
  p256dh text not null check (char_length(p256dh) between 60 and 120),
  auth text not null check (char_length(auth) between 10 and 40),
  jugador text references jugadores (id) on delete set null,
  prefs jsonb not null default '{"resultados":true,"cronicas":true,"comentarios":true}'
);
alter table suscripciones enable row level security;

create or replace function suscribir(p_endpoint text, p_p256dh text, p_auth text, p_prefs jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from suscripciones) > 3000 then
    raise exception 'Demasiados dispositivos registrados.';
  end if;
  insert into suscripciones (endpoint, p256dh, auth, jugador, prefs)
  values (p_endpoint, p_p256dh, p_auth, mi_jugador(), coalesce(p_prefs, '{"resultados":true,"cronicas":true,"comentarios":true}'::jsonb))
  on conflict (endpoint) do update
    set p256dh = excluded.p256dh, auth = excluded.auth,
        jugador = coalesce(excluded.jugador, suscripciones.jugador), prefs = excluded.prefs;
end;
$$;
create or replace function desuscribir(p_endpoint text) returns void
language sql security definer set search_path = public as $$
  delete from suscripciones where endpoint = p_endpoint;
$$;
grant execute on function suscribir(text, text, text, jsonb) to anon, authenticated;
grant execute on function desuscribir(text) to anon, authenticated;

-- Aviso automático cuando un jugador publica o comenta: la base de datos llama a la función "enviar-push".
create extension if not exists pg_net;
create table if not exists ajustes (clave text primary key, valor text not null);
alter table ajustes enable row level security;

create or replace function avisar(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare u text; s text;
begin
  select valor into u from ajustes where clave = 'push_url';
  select valor into s from ajustes where clave = 'push_secret';
  if u is null or s is null then return; end if;
  perform net.http_post(url := u, body := p, headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', s));
exception when others then
  null; -- un fallo al avisar nunca debe impedir publicar
end;
$$;

create or replace function avisar_publicacion() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform avisar(jsonb_build_object('tipo', 'cronica', 'autor', new.autor, 'titulo', new.titulo));
  return new;
end;
$$;
drop trigger if exists avisa_publicacion on publicaciones;
create trigger avisa_publicacion after insert on publicaciones for each row execute function avisar_publicacion();

create or replace function avisar_comentario() returns trigger
language plpgsql security definer set search_path = public as $$
declare dueno text;
begin
  if new.ref like 'p:%' then
    select autor into dueno from publicaciones where id = substring(new.ref from 3)::bigint;
    if dueno is not null and dueno <> new.autor then
      perform avisar(jsonb_build_object('tipo', 'comentario', 'autor', new.autor, 'destino', dueno, 'texto', left(new.texto, 120)));
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists avisa_comentario on comentarios;
create trigger avisa_comentario after insert on comentarios for each row execute function avisar_comentario();


-- =====================================================================
-- DIRECTOS · retransmisiones de partidos (ejecutar DESPUÉS de las partes FASE 3 y AVISOS)
-- El jugador emite con YouTube, Twitch o Kick y pega el enlace; la web lo muestra y avisa al resto.
-- =====================================================================
create table if not exists directos (
  id bigint generated always as identity primary key,
  creado timestamptz not null default now(),
  autor text not null references jugadores (id) on delete cascade,
  titulo text not null check (char_length(titulo) between 3 and 90),
  url text not null check (
    url ~ '^https://(www\.|m\.)?youtube\.com/(watch\?v=[A-Za-z0-9_-]{11}|live/[A-Za-z0-9_-]{11})([&?][A-Za-z0-9_=&.%-]*)?$'
    or url ~ '^https://youtu\.be/[A-Za-z0-9_-]{11}([?&][A-Za-z0-9_=&.%-]*)?$'
    or url ~ '^https://(www\.)?(twitch\.tv|kick\.com)/[A-Za-z0-9_-]{3,25}/?$'
  ),
  estado text not null default 'en_directo' check (estado in ('en_directo', 'finalizado')),
  fin timestamptz
);
create index if not exists directos_estado on directos (estado, creado desc);
alter table directos enable row level security;
drop policy if exists "ver directos" on directos;
create policy "ver directos" on directos for select to anon, authenticated using (true);
drop policy if exists "emitir como jugador" on directos;
create policy "emitir como jugador" on directos for insert to authenticated with check (autor = mi_jugador() and estado = 'en_directo');
drop policy if exists "borrar el propio o admin" on directos;
create policy "borrar el propio directo o admin" on directos for delete to authenticated using (autor = mi_jugador() or es_admin());

-- Terminar un directo propio (no se puede editar nada más)
create or replace function finalizar_directo(p_id bigint) returns void
language sql security definer set search_path = public as $$
  update directos set estado = 'finalizado', fin = now()
  where id = p_id and estado = 'en_directo' and (autor = mi_jugador() or es_admin());
$$;
grant execute on function finalizar_directo(bigint) to authenticated;

-- Un jugador solo puede tener un directo activo y máximo 6 por hora; además avisa a los suscritos
create or replace function preparar_directo() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from directos where autor = new.autor and creado > now() - interval '1 hour') >= 6 then
    raise exception 'Demasiados directos seguidos. Espera un rato.';
  end if;
  update directos set estado = 'finalizado', fin = now() where autor = new.autor and estado = 'en_directo';
  return new;
end;
$$;
drop trigger if exists prepara_directo on directos;
create trigger prepara_directo before insert on directos for each row execute function preparar_directo();

create or replace function avisar_directo() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform avisar(jsonb_build_object('tipo', 'directo', 'autor', new.autor, 'titulo', new.titulo));
  return new;
end;
$$;
drop trigger if exists avisa_directo on directos;
create trigger avisa_directo after insert on directos for each row execute function avisar_directo();

-- Canal propio del jugador (Twitch o Kick), para no pegar el enlace cada vez que emite
alter table jugadores add column if not exists canal text check (canal is null or canal ~ '^https://(www\.)?(twitch\.tv|kick\.com)/[A-Za-z0-9_-]{3,25}/?$');
create or replace function guardar_canal(p_url text) returns void
language sql security definer set search_path = public as $$
  update jugadores set canal = nullif(p_url, '') where user_id = auth.uid();
$$;
grant execute on function guardar_canal(text) to authenticated;
