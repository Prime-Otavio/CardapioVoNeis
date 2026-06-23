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

// Abre o caixa de hoje com os produtos escolhidos e o troco inicial.
// items: [{ product_id, qty_initial }] · openingFloat: número
export async function openCash(items, openingFloat = 0) {
  const today = new Date().toISOString().slice(0, 10)

  const { data: session, error: sErr } = await supabase
    .from('cash_sessions')
    .insert({ business_date: today, status: 'aberto', opening_float: openingFloat })
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

// Fecha a sessão de caixa com a conferência do dinheiro.
// countedCash = quanto foi contado na gaveta; diff = contado - esperado.
export async function closeCash(sessionId, { countedCash = null, diff = null, notes = null } = {}) {
  const { error } = await supabase
    .from('cash_sessions')
    .update({
      status: 'fechado',
      closed_at: new Date().toISOString(),
      counted_cash: countedCash,
      closing_diff: diff,
      closing_notes: notes,
    })
    .eq('id', sessionId)
  if (error) throw error
}

// Reabre uma sessão fechada (caso tenha fechado sem querer)
export async function reopenCash(sessionId) {
  const { error } = await supabase
    .from('cash_sessions')
    .update({ status: 'aberto', closed_at: null })
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

// Ajusta a quantidade produzida (qty_initial) de um item do estoque do dia
export async function updateStockQty(stockId, qtyInitial) {
  const { error } = await supabase
    .from('daily_stock')
    .update({ qty_initial: qtyInitial })
    .eq('id', stockId)
  if (error) throw error
}

// Sangrias / retiradas
export async function addWithdrawal(sessionId, amount, reason) {
  const { error } = await supabase
    .from('cash_withdrawals')
    .insert({ cash_session_id: sessionId, amount, reason })
  if (error) throw error
}

export async function listWithdrawals(sessionId) {
  const { data, error } = await supabase
    .from('cash_withdrawals')
    .select('*')
    .eq('cash_session_id', sessionId)
    .order('created_at')
  if (error) throw error
  return data
}
