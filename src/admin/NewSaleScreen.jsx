import { useMemo, useState } from 'react'
import { registerSale, PAYMENT_METHODS } from '../lib/sales'
import { brl } from '../utils'
import { Plus, Minus, Check, X } from 'lucide-react'

// Tela de lançar venda. Recebe o estoque do dia (daily_stock com products),
// monta a sacola só com itens que ainda têm estoque, e registra a venda.
export default function NewSaleScreen({ session, stock, onDone, onCancel }) {
  const [bag, setBag] = useState({}) // { product_id: qty }
  const [payment, setPayment] = useState('dinheiro')
  const [busy, setBusy] = useState(false)

  // Mapa de quanto resta de cada produto
  const restante = useMemo(() => {
    const m = {}
    stock.forEach((r) => {
      m[r.product_id] = r.qty_initial - r.qty_sold
    })
    return m
  }, [stock])

  const disponiveis = useMemo(
    () => stock.filter((r) => r.qty_initial - r.qty_sold > 0),
    [stock]
  )

  const lines = useMemo(
    () =>
      Object.entries(bag)
        .filter(([, q]) => q > 0)
        .map(([pid, q]) => {
          const row = stock.find((r) => r.product_id === pid)
          return {
            product_id: pid,
            name: row?.products?.name ?? '—',
            price: Number(row?.products?.price ?? 0),
            qty: q,
          }
        }),
    [bag, stock]
  )

  const total = useMemo(() => lines.reduce((s, l) => s + l.price * l.qty, 0), [lines])

  function add(pid) {
    const max = restante[pid] ?? 0
    setBag((b) => {
      const atual = b[pid] || 0
      if (atual >= max) return b // bloqueia passar do estoque
      return { ...b, [pid]: atual + 1 }
    })
  }
  function sub(pid) {
    setBag((b) => {
      const atual = (b[pid] || 0) - 1
      const next = { ...b }
      if (atual <= 0) delete next[pid]
      else next[pid] = atual
      return next
    })
  }

  async function confirm() {
    if (lines.length === 0) return
    setBusy(true)
    try {
      await registerSale(
        session.id,
        payment,
        lines.map((l) => ({ product_id: l.product_id, qty: l.qty }))
      )
      onDone()
    } catch (e) {
      console.error(e)
      alert('Não foi possível registrar a venda: ' + (e.message || 'erro'))
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl italic text-ink">Nova venda</h2>
          <button onClick={onCancel} className="flex items-center gap-1 text-sm text-ink/50 hover:text-ink">
            <X size={16} /> Cancelar
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {disponiveis.map((r) => {
            const resta = restante[r.product_id]
            const naSacola = bag[r.product_id] || 0
            return (
              <button
                key={r.id}
                onClick={() => add(r.product_id)}
                disabled={naSacola >= resta}
                className="flex flex-col items-start gap-1 rounded-xl border border-ink/10 bg-white p-3 text-left transition-colors hover:border-accent/50 disabled:opacity-40"
              >
                <span className="line-clamp-2 font-sans text-sm font-semibold text-ink">{r.products?.name}</span>
                <span className="font-sans text-xs text-ink/45">{brl(Number(r.products?.price ?? 0))}</span>
                <span className="font-sans text-[11px] text-ink/40">resta {resta - naSacola}</span>
              </button>
            )
          })}
          {disponiveis.length === 0 && (
            <p className="col-span-full py-8 text-center font-sans text-sm text-ink/40">
              Nenhum produto com estoque hoje.
            </p>
          )}
        </div>
      </div>

      <aside className="rounded-xl border border-ink/10 bg-white p-4">
        <h3 className="mb-3 font-sans text-sm font-semibold text-ink">Sacola</h3>
        {lines.length === 0 ? (
          <p className="py-6 text-center font-sans text-sm text-ink/40">Toque nos produtos para adicionar.</p>
        ) : (
          <ul className="mb-4 space-y-2">
            {lines.map((l) => (
              <li key={l.product_id} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-sans text-sm text-ink">{l.name}</p>
                  <p className="font-sans text-xs text-ink/45">{brl(l.price)}</p>
                </div>
                <button onClick={() => sub(l.product_id)} className="flex h-7 w-7 items-center justify-center rounded-full border border-accent/40 text-accent"><Minus size={14} /></button>
                <span className="w-5 text-center font-sans text-sm font-semibold">{l.qty}</span>
                <button onClick={() => add(l.product_id)} className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white"><Plus size={14} /></button>
              </li>
            ))}
          </ul>
        )}

        <div className="mb-3">
          <p className="mb-1.5 font-sans text-xs text-ink/55">Forma de pagamento</p>
          <div className="grid grid-cols-2 gap-1.5">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setPayment(m.id)}
                className={`rounded-lg border px-2 py-2 font-sans text-xs font-semibold transition-colors ${
                  payment === m.id ? 'border-accent bg-accent text-white' : 'border-ink/15 text-ink/60 hover:bg-accentLight'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between border-t border-ink/10 pt-3">
          <span className="font-sans text-sm text-ink/60">Total</span>
          <span className="font-sans text-xl font-bold text-ink">{brl(total)}</span>
        </div>

        <button
          onClick={confirm}
          disabled={lines.length === 0 || busy}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 font-sans text-sm font-semibold text-white disabled:opacity-50"
        >
          <Check size={18} /> {busy ? 'Registrando…' : 'Confirmar venda'}
        </button>
      </aside>
    </div>
  )
}
