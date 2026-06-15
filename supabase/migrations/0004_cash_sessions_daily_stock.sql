-- Sessão de caixa: uma por dia (status aberto/fechado)
create table public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  business_date date not null default current_date,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  status text not null default 'aberto' check (status in ('aberto','fechado')),
  notes text
);

create unique index cash_sessions_business_date_idx on public.cash_sessions(business_date);

-- Estoque do dia: quanto de cada produto foi feito e vendido naquele dia
create table public.daily_stock (
  id uuid primary key default gen_random_uuid(),
  cash_session_id uuid not null references public.cash_sessions(id) on delete cascade,
  business_date date not null default current_date,
  product_id uuid not null references public.products(id) on delete cascade,
  qty_initial int not null default 0,
  qty_sold int not null default 0,
  created_at timestamptz not null default now()
);

create index daily_stock_session_idx on public.daily_stock(cash_session_id);
create unique index daily_stock_session_product_idx on public.daily_stock(cash_session_id, product_id);

alter table public.cash_sessions enable row level security;
alter table public.daily_stock enable row level security;

create policy "leitura caixa autenticado" on public.cash_sessions for select to authenticated using (true);
create policy "escrita caixa autenticado" on public.cash_sessions for all to authenticated using (true) with check (true);

create policy "leitura estoque autenticado" on public.daily_stock for select to authenticated using (true);
create policy "escrita estoque autenticado" on public.daily_stock for all to authenticated using (true) with check (true);
