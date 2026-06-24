import { useEffect, useMemo, useState } from 'react'
import { listProducts } from '../lib/products'
import { openCash, getPreviousLeftovers } from '../lib/cash'
import { brl } from '../utils'
import { Search, Plus, Minus, Check, RotateCcw } from 'lucide-react'

// Tela de abrir caixa: escolher os produtos feitos hoje e a quantidade de cada.
export default function OpenCashScreen({ onOpened }) {
  const [products, setProducts] = useState([])
  const [qty, setQty] = useState({}) // { product_id: number }
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [openingFloat, setOpeningFloat] = useState('')
  const [leftovers, setLeftovers] = useState([])

  useEffect(() => {
    listProducts().then(setProducts).catch((e) => console.error(e))
    getPreviousLeftovers()
      .then((lo) => {
        setLeftovers(lo)
        // pré-preenche as sobras de ontem como quantidade inicial
        if (lo.length) {
          const seed = {}
          lo.forEach((s) => {
            seed[s.product_id] = s.leftover
          })
          setQty(seed)
        }
      })
      .catch((e) => console.error(e))
  }, [])

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    if (!s) return products
    return products.filter((p) => p.name.toLowerCase().includes(s))
  }, [products, search])

  const selected = useMemo(
    () => Object.entries(qty).filter(([, n]) => n > 0),
    [qty]
  )

  function bump(id, delta) {
    setQty((q) => {
      const next = Math.max(0, (q[id] || 0) + delta)
      return { ...q, [id]: next }
    })
  }
  function setExact(id, value) {
    const n = Math.max(0, parseInt(value || '0', 10) || 0)
    setQty((q) => ({ ...q, [id]: n }))
  }

  async function confirm() {
    if (selected.length === 0) return
    setBusy(true)
    try {
      const items = selected.map(([product_id, qty_initial]) => ({ product_id, qty_initial }))
      const floatNum = openingFloat === '' ? 0 : Number(openingFloat)
      const session = await openCash(items, floatNum)
      onOpened(session)
    } catch (e) {
      console.error(e)
      alert('Não foi possível abrir o caixa. Tente novamente.')
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="font-display text-2xl italic text-ink">Abrir caixa de hoje</h2>
      <p className="mb-4 font-sans text-sm text-ink/55">
        Marque os produtos que você fez hoje e quantos de cada. O resto fica indisponível no dia.
      </p>

      {leftovers.length > 0 && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <RotateCcw size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="font-sans text-sm text-amber-800">
            Já preenchi as <strong>sobras do último dia</strong> ({leftovers.length} produto(s)). Confira e
            ajuste as quantidades — adicione os que fez a mais e zere os que não tem hoje.
          </p>
        </div>
      )}

      <div className="mb-4 flex items-center gap-2 rounded-xl border border-ink/10 bg-white px-3 py-2.5">
        <Search size={18} className="text-ink/40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar produto…"
          className="w-full bg-transparent font-sans text-sm outline-none"
        />
      </div>

      <ul className="space-y-2 pb-28">
        {filtered.map((p) => {
          const n = qty[p.id] || 0
          const on = n > 0
          return (
            <li
              key={p.id}
              className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 transition-colors ${
                on ? 'border-accent/60' : 'border-ink/10'
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-sans text-sm font-semibold text-ink">{p.name}</p>
                <p className="font-sans text-xs text-ink/45">
                  {p.categories?.name ?? 'sem categoria'} · {brl(Number(p.price))}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => bump(p.id, -1)}
                  aria-label="Diminuir"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-accent/40 text-accent hover:bg-accentLight active:scale-95"
                >
                  <Minus size={16} />
                </button>
                <input
                  value={n}
                  onChange={(e) => setExact(p.id, e.target.value)}
                  inputMode="numeric"
                  className="w-12 rounded-lg border border-ink/15 px-2 py-1.5 text-center font-sans text-sm"
                />
                <button
                  onClick={() => bump(p.id, 1)}
                  aria-label="Aumentar"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white hover:brightness-105 active:scale-95"
                >
                  <Plus size={16} />
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="fixed bottom-0 left-60 right-0 border-t border-ink/10 bg-white/95 px-7 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <label className="font-sans text-sm text-ink/60">Troco inicial R$</label>
            <input
              value={openingFloat}
              onChange={(e) => setOpeningFloat(e.target.value.replace(',', '.'))}
              inputMode="decimal"
              placeholder="0,00"
              className="w-24 rounded-lg border border-ink/15 px-2 py-1.5 font-sans text-sm outline-none focus:border-accent"
            />
          </div>
          <span className="font-sans text-sm text-ink/60">
            {selected.length === 0
              ? 'Nenhum produto selecionado'
              : `${selected.length} produto(s) · ${selected.reduce((s, [, n]) => s + n, 0)} unidades`}
          </span>
          <button
            onClick={confirm}
            disabled={selected.length === 0 || busy}
            className="flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 font-sans text-sm font-semibold text-white disabled:opacity-50"
          >
            <Check size={18} /> {busy ? 'Abrindo…' : 'Abrir caixa'}
          </button>
        </div>
      </div>
    </div>
  )
}
