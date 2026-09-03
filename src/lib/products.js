import { supabase } from './supabase'
import { hojeLocal } from '../utils'

// O cardápio público lê como `anon`, e o `anon` NÃO tem select em products.*
// — o grant é por coluna, justamente para `cost` não vazar (migration 0016).
// Por isso aqui a lista de colunas é explícita: um `select('*')` volta como
// erro de permissão. Coluna nova só pode entrar aqui depois de entrar no grant.
const COLUNAS_PUBLICAS =
  'id, store_id, category_id, name, description, price, unit, image_url, active, on_menu, sold_out, featured, sort_order, created_at'

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
        // sold_out é o "acabou hoje" do balcão (migration 0015); em bancos
        // antigos a coluna não existe e o campo vem undefined — daí o !== true.
        available: p.active && p.sold_out !== true,
      })),
  }))
}

export async function fetchMenu() {
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from('categories').select('*'),
    supabase.from('products').select(COLUNAS_PUBLICAS).order('name'),
  ])
  return groupForMenu(categories ?? [], products ?? [])
}

// Cardápio público inteligente:
// - Se há caixa aberto hoje: mostra só os produtos que estão no caixa,
//   marcando os esgotados (resta = 0) e escondendo o resto.
// - Se não há caixa aberto: mostra o catálogo completo.
// Retorna { menu, combos, caixaAberto }.
export async function fetchPublicMenu() {
  const today = hojeLocal()

  const [{ data: categories }, { data: products }, { data: session }, combos] = await Promise.all([
    supabase.from('categories').select('*'),
    supabase.from('products').select(COLUNAS_PUBLICAS).order('name'),
    supabase
      .from('cash_sessions')
      .select('id, status')
      .eq('business_date', today)
      .eq('status', 'aberto')
      .maybeSingle(),
    fetchActiveCombos(),
  ])

  const cats = categories ?? []
  // on_menu controla o que aparece para o cliente; o produto pode existir no
  // PDV e ficar fora do cardápio online. Coluna nova: undefined = mostra.
  const prods = (products ?? []).filter((p) => p.on_menu !== false)
  const caixaAberto = !!session // session já é a linha (ou null)

  if (!caixaAberto) {
    // Caixa fechado: mostra o catálogo completo.
    // Produto inativo no painel aparece sempre como esgotado.
    const menu = groupForMenu(cats, prods).map((cat) => ({
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
  const menu = groupForMenu(cats, prods).map((cat) => ({
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

// Catálogo do painel, escopado por loja (migration 0014). Quando storeId é
// null o banco ainda é de loja única e não há o que filtrar.
export async function listCatalog(storeId) {
  const cats = supabase.from('categories').select('*').order('sort_order')
  const prods = supabase.from('products').select('*').order('sort_order').order('name')
  const [c, p] = await Promise.all([
    storeId ? cats.eq('store_id', storeId) : cats,
    storeId ? prods.eq('store_id', storeId) : prods,
  ])
  if (c.error) throw c.error
  if (p.error) throw p.error
  return { categorias: c.data ?? [], produtos: p.data ?? [] }
}

// "Esgotou" é a ação mais usada do dia. Só toca uma coluna de propósito:
// o produto continua no cardápio, apenas marcado como indisponível.
export async function setSoldOut(id, soldOut) {
  const { error } = await supabase.from('products').update({ sold_out: soldOut }).eq('id', id)
  if (error) throw error
}
