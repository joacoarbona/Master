-- ============================================================
-- Progreso de apps sincronizado entre dispositivos (public.app_store)
-- Lo usa joaco.org/#/app/documentos (ver supabase/DOCUMENTOS.md).
-- Pegar entero en Supabase → SQL Editor → Run.
-- Se puede volver a ejecutar sin perder datos.
--
-- Una fila por cuenta y app, con su estado en JSON. Cada cuenta solo
-- puede leer y escribir sus propias filas (RLS). La columna rev evita
-- que dos dispositivos se pisen: la app solo escribe si rev no ha cambiado.
-- ============================================================

create table if not exists public.app_store (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  app        text        not null,
  data       jsonb       not null,
  rev        bigint      not null default 1,
  updated_at timestamptz not null default now(),
  primary key (user_id, app),
  constraint app_store_app_name check (app ~ '^[a-z0-9-]{1,40}$'),
  constraint app_store_data_is_object check (jsonb_typeof(data) = 'object'),
  constraint app_store_data_size check (pg_column_size(data) < 2000000)
);

alter table public.app_store enable row level security;

drop policy if exists app_store_select on public.app_store;
drop policy if exists app_store_insert on public.app_store;
drop policy if exists app_store_update on public.app_store;
drop policy if exists app_store_delete on public.app_store;

create policy app_store_select on public.app_store for select to authenticated
  using ((select auth.uid()) = user_id);
create policy app_store_insert on public.app_store for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy app_store_update on public.app_store for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy app_store_delete on public.app_store for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.app_store from anon;
grant select, insert, update, delete on public.app_store to authenticated;
revoke truncate, references, trigger on public.app_store from authenticated;

-- Fecha de la última escritura, puesta por el servidor
create or replace function public.app_store_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists app_store_touch on public.app_store;
create trigger app_store_touch before update on public.app_store
  for each row execute function public.app_store_touch();

-- Avisos en directo a los otros dispositivos abiertos (opcional: la app
-- también se pone al día al volver a la pestaña y cada cinco minutos)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables
                     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'app_store') then
    alter publication supabase_realtime add table public.app_store;
  end if;
end $$;
