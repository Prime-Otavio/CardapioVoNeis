import { supabase } from './supabase'

export const BASE_UNITS = [
  { id: 'g', label: 'gramas (g)' },
  { id: 'ml', label: 'mililitros (ml)' },
  { id: 'un', label: 'unidade (un)' },
]

// ----- Ingredientes -----
export async function listIngredients() {
  const { data, error } = await supabase.from('ingredients').select('*').order('name')
  if (error) throw error
  return data
}

export async function saveIngredient(ing) {
  const { id, cost_per_base_unit, ...fields } = ing
  const query = id
    ? supabase.from('ingredients').update(fields).eq('id', id)
    : supabase.from('ingredients').insert(fields)
  const { error } = await query
  if (error) throw error
  // recalcula custo dos produtos que usam esse ingrediente
  if (id) await supabase.rpc('recalc_products_by_ingredient', { p_ingredient_id: id })
}

export async function deleteIngredient(id) {
  const { error } = await supabase.from('ingredients').delete().eq('id', id)
  if (error) throw error
}

// ----- Ficha técnica (receita de um produto) -----
export async function getRecipe(productId) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*, ingredients(name, base_unit, cost_per_base_unit)')
    .eq('product_id', productId)
  if (error) throw error
  return data
}

// Salva a ficha inteira de um produto: apaga as linhas antigas e grava as novas.
// items: [{ ingredient_id, quantity }]
export async function saveRecipe(productId, items) {
  const { error: delErr } = await supabase.from('recipes').delete().eq('product_id', productId)
  if (delErr) throw delErr

  const rows = items
    .filter((it) => it.ingredient_id && Number(it.quantity) > 0)
    .map((it) => ({ product_id: productId, ingredient_id: it.ingredient_id, quantity: Number(it.quantity) }))

  if (rows.length) {
    const { error: insErr } = await supabase.from('recipes').insert(rows)
    if (insErr) throw insErr
  }
  // recalcula o custo do produto
  const { data, error } = await supabase.rpc('recalc_product_cost', { p_product_id: productId })
  if (error) throw error
  return data // novo custo
}
