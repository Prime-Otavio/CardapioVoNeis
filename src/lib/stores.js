import { supabase } from './supabase'

// Id fixo da sede, igual ao default das colunas store_id no banco.
// Serve de rede de segurança quando a tabela stores ainda não respondeu.
export const SEDE_ID = '11111111-1111-4111-8111-111111111111'

export async function listStores({ onlyActive = false } = {}) {
  let q = supabase.from('stores').select('*').order('sort_order')
  if (onlyActive) q = q.eq('active', true)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

export async function getStoreBySlug(slug) {
  const { data, error } = await supabase.from('stores').select('*').eq('slug', slug).maybeSingle()
  if (error) throw error
  return data
}

export async function updateStore(id, fields) {
  const { error } = await supabase.from('stores').update(fields).eq('id', id)
  if (error) throw error
}

// Qual loja o cardápio público deve mostrar.
// Ordem: ?loja=<slug> na URL > VITE_STORE_SLUG > primeira loja ativa > sede.
// O parâmetro da URL vence até para loja inativa — é assim que dá para
// conferir a Loja 2 antes de inaugurar.
export async function resolvePublicStore(search = '') {
  const slug = new URLSearchParams(search).get('loja') || import.meta.env.VITE_STORE_SLUG
  if (slug) {
    const s = await getStoreBySlug(slug)
    if (s) return s
  }
  const ativas = await listStores({ onlyActive: true })
  return ativas.find((s) => s.is_main) ?? ativas[0] ?? null
}
