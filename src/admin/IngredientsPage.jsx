import { useEffect, useMemo, useState } from 'react'
import { listIngredients, saveIngredient, deleteIngredient, BASE_UNITS } from '../lib/ingredients'
import { brl } from '../utils'
import { Plus, Pencil, Trash2, FlaskConical, X } from 'lucide-react'

const emptyDraft = { name: '', purchase_unit: 'pacote', purchase_price: '', purchase_qty: '', base_unit: 'g' }

export default function IngredientsPage() {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null) // 'new' | objeto | null
  const [draft, setDraft] = useState(emptyDraft)
  const [search, setSearch] = useState('')

  async function reload() {
    setItems(await listIngredients())
  }
  useEffect(() => {
    reload().catch((e) => console.error(e))
  }, [])

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    return s ? items.filter((i) => i.name.toLowerCase().includes(s)) : items
  }, [items, search])

  function openNew() {
    setDraft(emptyDraft)
    setEditing('new')
  }
  function openEdit(i) {
    setDraft({
      name: i.name,
      purchase_unit: i.purchase_unit,
      purchase_price: String(i.purchase_price),
      purchase_qty: String(i.purchase_qty),
      base_unit: i.base_unit,
    })
    setEditing(i)
  }

  async function save(e) {
    e.preventDefault()
    const payload = {
      ...(editing !== 'new' ? { id: editing.id } : {}),
      name: draft.name.trim(),
      purchase_unit: draft.purchase_unit.trim() || 'pacote',
      purchase_price: Number(draft.purchase_price || 0),
      purchase_qty: Number(draft.purchase_qty || 1),
      base_unit: draft.base_unit,
    }
    if (!payload.name) return
    await saveIngredient(payload)
    setEditing(null)
    reload()
  }

  async function remove(id) {
    if (!confirm('Remover este ingrediente? Ele sairá das receitas que o usam.')) return
    await deleteIngredient(id)
    reload()
  }

  function custoUnitario(i) {
    const c = Number(i.purchase_qty) > 0 ? Number(i.purchase_price) / Number(i.purchase_qty) : 0
    return c
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-1 flex items-center gap-2">
        <FlaskConical size={20} className="text-accent" />
        <h2 className="font-display text-2xl italic text-ink">Ingredientes</h2>
      </div>
      <p className="mb-5 font-sans text-sm text-ink/55">
        Cadastre o que você compra e o preço. O sistema usa isso para calcular o custo de cada bolo.
      </p>

      {editing ? (
        <form onSubmit={save} className="mb-6 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-sans text-sm font-semibold text-ink">
              {editing === 'new' ? 'Novo ingrediente' : 'Editar ingrediente'}
            </h3>
            <button type="button" onClick={() => setEditing(null)} className="text-ink/40 hover:text-ink">
              <X size={18} />
            </button>
          </div>

          <label className="mb-1 block font-sans text-xs text-ink/60">Nome do ingrediente</label>
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Ex: Leite Ninho"
            className="mb-4 w-full rounded-lg border border-ink/15 px-3 py-2.5 font-sans text-sm outline-none focus:border-accent"
          />

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-sans text-xs text-ink/60">Preço de compra (R$)</label>
              <input
                value={draft.purchase_price}
                onChange={(e) => setDraft({ ...draft, purchase_price: e.target.value.replace(',', '.') })}
                inputMode="decimal" placeholder="18,00"
                className="w-full rounded-lg border border-ink/15 px-3 py-2.5 font-sans text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1 block font-sans text-xs text-ink/60">Como você compra</label>
              <input
                value={draft.purchase_unit}
                onChange={(e) => setDraft({ ...draft, purchase_unit: e.target.value })}
                placeholder="lata, kg, dúzia…"
                className="w-full rounded-lg border border-ink/15 px-3 py-2.5 font-sans text-sm outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-sans text-xs text-ink/60">Quantidade que vem</label>
              <input
                value={draft.purchase_qty}
                onChange={(e) => setDraft({ ...draft, purchase_qty: e.target.value.replace(',', '.') })}
                inputMode="decimal" placeholder="395"
                className="w-full rounded-lg border border-ink/15 px-3 py-2.5 font-sans text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1 block font-sans text-xs text-ink/60">Unidade de medida</label>
              <select
                value={draft.base_unit}
                onChange={(e) => setDraft({ ...draft, base_unit: e.target.value })}
                className="w-full rounded-lg border border-ink/15 px-3 py-2.5 font-sans text-sm outline-none focus:border-accent"
              >
                {BASE_UNITS.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
              </select>
            </div>
          </div>

          {Number(draft.purchase_price) > 0 && Number(draft.purchase_qty) > 0 && (
            <p className="mb-4 rounded-lg bg-accentLight px-3 py-2 font-sans text-xs text-accent">
              Custo: {brl(Number(draft.purchase_price) / Number(draft.purchase_qty))} por {draft.base_unit}
              {' '}(ex: {brl((Number(draft.purchase_price) / Number(draft.purchase_qty)) * 100)} a cada 100{draft.base_unit})
            </p>
          )}

          <div className="flex gap-2">
            <button type="submit" className="rounded-full bg-accent px-5 py-2.5 font-sans text-sm font-semibold text-white">
              Salvar
            </button>
            <button type="button" onClick={() => setEditing(null)} className="rounded-full border border-ink/15 px-5 py-2.5 font-sans text-sm text-ink/60">
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-4 flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ingrediente…"
            className="flex-1 rounded-xl border border-ink/10 bg-white px-3 py-2.5 font-sans text-sm outline-none focus:border-accent"
          />
          <button onClick={openNew} className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2.5 font-sans text-sm font-semibold text-white">
            <Plus size={16} /> Novo
          </button>
        </div>
      )}

      <ul className="space-y-2">
        {filtered.map((i) => (
          <li key={i.id} className="flex items-center gap-3 rounded-xl border border-ink/10 bg-white px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-sans text-sm font-semibold text-ink">{i.name}</p>
              <p className="font-sans text-xs text-ink/45">
                {brl(Number(i.purchase_price))} / {Number(i.purchase_qty)}{i.base_unit} ({i.purchase_unit}) ·{' '}
                <span className="text-accent">{brl(custoUnitario(i))}/{i.base_unit}</span>
              </p>
            </div>
            <button onClick={() => openEdit(i)} className="text-ink/40 hover:text-accent"><Pencil size={16} /></button>
            <button onClick={() => remove(i.id)} className="text-ink/30 hover:text-red-500"><Trash2 size={16} /></button>
          </li>
        ))}
        {filtered.length === 0 && !editing && (
          <li className="rounded-xl border border-dashed border-ink/15 py-10 text-center font-sans text-sm text-ink/40">
            Nenhum ingrediente ainda. Toque em “Novo” para começar.
          </li>
        )}
      </ul>
    </div>
  )
}
