import { supabase } from './supabase'
import { hojeLocal } from '../utils'

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

export async function fetchMenu(storeId) {
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from('categories').select('*').eq('store_id', storeId),
    supabase.from('products').select('*').eq('store_id', storeId).order('name'),
  ])
  return groupForMenu(categories ?? [], products ?? [])
}

// Grupos de adicionais prontos para o cardápio, indexados por produto.
// Só entram opções disponíveis — opção desligada no painel some do cardápio.
async function fetchMenuOptions(storeId) {
  const [{ data: grupos }, { data: vinculos }] = await Promise.all([
    supabase.from('option_groups').select('*, options(*)').eq('store_id', storeId).order('sort_order'),
    supabase.from('product_option_groups').select('*'),
  ])

  const porId = {}
  ;(grupos ?? []).forEach((g) => {
    porId[g.id] = {
      id: g.id,
      name: g.name,
      required: g.required,
      maxSelect: g.max_select ?? 1,
      options: (g.options ?? [])
        .filter((o) => o.available)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((o) => ({ id: o.id, name: o.name, extraPrice: Number(o.extra_price) || 0 })),
    }
  })

  const porProduto = {}
  ;[...(vinculos ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .forEach((v) => {
      const g = porId[v.group_id]
      if (g && g.options.length) (porProduto[v.product_id] ||= []).push(g)
    })
  return porProduto
}

// Cardápio público inteligente, de uma loja:
// - Se há caixa aberto hoje nessa loja: mostra só os produtos que estão no
//   caixa, marcando os esgotados (resta = 0) e escondendo o resto.
// - Se não há caixa aberto: mostra o catálogo completo.
// Retorna { menu, combos, caixaAberto }.
export async function fetchPublicMenu(storeId) {
  const today = hojeLocal()

  const [{ data: categories }, { data: products }, { data: session }, combos, optionsByProduct] =
    await Promise.all([
      supabase.from('categories').select('*').eq('store_id', storeId),
      supabase.from('products').select('*').eq('store_id', storeId).order('name'),
      supabase
        .from('cash_sessions')
        .select('id, status')
        .eq('store_id', storeId)
        .eq('business_date', today)
        .eq('status', 'aberto')
        .maybeSingle(),
      fetchActiveCombos(storeId),
      fetchMenuOptions(storeId),
    ])

  const cats = categories ?? []
  const prods = products ?? []
  const caixaAberto = !!session // session já é a linha (ou null)

  const comAdicionais = (cat) => ({
    ...cat,
    items: cat.items.map((it) => ({ ...it, optionGroups: optionsByProduct[it.id] ?? [] })),
  })

  if (!caixaAberto) {
    // Caixa fechado: mostra o catálogo completo.
    // Produto inativo no painel aparece sempre como esgotado.
    const menu = groupForMenu(cats, prods)
      .map(comAdicionais)
      .map((cat) => ({
        ...cat,
        items: cat.items.map((it) => ({
          ...it,
          soldOut: !it.available,
        })),
      }))
    return { menu, combos, caixaAberto: false }
  }

  // Caixa aberto: pega o estoque do dia
  const { data: stock } = await supabase
    .from('daily_stock')
    .select('product_id, qty_initial, qty_sold')
    .eq('cash_session_id', session.id)

  const stockMap = {}
  ;(stock ?? []).forEach((s) => {
    stockMap[s.product_id] = s.qty_initial - s.qty_sold
  })

  // Mostra TODOS os produtos do catálogo. Quem não está no caixa do dia,
  // quem zerou, ou quem está inativo no painel, aparece com tarja "Esgotado".
  const menu = groupForMenu(cats, prods)
    .map(comAdicionais)
    .map((cat) => ({
      ...cat,
      items: cat.items.map((it) => {
        const noCaixa = stockMap[it.id] !== undefined
        const resta = noCaixa ? stockMap[it.id] : 0
        const disponivel = it.available && noCaixa && resta > 0
        return {
          ...it,
          available: disponivel,
          soldOut: !disponivel,
          remaining: noCaixa ? resta : 0,
        }
      }),
    }))

  return { menu, combos, caixaAberto: true }
}

async function fetchActiveCombos(storeId) {
  const { data, error } = await supabase
    .from('combos')
    .select('*, combo_items(quantity, products(name))')
    .eq('store_id', storeId)
    .eq('active', true)
    .order('sort_order')
  if (error) return []
  return data ?? []
}

export async function listProducts(storeId) {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name)')
    .eq('store_id', storeId)
    .order('name')
  if (error) throw error
  return data
}

export async function saveProduct(product, storeId) {
  const { id, ...fields } = product
  const query = id
    ? supabase.from('products').update(fields).eq('id', id)
    : supabase.from('products').insert({ ...fields, store_id: storeId })
  const { error } = await query
  if (error) throw error
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

export async function listCategories(storeId) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('store_id', storeId)
    .order('sort_order')
  if (error) throw error
  return data
}

export async function saveCategory(category, storeId) {
  const { id, ...fields } = category
  const query = id
    ? supabase.from('categories').update(fields).eq('id', id)
    : supabase.from('categories').insert({ ...fields, store_id: storeId })
  const { error } = await query
  if (error) throw error
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

// Grava a ordem das categorias na sequência em que os ids chegam.
// Uma linha por categoria — são poucas, não vale um RPC.
export async function reorderCategories(ids) {
  const results = await Promise.all(
    ids.map((id, i) => supabase.from('categories').update({ sort_order: i }).eq('id', id)),
  )
  const falhou = results.find((r) => r.error)
  if (falhou) throw falhou.error
}
