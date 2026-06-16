import { supabase } from './supabase'

export const PAYMENT_METHODS = [
  { id: 'dinheiro', label: 'Dinheiro' },
  { id: 'pix', label: 'Pix' },
  { id: 'debito', label: 'Débito' },
  { id: 'credito', label: 'Crédito' },
]

// Registra uma venda de forma atômica (cria venda + itens + baixa estoque).
// items: [{ product_id, qty }]
export async function registerSale(sessionId, paymentMethod, items) {
  const { data, error } = await supabase.rpc('register_sale', {
    p_session_id: sessionId,
    p_payment_method: paymentMethod,
    p_items: items,
  })
  if (error) throw error
  return data // id da venda
}

// Exclui uma venda e devolve o estoque
export async function deleteSale(saleId) {
  const { error } = await supabase.rpc('delete_sale', { p_sale_id: saleId })
  if (error) throw error
}

// Lista as vendas de uma sessão de caixa, com itens
export async function listSales(sessionId) {
  const { data, error } = await supabase
    .from('sales')
    .select('*, sale_items(qty, unit_price, unit_cost, products(name))')
    .eq('cash_session_id', sessionId)
    .order('sold_at', { ascending: false })
  if (error) throw error
  return data
}

// Calcula os totais do dia a partir das vendas
export function computeTotals(sales) {
  const faturamento = sales.reduce((s, v) => s + Number(v.total), 0)
  const custo = sales.reduce(
    (s, v) =>
      s + (v.sale_items ?? []).reduce((si, it) => si + Number(it.unit_cost) * it.qty, 0),
    0
  )
  const lucro = faturamento - custo
  const nVendas = sales.length
  const ticket = nVendas ? faturamento / nVendas : 0
  return { faturamento, custo, lucro, nVendas, ticket }
}
