import { useEffect, useMemo, useState } from 'react'
import { listProducts } from '../lib/products'
import { addProductToStock } from '../lib/cash'
import { brl } from '../utils'
import { Search, X, Plus, Check } from 'lucide-react'

// Modal: adicionar um produto ao caixa já aberto, com quantidade.
export default function AddProductToCash({ session, jaNoCaixa = [], onAdded, onClose }) {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [selId, setSelId] = useState(null)
  const [qty, setQty] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    listProducts().then(setProducts).catch((e) => console.error(e))
  }, [])

  const jaSet = useMemo(() => new Set(jaNoCaixa), [jaNoCaixa])

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    const base = s ? products.filter((p) => p.name.toLowerCase().includes(s)) : products
    return base
  }, [products, search])

  async function confirm() {
    if (!selId || !qty || Number(qty) <= 0) return
    setBusy(true)
    try {
      await addProductToStock(session.id, selId, parseInt(qty, 10))
      onAdded()
    } catch (e) {
      console.error(e)
      alert('Não foi possível adicionar: ' + (e.message || 'erro'))
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-xl italic text-ink">Adicionar produto ao caixa</h3>
          <button onClick={onClose} className="text-ink/40 hover:text-ink"><X size={18} /></button>
        </div>

        <div className="mb-3 flex items-center gap-2 rounded-xl border border-ink/10 bg-white px-3 py-2.5">
          <Search size={18} className="text-ink/40" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto…" autoFocus
            className="w-full bg-transparent font-sans text-sm outline-none"
          />
        </div>

        <ul className="mb-3 flex-1 space-y-1.5 overflow-y-auto">
          {filtered.map((p) => {
            const ja = jaSet.has(p.id)
            return (
              <li key={p.id}>
                <button
                  onClick={() => setSelId(p.id)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    selId === p.id ? 'border-accent bg-accentLight' : 'border-ink/10 hover:border-accent/40'
                  }`}
                >
                  <span className="font-sans text-sm text-ink">
                    {p.name}
                    {ja && <span className="ml-2 text-[11px] text-ink/40">(já no caixa)</span>}
                  </span>
                  <span className="font-sans text-xs text-ink/45">{brl(Number(p.price))}</span>
                </button>
              </li>
            )
          })}
        </ul>

        <div className="flex items-center gap-2 border-t border-ink/10 pt-3">
          <label className="font-sans text-sm text-ink/60">Quantidade:</label>
          <input
            value={qty} onChange={(e) => setQty(e.target.value)}
            inputMode="numeric" placeholder="0"
            className="w-20 rounded-lg border border-ink/15 px-2 py-2 text-center font-sans text-sm outline-none focus:border-accent"
          />
          <button
            onClick={confirm}
            disabled={!selId || !qty || busy}
            className="ml-auto flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 font-sans text-sm font-semibold text-white disabled:opacity-50"
          >
            <Check size={16} /> {busy ? 'Adicionando…' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}
