-- Categorias do cardápio
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Produtos
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  price numeric(10,2) not null default 0,
  cost numeric(10,2) not null default 0,
  unit text not null default 'fatia',
  image_url text,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index products_category_id_idx on public.products(category_id);

-- Liga RLS
alter table public.categories enable row level security;
alter table public.products enable row level security;

-- Cardápio público: qualquer um pode LER (anon + autenticado).
create policy "leitura publica categorias"
  on public.categories for select
  to anon, authenticated using (true);

create policy "leitura publica produtos"
  on public.products for select
  to anon, authenticated using (true);

-- Escrita: somente usuários autenticados (o dono logado no /admin).
create policy "escrita autenticada categorias"
  on public.categories for all
  to authenticated using (true) with check (true);

create policy "escrita autenticada produtos"
  on public.products for all
  to authenticated using (true) with check (true);
