import { supabase } from './supabase'

// Fila de mudanças que ainda não foram refletidas no iFood (migration 0015).
// Quem enche a fila é trigger no banco: mudou price / sold_out / on_menu, entra.

export async function listQueue(storeId) {
  let q = supabase
    .from('ifood_queue')
    .select('*')
    .eq('status', 'pendente')
    .order('created_at', { ascending: false })
  if (storeId) q = q.eq('store_id', storeId)
  const { data, error } = await q
  if (error) return []
  return data ?? []
}

// "Já ajustei na mão": marca como sincronizado sem tocar no iFood.
export async function clearQueue(storeId) {
  let q = supabase
    .from('ifood_queue')
    .update({ status: 'sincronizado', synced_at: new Date().toISOString() })
    .eq('status', 'pendente')
  if (storeId) q = q.eq('store_id', storeId)
  const { error } = await q
  if (error) throw error
}

// Edge Function ifood-sync: verify_jwt=true, roda com o token do usuário
// logado (respeita RLS). As credenciais do iFood ficam nos secrets do
// Supabase — nada disso pode vir para o front.
export async function callIfoodSync(body) {
  const { data, error } = await supabase.functions.invoke('ifood-sync', { body })
  if (error) {
    // A função devolve o corpo cru do iFood em `detalhe`; tenta preservar.
    let detalhe = null
    try {
      detalhe = await error.context?.json?.()
    } catch {
      detalhe = null
    }
    return detalhe ?? { ok: false, erro: error.message }
  }
  return data
}

export const ROTULO_CAMPO = {
  preco: 'Preço',
  esgotado: 'Disponibilidade',
  no_cardapio: 'No cardápio',
  adicional: 'Adicional',
  preco_adicional: 'Preço do adicional',
}

export function valorLegivel(campo, valor, brl) {
  if (campo === 'preco' || campo === 'preco_adicional') return brl(Number(valor) || 0)
  const sim = valor === 'true' || valor === true
  if (campo === 'esgotado') return sim ? 'esgotado' : 'disponível'
  return sim ? 'sim' : 'não'
}
