-- ============================================================
-- Suscripciones (joaco.org/#/app/suscripciones) · sincronización
-- Pegar entero en Supabase → SQL Editor → Run.
-- Se puede volver a ejecutar sin perder datos.
--
-- Una fila por cuenta con todo su registro en JSON. Cada cuenta solo
-- puede leer y escribir su propia fila (RLS). La columna rev evita que
-- dos dispositivos se pisen: la app solo escribe si rev no ha cambiado.
-- ============================================================

create table if not exists public.sx_store (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data       jsonb       not null,
  rev        bigint      not null default 1,
  updated_at timestamptz not null default now(),
  constraint sx_store_data_is_object check (jsonb_typeof(data) = 'object'),
  constraint sx_store_data_size check (pg_column_size(data) < 2000000)
);

alter table public.sx_store enable row level security;

drop policy if exists sx_store_select on public.sx_store;
drop policy if exists sx_store_insert on public.sx_store;
drop policy if exists sx_store_update on public.sx_store;
drop policy if exists sx_store_delete on public.sx_store;

create policy sx_store_select on public.sx_store for select to authenticated
  using ((select auth.uid()) = user_id);
create policy sx_store_insert on public.sx_store for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy sx_store_update on public.sx_store for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy sx_store_delete on public.sx_store for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.sx_store from anon;
grant select, insert, update, delete on public.sx_store to authenticated;
revoke truncate, references, trigger on public.sx_store from authenticated;

-- Fecha de la última escritura, puesta por el servidor
create or replace function public.sx_store_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists sx_store_touch on public.sx_store;
create trigger sx_store_touch before update on public.sx_store
  for each row execute function public.sx_store_touch();

-- Avisos en directo a los otros dispositivos abiertos (opcional: la app
-- también se pone al día al volver a la pestaña y cada pocos minutos)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables
                     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sx_store') then
    alter publication supabase_realtime add table public.sx_store;
  end if;
end $$;
