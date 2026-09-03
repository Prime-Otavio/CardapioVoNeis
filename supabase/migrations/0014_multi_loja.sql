-- Multi-loja.
--
-- Este arquivo ESPELHA o que já foi aplicado direto no projeto Supabase
-- (rvxzddtvxhqomlszchdb) por fora do repositório. Ele existe para que o
-- schema volte a ser reproduzível a partir daqui. Por isso tudo é
-- idempotente: rodar de novo num banco que já tem essas estruturas não
-- deve falhar nem duplicar nada.

create extension if not exists pgcrypto;

create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  address text,
  whatsapp text,
  is_main boolean not null default false,
  active boolean not null default true,
  ifood_merchant_id text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- IDs fixos e legíveis: facilitam SQL manual e o default das colunas abaixo.
insert into stores (id, slug, name, address, whatsapp, is_main, active, sort_order)
values
  ('11111111-1111-4111-8111-111111111111', 'sede', 'Vó Neis — Jardim Sontag',
   'Rua Floriano Peixoto, 3030 — Jardim Sontag', '5511933976800', true, true, 1),
  ('22222222-2222-4222-8222-222222222222', 'centro', 'Vó Neis — Centro',
   'Rua Rui Barbosa, 775 — Centro', null, false, false, 2)
on conflict (id) do nothing;

-- store_id com default na sede: as linhas que já existiam ficam com a Loja 1.
do $$
declare t text;
begin
  foreach t in array array[
    'categories','products','combos','cash_sessions','sales','daily_stock','expenses'
  ] loop
    execute format(
      'alter table %I add column if not exists store_id uuid not null
         default ''11111111-1111-4111-8111-111111111111''
         references stores(id) on delete restrict', t);
    execute format('create index if not exists idx_%1$s_store on %1$I(store_id)', t);
  end loop;
end $$;

-- Um caixa aberto por loja por dia.
create unique index if not exists uq_cash_session_store_date
  on cash_sessions(store_id, business_date);

alter table stores enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'stores' and policyname = 'stores_leitura_publica') then
    create policy stores_leitura_publica on stores for select to anon, authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'stores' and policyname = 'stores_escrita_autenticada') then
    create policy stores_escrita_autenticada on stores for all to authenticated using (true) with check (true);
  end if;
end $$;
