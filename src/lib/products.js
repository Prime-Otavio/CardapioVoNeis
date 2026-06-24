import { supabase } from './supabase'

export function groupForMenu(categories, products) {
  const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order)
  return sorted.map((cat) => ({
    id: cat.id,
    name: cat.name,
    emoji: cat.emoji,
    items: products
      .filter((p) => p.category_id === cat.id)
      .map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        desc: p.description,
        image: p.image_url,
        available: p.active,
      })),
  }))
}

export async function fetchMenu() {
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from('categories').select('*'),
    supabase.from('products').select('*').order('name'),
  ])
  return groupForMenu(categories ?? [], products ?? [])
}

// Cardápio público inteligente:
// - Se há caixa aberto hoje: mostra só os produtos que estão no caixa,
//   marcando os esgotados (resta = 0) e escondendo o resto.
// - Se não há caixa aberto: mostra o catálogo completo.
// Retorna { menu, combos, caixaAberto }.
export async function fetchPublicMenu() {
  const today = new Date().toISOString().slice(0, 10)

  const [{ data: categories }, { data: products }, { data: session }, combos] = await Promise.all([
    supabase.from('categories').select('*'),
    supabase.from('products').select('*').order('name'),
    supabase
      .from('cash_sessions')
      .select('id, status')
      .eq('business_date', today)
      .eq('status', 'aberto')
      .maybeSingle()
      .then((r) => r),
    fetchActiveCombos(),
  ])

  const cats = categories ?? []
  const prods = products ?? []
  const caixaAberto = !!session?.data

  if (!caixaAberto) {
    return { menu: groupForMenu(cats, prods), combos, caixaAberto: false }
  }

  // Caixa aberto: pega o estoque do dia
  const { data: stock } = await supabase
    .from('daily_stock')
    .select('product_id, qty_initial, qty_sold')
    .eq('cash_session_id', session.data.id)

  const stockMap = {}
  ;(stock ?? []).forEach((s) => {
    stockMap[s.product_id] = s.qty_initial - s.qty_sold
  })

  // Só produtos que estão no caixa do dia
  const doDia = prods.filter((p) => stockMap[p.id] !== undefined)
  const menu = groupForMenu(cats, doDia).map((cat) => ({
    ...cat,
    items: cat.items.map((it) => ({
      ...it,
      available: stockMap[it.id] > 0, // esgotado se 0
      soldOut: stockMap[it.id] <= 0,
      remaining: stockMap[it.id],
    })),
  }))

  return { menu, combos, caixaAberto: true }
}

async function fetchActiveCombos() {
  const { data, error } = await supabase
    .from('combos')
    .select('*, combo_items(quantity, products(name))')
    .eq('active', true)
    .order('sort_order')
  if (error) return []
  return data ?? []
}

export async function listProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name)')
    .order('name')
  if (error) throw error
  return data
}

export async function saveProduct(product) {
  const { id, ...fields } = product
  const query = id
    ? supabase.from('products').update(fields).eq('id', id)
    : supabase.from('products').insert(fields)
  const { error } = await query
  if (error) throw error
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

export async function listCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('sort_order')
  if (error) throw error
  return data
}

export async function saveCategory(category) {
  const { id, ...fields } = category
  const query = id
    ? supabase.from('categories').update(fields).eq('id', id)
    : supabase.from('categories').insert(fields)
  const { error } = await query
  if (error) throw error
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}
