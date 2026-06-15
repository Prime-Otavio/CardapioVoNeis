-- Campos de abertura e fechamento na sessão de caixa
alter table public.cash_sessions
  add column if not exists opening_float numeric(10,2) not null default 0,
  add column if not exists counted_cash numeric(10,2),
  add column if not exists closing_diff numeric(10,2),
  add column if not exists closing_notes text;

-- Sangrias / retiradas durante o dia
create table public.cash_withdrawals (
  id uuid primary key default gen_random_uuid(),
  cash_session_id uuid not null references public.cash_sessions(id) on delete cascade,
  amount numeric(10,2) not null,
  reason text,
  created_at timestamptz not null default now()
);

create index cash_withdrawals_session_idx on public.cash_withdrawals(cash_session_id);

alter table public.cash_withdrawals enable row level security;
create policy "sangrias autenticado" on public.cash_withdrawals for all to authenticated using (true) with check (true);
