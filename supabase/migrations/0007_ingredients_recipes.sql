-- Ingredientes / insumos
create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  purchase_unit text not null default 'pacote',
  purchase_price numeric(10,2) not null default 0,
  purchase_qty numeric(12,3) not null default 1,
  base_unit text not null default 'g',
  created_at timestamptz not null default now()
);

alter table public.ingredients
  add column cost_per_base_unit numeric(14,6)
  generated always as (
    case when purchase_qty > 0 then purchase_price / purchase_qty else 0 end
  ) stored;

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  quantity numeric(12,3) not null default 0
);

create index recipes_product_idx on public.recipes(product_id);
create unique index recipes_product_ingredient_idx on public.recipes(product_id, ingredient_id);

alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;

create policy "ingredientes autenticado" on public.ingredients for all to authenticated using (true) with check (true);
create policy "ingredientes leitura" on public.ingredients for select to anon, authenticated using (true);
create policy "receitas autenticado" on public.recipes for all to authenticated using (true) with check (true);
create policy "receitas leitura" on public.recipes for select to anon, authenticated using (true);

create or replace function public.recalc_product_cost(p_product_id uuid)
returns numeric language plpgsql security invoker as $$
declare v_cost numeric(10,2);
begin
  select coalesce(sum(r.quantity * i.cost_per_base_unit), 0) into v_cost
  from public.recipes r join public.ingredients i on i.id = r.ingredient_id
  where r.product_id = p_product_id;
  update public.products set cost = round(v_cost, 2) where id = p_product_id;
  return v_cost;
end; $$;

create or replace function public.recalc_products_by_ingredient(p_ingredient_id uuid)
returns void language plpgsql security invoker as $$
declare r record;
begin
  for r in select distinct product_id from public.recipes where ingredient_id = p_ingredient_id
  loop perform public.recalc_product_cost(r.product_id); end loop;
end; $$;
