import { supabase } from './supabase'

export const EXPENSE_CATEGORIES = [
  'Ingredientes',
  'Gás',
  'Embalagem',
  'Marketing',
  'Aluguel',
  'Equipamento',
  'Transporte',
  'Outros',
]

// Intervalo do mês (yyyy-mm) -> { start, end } em yyyy-mm-dd
export function monthRange(ym) {
  const [y, m] = ym.split('-').map(Number)
  const start = `${ym}-01`
  const lastDay = new Date(y, m, 0).getDate()
  const end = `${ym}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

export async function listExpenses(start, end) {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .gte('expense_date', start)
    .lte('expense_date', end)
    .order('expense_date', { ascending: false })
  if (error) throw error
  return data
}

export async function addExpense(expense) {
  const { error } = await supabase.from('expenses').insert(expense)
  if (error) throw error
}

export async function updateExpense(id, fields) {
  const { error } = await supabase.from('expenses').update(fields).eq('id', id)
  if (error) throw error
}

export async function deleteExpense(id) {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}

// Resultado financeiro do período (usa a função do banco)
export async function financialResult(start, end) {
  const { data, error } = await supabase.rpc('financial_result', { p_start: start, p_end: end })
  if (error) throw error
  const r = Array.isArray(data) ? data[0] : data
  return {
    faturamento: Number(r?.faturamento ?? 0),
    cmv: Number(r?.cmv ?? 0),
    despesas: Number(r?.despesas ?? 0),
    lucro: Number(r?.lucro ?? 0),
  }
}
