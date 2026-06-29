import { supabase } from './supabase'
import { hojeLocal } from '../utils'

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

// Datas utilitárias (yyyy-mm-dd), no fuso do Brasil
export function daysAgo(n) {
  // parte de "hoje no Brasil" e subtrai n dias (meio-dia evita pulo de fuso)
  const [y, m, d] = hojeLocal().split('-').map(Number)
  const base = new Date(y, m - 1, d, 12, 0, 0)
  base.setDate(base.getDate() - n)
  const yy = base.getFullYear()
  const mm = String(base.getMonth() + 1).padStart(2, '0')
  const dd = String(base.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}
export function today() {
  return hojeLocal()
}
