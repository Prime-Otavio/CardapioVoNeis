import { supabase } from './supabase'

// Retorna a sessão de caixa de hoje (ou null se ainda não foi aberta)
export async function getTodaySession() {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('cash_sessions')
    .select('*')
    .eq('business_date', today)
    .maybeSingle()
  if (error) throw error
  return data
}

// Abre o caixa de hoje com os produtos escolhidos.
// items: [{ product_id, qty_initial }]
export async function openCash(items) {
  const today = new Date().toISOString().slice(0, 10)

  const { data: session, error: sErr } = await supabase
    .from('cash_sessions')
    .insert({ business_date: today, status: 'aberto' })
    .select()
    .single()
  if (sErr) throw sErr

  if (items.length) {
    const rows = items.map((it) => ({
      cash_session_id: session.id,
      business_date: today,
      product_id: it.product_id,
      qty_initial: it.qty_initial,
      qty_sold: 0,
    }))
    const { error: dErr } = await supabase.from('daily_stock').insert(rows)
    if (dErr) throw dErr
  }
  return session
}

// Fecha a sessão de caixa
export async function closeCash(sessionId) {
  const { error } = await supabase
    .from('cash_sessions')
    .update({ status: 'fechado', closed_at: new Date().toISOString() })
    .eq('id', sessionId)
  if (error) throw error
}

// Lista os produtos do dia (estoque) de uma sessão, com nome/preço do produto
export async function listDailyStock(sessionId) {
  const { data, error } = await supabase
    .from('daily_stock')
    .select('*, products(name, price, cost)')
    .eq('cash_session_id', sessionId)
    .order('created_at')
  if (error) throw error
  return data
}
