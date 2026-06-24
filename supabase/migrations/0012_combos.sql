create table public.combos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  image_url text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.combo_items (
  id uuid primary key default gen_random_uuid(),
  combo_id uuid not null references public.combos(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity int not null default 1
);

create index combo_items_combo_idx on public.combo_items(combo_id);

alter table public.combos enable row level security;
alter table public.combo_items enable row level security;

create policy "combos leitura" on public.combos for select to anon, authenticated using (true);
create policy "combos escrita" on public.combos for all to authenticated using (true) with check (true);
create policy "combo_items leitura" on public.combo_items for select to anon, authenticated using (true);
create policy "combo_items escrita" on public.combo_items for all to authenticated using (true) with check (true);
