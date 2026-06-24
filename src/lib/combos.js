import { supabase } from './supabase'

// Lista combos com seus itens (para painel e cardápio)
export async function listCombos({ onlyActive = false } = {}) {
  let q = supabase
    .from('combos')
    .select('*, combo_items(quantity, product_id, products(name))')
    .order('sort_order')
  if (onlyActive) q = q.eq('active', true)
  const { data, error } = await q
  if (error) throw error
  return data
}

// Salva um combo inteiro: dados + itens (apaga e regrava os itens)
export async function saveCombo(combo, items) {
  const { id, ...fields } = combo
  let comboId = id
  if (id) {
    const { error } = await supabase.from('combos').update(fields).eq('id', id)
    if (error) throw error
  } else {
    const { data, error } = await supabase.from('combos').insert(fields).select().single()
    if (error) throw error
    comboId = data.id
  }

  await supabase.from('combo_items').delete().eq('combo_id', comboId)
  const rows = items
    .filter((it) => it.product_id && Number(it.quantity) > 0)
    .map((it) => ({ combo_id: comboId, product_id: it.product_id, quantity: Number(it.quantity) }))
  if (rows.length) {
    const { error } = await supabase.from('combo_items').insert(rows)
    if (error) throw error
  }
  return comboId
}

export async function deleteCombo(id) {
  const { error } = await supabase.from('combos').delete().eq('id', id)
  if (error) throw error
}
