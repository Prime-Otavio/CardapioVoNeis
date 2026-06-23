import { supabase } from './supabase'

export async function reportDaily(start, end) {
  const { data, error } = await supabase.rpc('report_daily', { p_start: start, p_end: end })
  if (error) throw error
  return (data ?? []).map((r) => ({
    dia: r.dia,
    faturamento: Number(r.faturamento),
    lucro: Number(r.lucro),
    vendas: Number(r.vendas),
  }))
}

export async function reportTopProducts(start, end, limit = 8) {
  const { data, error } = await supabase.rpc('report_top_products', {
    p_start: start,
    p_end: end,
    p_limit: limit,
  })
  if (error) throw error
  return (data ?? []).map((r) => ({
    produto: r.produto,
    qtd: Number(r.qtd),
    faturamento: Number(r.faturamento),
  }))
}

export async function reportByPayment(start, end) {
  const { data, error } = await supabase.rpc('report_by_payment', { p_start: start, p_end: end })
  if (error) throw error
  return (data ?? []).map((r) => ({ forma: r.forma, total: Number(r.total) }))
}

// Datas utilitárias (yyyy-mm-dd)
export function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}
export function today() {
  return new Date().toISOString().slice(0, 10)
}
