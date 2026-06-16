-- Exclui uma venda e devolve o estoque ao daily_stock
create or replace function public.delete_sale(p_sale_id uuid)
returns void language plpgsql security invoker as $$
declare v_session uuid; v_item record;
begin
  select cash_session_id into v_session from public.sales where id = p_sale_id;
  if v_session is null then raise exception 'Venda não encontrada'; end if;
  for v_item in select product_id, qty from public.sale_items where sale_id = p_sale_id
  loop
    update public.daily_stock set qty_sold = greatest(0, qty_sold - v_item.qty)
      where cash_session_id = v_session and product_id = v_item.product_id;
  end loop;
  delete from public.sales where id = p_sale_id;
end; $$;
