create or replace function public.report_daily(p_start date, p_end date)
returns table(dia date, faturamento numeric, lucro numeric, vendas bigint)
language sql security invoker as $$
  select s.sold_at::date as dia,
    coalesce(sum(s.total),0) as faturamento,
    coalesce(sum(s.total),0) - coalesce(sum(
      (select sum(si.unit_cost * si.qty) from public.sale_items si where si.sale_id = s.id)
    ),0) as lucro,
    count(*) as vendas
  from public.sales s
  where s.sold_at::date between p_start and p_end
  group by s.sold_at::date order by s.sold_at::date;
$$;

create or replace function public.report_top_products(p_start date, p_end date, p_limit int default 8)
returns table(produto text, qtd bigint, faturamento numeric)
language sql security invoker as $$
  select p.name as produto, sum(si.qty) as qtd, sum(si.unit_price * si.qty) as faturamento
  from public.sale_items si
  join public.sales s on s.id = si.sale_id
  join public.products p on p.id = si.product_id
  where s.sold_at::date between p_start and p_end
  group by p.name order by qtd desc limit p_limit;
$$;

create or replace function public.report_by_payment(p_start date, p_end date)
returns table(forma text, total numeric)
language sql security invoker as $$
  select s.payment_method as forma, sum(s.total) as total
  from public.sales s
  where s.sold_at::date between p_start and p_end
  group by s.payment_method;
$$;
