-- Adicionais (caldas, coberturas, recheios) como grupo reutilizável.
--
-- Também um espelho do que já está aplicado no Supabase — idempotente pelo
-- mesmo motivo do 0014.
--
-- O desenho é N:N de propósito: cria-se "Calda" uma vez e pendura-se nas 24
-- fatias de bolo de uma vez, em vez de repetir a mesma configuração produto
-- a produto.

create table if not exists option_groups (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null default '11111111-1111-4111-8111-111111111111'
    references stores(id) on delete cascade,
  name text not null,
  required boolean not null default false,
  min_select int not null default 0,
  max_select int not null default 1,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists options (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references option_groups(id) on delete cascade,
  name text not null,
  extra_price numeric(10,2) not null default 0,
  available boolean not null default true,
  ifood_option_id text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists product_option_groups (
  product_id uuid not null references products(id) on delete cascade,
  group_id uuid not null references option_groups(id) on delete cascade,
  sort_order int not null default 0,
  primary key (product_id, group_id)
);

create index if not exists idx_options_group on options(group_id);
create index if not exists idx_pog_group on product_option_groups(group_id);

alter table option_groups enable row level security;
alter table options enable row level security;
alter table product_option_groups enable row level security;

-- O cardápio público precisa ler os três para montar a escolha do item.
do $$
declare t text;
begin
  foreach t in array array['option_groups','options','product_option_groups'] loop
    if not exists (select 1 from pg_policies where tablename = t and policyname = t || '_leitura_publica') then
      execute format('create policy %I on %I for select to anon, authenticated using (true)', t || '_leitura_publica', t);
    end if;
    if not exists (select 1 from pg_policies where tablename = t and policyname = t || '_escrita_autenticada') then
      execute format('create policy %I on %I for all to authenticated using (true) with check (true)', t || '_escrita_autenticada', t);
    end if;
  end loop;
end $$;
