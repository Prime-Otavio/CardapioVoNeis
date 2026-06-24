import { useEffect, useMemo, useState } from 'react'
import { listCombos, saveCombo, deleteCombo } from '../lib/combos'
import { listProducts } from '../lib/products'
import { brl } from '../utils'
import { Gift, Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { usePin } from './PinGate'

const emptyCombo = () => ({ name: '', description: '', price: '', active: true, image_url: '' })

export default function CombosPage() {
  const [combos, setCombos] = useState([])
  const [products, setProducts] = useState([])
  const [editing, setEditing] = useState(null) // 'new' | combo | null
  const [draft, setDraft] = useState(emptyCombo())
  const [rows, setRows] = useState([{ product_id: '', quantity: '' }])
  const { requirePin } = usePin()

  async function reload() {
    const [c, p] = await Promise.all([listCombos(), listProducts()])
    setCombos(c)
    setProducts(p)
  }
  useEffect(() => {
    reload().catch((e) => console.error(e))
  }, [])

  function openNew() {
    setDraft(emptyCombo())
    setRows([{ product_id: '', quantity: '' }])
    setEditing('new')
  }
  function openEdit(c) {
    setDraft({
      name: c.name,
      description: c.description || '',
      price: String(c.price),
      active: c.active,
      image_url: c.image_url || '',
    })
    setRows(
      (c.combo_items || []).length
        ? c.combo_items.map((it) => ({ product_id: it.product_id, quantity: String(it.quantity) }))
        : [{ product_id: '', quantity: '' }]
    )
    setEditing(c)
  }

  async function save(e) {
    e.preventDefault()
    if (!draft.name.trim()) return
    const combo = {
      ...(editing !== 'new' ? { id: editing.id } : {}),
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      price: Number(String(draft.price).replace(',', '.') || 0),
      active: draft.active,
      image_url: draft.image_url.trim() || null,
    }
    await saveCombo(combo, rows)
    setEditing(null)
    reload()
  }

  function remove(id) {
    requirePin(async () => {
      if (!confirm('Remover este combo?')) return
      await deleteCombo(id)
      reload()
    }, 'Excluir um combo exige o PIN do dono.')
  }

  const setRow = (i, patch) => setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)))
  const addRow = () => setRows((r) => [...r, { product_id: '', quantity: '' }])
  const removeRow = (i) => setRows((r) => r.filter((_, idx) => idx !== i))

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-1 flex items-center gap-2">
        <Gift size={20} className="text-accent" />
        <h2 className="font-display text-2xl italic text-ink">Combos</h2>
      </div>
      <p className="mb-5 font-sans text-sm text-ink/55">
        Monte combos promocionais. Eles aparecem em destaque no topo do cardápio.
      </p>

      {editing ? (
        <form onSubmit={save} className="mb-6 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-sans text-sm font-semibold text-ink">
              {editing === 'new' ? 'Novo combo' : 'Editar combo'}
            </h3>
            <button type="button" onClick={() => setEditing(null)} className="text-ink/40 hover:text-ink"><X size={18} /></button>
          </div>

          <label className="mb-1 block font-sans text-xs text-ink/60">Nome do combo</label>
          <input
            value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Ex: Combo 3 fatias"
            className="mb-3 w-full rounded-lg border border-ink/15 px-3 py-2.5 font-sans text-sm outline-none focus:border-accent"
          />

          <label className="mb-1 block font-sans text-xs text-ink/60">Descrição (opcional)</label>
          <input
            value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Ex: escolha 3 sabores"
            className="mb-3 w-full rounded-lg border border-ink/15 px-3 py-2.5 font-sans text-sm outline-none focus:border-accent"
          />

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-sans text-xs text-ink/60">Preço do combo (R$)</label>
              <input
                value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value.replace(',', '.') })}
                inputMode="decimal" placeholder="50,00"
                className="w-full rounded-lg border border-ink/15 px-3 py-2.5 font-sans text-sm outline-none focus:border-accent"
              />
            </div>
            <label className="mt-6 flex items-center gap-2 font-sans text-sm text-ink/70">
              <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
              Ativo (aparece no cardápio)
            </label>
          </div>

          <p className="mb-2 font-sans text-xs font-semibold text-ink/60">Itens do combo</p>
          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={row.product_id} onChange={(e) => setRow(i, { product_id: e.target.value })}
                  className="min-w-0 flex-1 rounded-lg border border-ink/15 px-3 py-2.5 font-sans text-sm outline-none focus:border-accent"
                >
                  <option value="">— produto —</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input
                  value={row.quantity} onChange={(e) => setRow(i, { quantity: e.target.value })}
                  inputMode="numeric" placeholder="qtd"
                  className="w-16 rounded-lg border border-ink/15 px-2 py-2.5 text-center font-sans text-sm outline-none focus:border-accent"
                />
                <button type="button" onClick={() => removeRow(i)} className="text-ink/30 hover:text-red-500"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addRow} className="mt-2 flex items-center gap-1.5 font-sans text-sm font-semibold text-accent">
            <Plus size={16} /> Adicionar produto
          </button>

          <div className="mt-4 flex gap-2">
            <button type="submit" className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 font-sans text-sm font-semibold text-white">
              <Check size={16} /> Salvar combo
            </button>
            <button type="button" onClick={() => setEditing(null)} className="rounded-full border border-ink/15 px-5 py-2.5 font-sans text-sm text-ink/60">Cancelar</button>
          </div>
        </form>
      ) : (
        <button onClick={openNew} className="mb-4 flex items-center gap-1.5 rounded-full bg-accent px-4 py-2.5 font-sans text-sm font-semibold text-white">
          <Plus size={16} /> Novo combo
        </button>
      )}

      <ul className="space-y-2">
        {combos.map((c) => (
          <li key={c.id} className="flex items-center gap-3 rounded-xl border border-ink/10 bg-white px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-sans text-sm font-semibold text-ink">
                {c.name} {!c.active && <span className="text-xs text-ink/40">(inativo)</span>}
              </p>
              <p className="font-sans text-xs text-ink/45">
                {brl(Number(c.price))} · {(c.combo_items || []).map((it) => `${it.quantity}x ${it.products?.name}`).join(', ') || 'sem itens'}
              </p>
            </div>
            <button onClick={() => openEdit(c)} className="text-ink/40 hover:text-accent"><Pencil size={16} /></button>
            <button onClick={() => remove(c.id)} className="text-ink/30 hover:text-red-500"><Trash2 size={16} /></button>
          </li>
        ))}
        {combos.length === 0 && !editing && (
          <li className="rounded-xl border border-dashed border-ink/15 py-10 text-center font-sans text-sm text-ink/40">
            Nenhum combo ainda. Crie o primeiro!
          </li>
        )}
      </ul>
    </div>
  )
}
