-- Vendas
create table public.sales (
  id uuid primary key default gen_random_uuid(),
  cash_session_id uuid not null references public.cash_sessions(id) on delete cascade,
  sold_at timestamptz not null default now(),
  total numeric(10,2) not null default 0,
  payment_method text not null check (payment_method in ('dinheiro','pix','debito','credito')),
  channel text not null default 'balcao'
);

create index sales_session_idx on public.sales(cash_session_id);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  qty int not null,
  unit_price numeric(10,2) not null,
  unit_cost numeric(10,2) not null default 0
);

create index sale_items_sale_idx on public.sale_items(sale_id);

alter table public.sales enable row level security;
alter table public.sale_items enable row level security;

create policy "vendas autenticado" on public.sales for all to authenticated using (true) with check (true);
create policy "itens venda autenticado" on public.sale_items for all to authenticated using (true) with check (true);

-- Função atômica: registra a venda, seus itens e baixa o estoque do dia.
create or replace function public.register_sale(
  p_session_id uuid,
  p_payment_method text,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_sale_id uuid;
  v_total numeric(10,2) := 0;
  v_item jsonb;
  v_product_id uuid;
  v_qty int;
  v_price numeric(10,2);
  v_cost numeric(10,2);
  v_resta int;
begin
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'qty')::int;
    select (qty_initial - qty_sold) into v_resta
    from public.daily_stock
    where cash_session_id = p_session_id and product_id = v_product_id;
    if v_resta is null then
      raise exception 'Produto % não está no caixa de hoje', v_product_id;
    end if;
    if v_resta < v_qty then
      raise exception 'Estoque insuficiente para o produto % (resta %, pedido %)', v_product_id, v_resta, v_qty;
    end if;
  end loop;

  insert into public.sales (cash_session_id, payment_method, total)
  values (p_session_id, p_payment_method, 0)
  returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'qty')::int;
    select price, cost into v_price, v_cost from public.products where id = v_product_id;
    insert into public.sale_items (sale_id, product_id, qty, unit_price, unit_cost)
    values (v_sale_id, v_product_id, v_qty, coalesce(v_price,0), coalesce(v_cost,0));
    v_total := v_total + coalesce(v_price,0) * v_qty;
    update public.daily_stock
    set qty_sold = qty_sold + v_qty
    where cash_session_id = p_session_id and product_id = v_product_id;
  end loop;

  update public.sales set total = v_total where id = v_sale_id;
  return v_sale_id;
end;
$$;
