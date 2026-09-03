import { supabase } from './supabase'

// Grupos de adicionais da loja, já com as opções de cada um.
export async function listOptionGroups(storeId) {
  const { data, error } = await supabase
    .from('option_groups')
    .select('*, options(*)')
    .eq('store_id', storeId)
    .order('sort_order')
  if (error) throw error
  return (data ?? []).map((g) => ({
    ...g,
    options: [...(g.options ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  }))
}

export async function saveOptionGroup(group) {
  const { id, options: _ignored, ...fields } = group
  const query = id
    ? supabase.from('option_groups').update(fields).eq('id', id)
    : supabase.from('option_groups').insert(fields)
  const { error } = await query
  if (error) throw error
}

export async function deleteOptionGroup(id) {
  const { error } = await supabase.from('option_groups').delete().eq('id', id)
  if (error) throw error
}

export async function saveOption(option) {
  const { id, ...fields } = option
  const query = id
    ? supabase.from('options').update(fields).eq('id', id)
    : supabase.from('options').insert(fields)
  const { error } = await query
  if (error) throw error
}

export async function deleteOption(id) {
  const { error } = await supabase.from('options').delete().eq('id', id)
  if (error) throw error
}

// Vínculos produto ↔ grupo, no formato { [product_id]: [group_id, ...] }.
export async function listProductGroupLinks() {
  const { data, error } = await supabase.from('product_option_groups').select('*')
  if (error) throw error
  const mapa = {}
  ;(data ?? []).forEach((v) => {
    ;(mapa[v.product_id] ||= []).push(v.group_id)
  })
  return mapa
}

// Regrava os grupos de um produto (apaga e insere — são poucas linhas).
export async function setProductGroups(productId, groupIds) {
  const del = await supabase.from('product_option_groups').delete().eq('product_id', productId)
  if (del.error) throw del.error
  if (!groupIds.length) return
  const { error } = await supabase
    .from('product_option_groups')
    .insert(groupIds.map((g, i) => ({ product_id: productId, group_id: g, sort_order: i })))
  if (error) throw error
}

// Aplica o mesmo conjunto de grupos a vários produtos de uma vez.
// É o que torna o desenho N:N útil: "Calda" nas 24 fatias num clique.
export async function applyGroupsToProducts(productIds, groupIds) {
  if (!productIds.length) return
  const del = await supabase.from('product_option_groups').delete().in('product_id', productIds)
  if (del.error) throw del.error
  if (!groupIds.length) return
  const linhas = productIds.flatMap((pid) =>
    groupIds.map((g, i) => ({ product_id: pid, group_id: g, sort_order: i })),
  )
  const { error } = await supabase.from('product_option_groups').insert(linhas)
  if (error) throw error
}
