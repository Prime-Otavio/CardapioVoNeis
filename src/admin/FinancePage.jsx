import { useEffect, useMemo, useState } from 'react'
import {
  EXPENSE_CATEGORIES,
  monthRange,
  listExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  financialResult,
} from '../lib/finance'
import { brl } from '../utils'
import { Wallet, Plus, Trash2, Pencil, TrendingUp, TrendingDown } from 'lucide-react'
import { usePin } from './PinGate'

function currentYM() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const emptyDraft = () => ({
  expense_date: new Date().toISOString().slice(0, 10),
  category: 'Ingredientes',
  description: '',
  amount: '',
})

export default function FinancePage() {
  const [ym, setYm] = useState(currentYM())
  const [result, setResult] = useState({ faturamento: 0, cmv: 0, despesas: 0, lucro: 0 })
  const [expenses, setExpenses] = useState([])
  const [draft, setDraft] = useState(emptyDraft())
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null) // id do gasto em edição
  const { requirePin } = usePin()

  const range = useMemo(() => monthRange(ym), [ym])

  async function reload() {
    const [res, exp] = await Promise.all([
      financialResult(range.start, range.end),
      listExpenses(range.start, range.end),
    ])
    setResult(res)
    setExpenses(exp)
  }
  useEffect(() => {
    reload().catch((e) => console.error(e))
  }, [ym])

  async function save(e) {
    e.preventDefault()
    const amount = Number(String(draft.amount).replace(',', '.') || 0)
    if (!amount || amount <= 0) return
    const fields = {
      expense_date: draft.expense_date,
      category: draft.category,
      description: draft.description.trim() || null,
      amount,
    }
    if (editId) {
      await updateExpense(editId, fields)
    } else {
      await addExpense(fields)
    }
    setDraft(emptyDraft())
    setShowForm(false)
    setEditId(null)
    reload()
  }

  function startEdit(exp) {
    setDraft({
      expense_date: exp.expense_date,
      category: exp.category,
      description: exp.description || '',
      amount: String(exp.amount),
    })
    setEditId(exp.id)
    setShowForm(true)
  }

  function remove(id) {
    requirePin(async () => {
      if (!confirm('Remover este gasto?')) return
      await deleteExpense(id)
      reload()
    }, 'Excluir um gasto exige o PIN do dono.')
  }

  const margem = result.faturamento > 0 ? (result.lucro / result.faturamento) * 100 : 0
  const mesLabel = new Date(range.start + 'T12:00:00').toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet size={20} className="text-accent" />
          <h2 className="font-display text-2xl italic text-ink">Financeiro</h2>
        </div>
        <input
          type="month"
          value={ym}
          onChange={(e) => setYm(e.target.value)}
          className="rounded-lg border border-ink/15 px-3 py-1.5 font-sans text-sm outline-none focus:border-accent"
        />
      </div>
      <p className="mb-5 font-sans text-sm capitalize text-ink/55">Resultado de {mesLabel}</p>

      <div className="mb-4 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
        <Line label="Faturamento" value={brl(result.faturamento)} />
        <Line label="− Custo dos produtos (ingredientes)" value={brl(result.cmv)} muted />
        <Line label="− Despesas do mês" value={brl(result.despesas)} muted />
        <div className="my-3 border-t border-ink/10" />
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-sans text-base font-semibold text-ink">
            {result.lucro >= 0 ? (
              <TrendingUp size={18} className="text-green-600" />
            ) : (
              <TrendingDown size={18} className="text-red-500" />
            )}
            Lucro do mês
          </span>
          <span className={`font-sans text-2xl font-bold ${result.lucro >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {brl(result.lucro)}
          </span>
        </div>
        {result.faturamento > 0 && (
          <p className="mt-1 text-right font-sans text-xs text-ink/45">margem de {margem.toFixed(0)}%</p>
        )}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-sans text-sm font-semibold text-ink">Gastos do mês</h3>
        <button
          onClick={() => {
            if (showForm) {
              setShowForm(false)
            } else {
              setDraft(emptyDraft())
              setEditId(null)
              setShowForm(true)
            }
          }}
          className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 font-sans text-sm font-semibold text-white"
        >
          <Plus size={16} /> Lançar gasto
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} className="mb-4 rounded-2xl border border-ink/10 bg-white p-4 shadow-sm">
          <p className="mb-3 font-sans text-sm font-semibold text-ink">
            {editId ? 'Editar gasto' : 'Novo gasto'}
          </p>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-sans text-xs text-ink/60">Data</label>
              <input
                type="date" value={draft.expense_date}
                onChange={(e) => setDraft({ ...draft, expense_date: e.target.value })}
                className="w-full rounded-lg border border-ink/15 px-3 py-2.5 font-sans text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1 block font-sans text-xs text-ink/60">Categoria</label>
              <select
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                className="w-full rounded-lg border border-ink/15 px-3 py-2.5 font-sans text-sm outline-none focus:border-accent"
              >
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-3 grid grid-cols-[1fr_120px] gap-3">
            <div>
              <label className="mb-1 block font-sans text-xs text-ink/60">Descrição (opcional)</label>
              <input
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="Ex: botijão de gás"
                className="w-full rounded-lg border border-ink/15 px-3 py-2.5 font-sans text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1 block font-sans text-xs text-ink/60">Valor (R$)</label>
              <input
                value={draft.amount}
                onChange={(e) => setDraft({ ...draft, amount: e.target.value.replace(',', '.') })}
                inputMode="decimal" placeholder="0,00"
                className="w-full rounded-lg border border-ink/15 px-3 py-2.5 font-sans text-sm outline-none focus:border-accent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="rounded-full bg-accent px-5 py-2.5 font-sans text-sm font-semibold text-white">Salvar gasto</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-ink/15 px-5 py-2.5 font-sans text-sm text-ink/60">Cancelar</button>
          </div>
        </form>
      )}

      <ul className="space-y-2">
        {expenses.map((e) => (
          <li key={e.id} className="flex items-center gap-3 rounded-xl border border-ink/10 bg-white px-4 py-3">
            <span className="rounded-full bg-accentLight px-2.5 py-1 font-sans text-[11px] font-semibold text-accent">{e.category}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-sans text-sm text-ink">{e.description || e.category}</p>
              <p className="font-sans text-xs text-ink/45">
                {new Date(e.expense_date + 'T12:00:00').toLocaleDateString('pt-BR')}
              </p>
            </div>
            <span className="font-sans text-sm font-semibold text-ink">{brl(Number(e.amount))}</span>
            <button onClick={() => startEdit(e)} className="text-ink/40 hover:text-accent"><Pencil size={15} /></button>
            <button onClick={() => remove(e.id)} className="text-ink/30 hover:text-red-500"><Trash2 size={16} /></button>
          </li>
        ))}
        {expenses.length === 0 && (
          <li className="rounded-xl border border-dashed border-ink/15 py-10 text-center font-sans text-sm text-ink/40">
            Nenhum gasto lançado neste mês.
          </li>
        )}
      </ul>
    </div>
  )
}

function Line({ label, value, muted }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={`font-sans text-sm ${muted ? 'text-ink/55' : 'text-ink/70'}`}>{label}</span>
      <span className="font-sans text-sm font-medium text-ink">{value}</span>
    </div>
  )
}
