import { useEffect, useMemo, useState } from 'react'
import { listProducts } from '../lib/products'
import { listIngredients, getRecipe, saveRecipe } from '../lib/ingredients'
import { brl } from '../utils'
import { ClipboardList, Plus, Trash2, Search, Check } from 'lucide-react'

export default function RecipePage() {
  const [products, setProducts] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [selected, setSelected] = useState(null) // produto escolhido
  const [rows, setRows] = useState([]) // [{ ingredient_id, quantity }]
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)

  useEffect(() => {
    Promise.all([listProducts(), listIngredients()])
      .then(([p, i]) => {
        setProducts(p)
        setIngredients(i)
      })
      .catch((e) => console.error(e))
  }, [])

  const ingById = useMemo(() => {
    const m = {}
    ingredients.forEach((i) => (m[i.id] = i))
    return m
  }, [ingredients])

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    return s ? products.filter((p) => p.name.toLowerCase().includes(s)) : products
  }, [products, search])

  async function pick(p) {
    setSelected(p)
    setSavedMsg(false)
    const recipe = await getRecipe(p.id)
    setRows(
      recipe.length
        ? recipe.map((r) => ({ ingredient_id: r.ingredient_id, quantity: String(r.quantity) }))
        : [{ ingredient_id: '', quantity: '' }]
    )
  }

  function addRow() {
    setRows((r) => [...r, { ingredient_id: '', quantity: '' }])
  }
  function setRow(idx, patch) {
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)))
  }
  function removeRow(idx) {
    setRows((r) => r.filter((_, i) => i !== idx))
  }

  const custoTotal = useMemo(
    () =>
      rows.reduce((s, row) => {
        const ing = ingById[row.ingredient_id]
        const q = Number(row.quantity || 0)
        return s + (ing ? Number(ing.cost_per_base_unit) * q : 0)
      }, 0),
    [rows, ingById]
  )

  const preco = Number(selected?.price ?? 0)
  const margem = preco > 0 ? ((preco - custoTotal) / preco) * 100 : 0

  async function save() {
    if (!selected) return
    setBusy(true)
    try {
      await saveRecipe(
        selected.id,
        rows.map((r) => ({ ingredient_id: r.ingredient_id, quantity: r.quantity }))
      )
      setSavedMsg(true)
      setProducts((ps) => ps.map((p) => (p.id === selected.id ? { ...p, cost: custoTotal } : p)))
    } catch (e) {
      console.error(e)
      alert('Não foi possível salvar a ficha: ' + (e.message || 'erro'))
    } finally {
      setBusy(false)
    }
  }

  // ----- Seleção de produto -----
  if (!selected) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-1 flex items-center gap-2">
          <ClipboardList size={20} className="text-accent" />
          <h2 className="font-display text-2xl italic text-ink">Ficha técnica</h2>
        </div>
        <p className="mb-5 font-sans text-sm text-ink/55">
          Escolha um produto para montar a receita e calcular o custo real dele.
        </p>

        <div className="mb-4 flex items-center gap-2 rounded-xl border border-ink/10 bg-white px-3 py-2.5">
          <Search size={18} className="text-ink/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto…"
            className="w-full bg-transparent font-sans text-sm outline-none"
          />
        </div>

        <ul className="space-y-2">
          {filtered.map((p) => {
            const temFicha = Number(p.cost) > 0
            return (
              <li key={p.id}>
                <button
                  onClick={() => pick(p)}
                  className="flex w-full items-center gap-3 rounded-xl border border-ink/10 bg-white px-4 py-3 text-left hover:border-accent/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-sans text-sm font-semibold text-ink">{p.name}</p>
                    <p className="font-sans text-xs text-ink/45">
                      {p.categories?.name ?? 'sem categoria'} · {brl(Number(p.price))}
                    </p>
                  </div>
                  {temFicha ? (
                    <span className="rounded-full bg-green-50 px-2.5 py-1 font-sans text-[11px] font-semibold text-green-700">
                      custo {brl(Number(p.cost))}
                    </span>
                  ) : (
                    <span className="rounded-full bg-ink/5 px-2.5 py-1 font-sans text-[11px] text-ink/40">
                      sem ficha
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  // ----- Edição da ficha -----
  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={() => setSelected(null)} className="mb-3 font-sans text-sm text-ink/50 hover:text-ink">
        ← Voltar aos produtos
      </button>

      <div className="mb-1 flex items-center gap-2">
        <ClipboardList size={20} className="text-accent" />
        <h2 className="font-display text-2xl italic text-ink">{selected.name}</h2>
      </div>
      <p className="mb-5 font-sans text-sm text-ink/55">
        Monte a receita: escolha cada ingrediente e quanto entra (na unidade dele).
      </p>

      {ingredients.length === 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 font-sans text-sm text-amber-800">
          Você ainda não cadastrou ingredientes. Vá em “Ingredientes” no menu primeiro.
        </div>
      )}

      <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
        <div className="space-y-2.5">
          {rows.map((row, idx) => {
            const ing = ingById[row.ingredient_id]
            const sub = ing ? Number(ing.cost_per_base_unit) * Number(row.quantity || 0) : 0
            return (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={row.ingredient_id}
                  onChange={(e) => setRow(idx, { ingredient_id: e.target.value })}
                  className="min-w-0 flex-1 rounded-lg border border-ink/15 px-3 py-2.5 font-sans text-sm outline-none focus:border-accent"
                >
                  <option value="">— ingrediente —</option>
                  {ingredients.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
                <input
                  value={row.quantity}
                  onChange={(e) => setRow(idx, { quantity: e.target.value.replace(',', '.') })}
                  inputMode="decimal"
                  placeholder="qtd"
                  className="w-20 rounded-lg border border-ink/15 px-2 py-2.5 text-center font-sans text-sm outline-none focus:border-accent"
                />
                <span className="w-8 font-sans text-xs text-ink/40">{ing?.base_unit ?? ''}</span>
                <span className="w-16 text-right font-sans text-xs text-ink/50">{sub > 0 ? brl(sub) : ''}</span>
                <button onClick={() => removeRow(idx)} className="text-ink/30 hover:text-red-500"><Trash2 size={15} /></button>
              </div>
            )
          })}
        </div>

        <button onClick={addRow} className="mt-3 flex items-center gap-1.5 font-sans text-sm font-semibold text-accent">
          <Plus size={16} /> Adicionar ingrediente
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white p-4 ring-1 ring-ink/8">
          <p className="font-sans text-xs text-ink/50">Custo do bolo</p>
          <p className="mt-1 font-sans text-xl font-bold text-ink">{brl(custoTotal)}</p>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-ink/8">
          <p className="font-sans text-xs text-ink/50">Preço de venda</p>
          <p className="mt-1 font-sans text-xl font-bold text-ink">{brl(preco)}</p>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-ink/8">
          <p className="font-sans text-xs text-ink/50">Margem</p>
          <p className={`mt-1 font-sans text-xl font-bold ${margem >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {preco > 0 ? `${margem.toFixed(0)}%` : '—'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={save}
          disabled={busy}
          className="flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-sans text-sm font-semibold text-white disabled:opacity-50"
        >
          <Check size={18} /> {busy ? 'Salvando…' : 'Salvar ficha técnica'}
        </button>
        {savedMsg && <span className="font-sans text-sm text-green-600">✓ Salvo! Custo atualizado.</span>}
      </div>
    </div>
  )
}
