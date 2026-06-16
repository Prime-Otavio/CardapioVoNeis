create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null default current_date,
  category text not null default 'Outros',
  description text,
  amount numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create index expenses_date_idx on public.expenses(expense_date);

alter table public.expenses enable row level security;
create policy "despesas autenticado" on public.expenses for all to authenticated using (true) with check (true);

create or replace function public.financial_result(p_start date, p_end date)
returns table(faturamento numeric, cmv numeric, despesas numeric, lucro numeric)
language plpgsql security invoker as $$
declare v_fat numeric(12,2); v_cmv numeric(12,2); v_desp numeric(12,2);
begin
  select coalesce(sum(s.total),0) into v_fat from public.sales s
    where s.sold_at::date between p_start and p_end;
  select coalesce(sum(si.unit_cost * si.qty),0) into v_cmv
    from public.sale_items si join public.sales s on s.id = si.sale_id
    where s.sold_at::date between p_start and p_end;
  select coalesce(sum(e.amount),0) into v_desp from public.expenses e
    where e.expense_date between p_start and p_end;
  faturamento := v_fat; cmv := v_cmv; despesas := v_desp;
  lucro := v_fat - v_cmv - v_desp;
  return next;
end; $$;
