import { supabase } from './supabase'

// Adicionais (migration 0018): option_groups -> options, ligados aos produtos
// por product_option_groups (N:N). Grupo é por loja; opção pertence ao grupo.

export async function fetchOptionsData(storeId) {
  const grupos = supabase.from('option_groups').select('*').order('sort_order')
  const { data: g, error: eg } = await (storeId ? grupos.eq('store_id', storeId) : grupos)
  if (eg) return { grupos: [], opcoes: [], vinculos: [] }

  const ids = (g ?? []).map((x) => x.id)
  const [{ data: o }, { data: v }] = await Promise.all([
    ids.length
      ? supabase.from('options').select('*').in('group_id', ids).order('sort_order')
      : Promise.resolve({ data: [] }),
    ids.length
      ? supabase.from('product_option_groups').select('*').in('group_id', ids)
      : Promise.resolve({ data: [] }),
  ])
  return { grupos: g ?? [], opcoes: o ?? [], vinculos: v ?? [] }
}

export async function createGroup({ storeId, name, maxSelect, sortOrder }) {
  const { error } = await supabase.from('option_groups').insert({
    ...(storeId ? { store_id: storeId } : {}),
    name,
    max_select: maxSelect,
    sort_order: sortOrder,
  })
  if (error) throw error
}

export async function deleteGroup(id) {
  const { error } = await supabase.from('option_groups').delete().eq('id', id)
  if (error) throw error
}

export async function createOption({ groupId, name, extraPrice, sortOrder }) {
  const { error } = await supabase
    .from('options')
    .insert({ group_id: groupId, name, extra_price: extraPrice, sort_order: sortOrder })
  if (error) throw error
}

export async function deleteOption(id) {
  const { error } = await supabase.from('options').delete().eq('id', id)
  if (error) throw error
}

// Desligar uma opção sozinha é a ação do meio do dia ("acabou a calda de ninho").
export async function setOptionAvailable(id, available) {
  const { error } = await supabase.from('options').update({ available }).eq('id', id)
  if (error) throw error
}

// Substitui os grupos de um produto pelos informados (ordem = ordem do array).
export async function setProductGroups(productId, groupIds) {
  await supabase.from('product_option_groups').delete().eq('product_id', productId)
  if (!groupIds.length) return
  const { error } = await supabase.from('product_option_groups').insert(
    groupIds.map((g, i) => ({ product_id: productId, group_id: g, sort_order: i }))
  )
  if (error) throw error
}

// Aplica o mesmo conjunto de grupos a todos os produtos informados,
// substituindo o que eles tinham.
export async function applyGroupsToProducts(productIds, groupIds) {
  if (!productIds.length) return
  await supabase.from('product_option_groups').delete().in('product_id', productIds)
  if (!groupIds.length) return
  const linhas = productIds.flatMap((pid) =>
    groupIds.map((g, i) => ({ product_id: pid, group_id: g, sort_order: i }))
  )
  const { error } = await supabase.from('product_option_groups').insert(linhas)
  if (error) throw error
}
