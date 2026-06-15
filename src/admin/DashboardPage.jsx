import { useEffect, useMemo, useState } from 'react'
import { getTodaySession, listDailyStock, listWithdrawals, addWithdrawal } from '../lib/cash'
import { listSales, computeTotals } from '../lib/sales'
import OpenCashScreen from './OpenCashScreen'
import NewSaleScreen from './NewSaleScreen'
import CloseCashScreen from './CloseCashScreen'
import { brl } from '../utils'
import { CakeSlice, Sun, Lock, Plus, ArrowDownCircle } from 'lucide-react'

const hoje = () =>
  new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [mode, setMode] = useState('view') // 'view' | 'opening' | 'selling'
  const [stock, setStock] = useState([])
  const [sales, setSales] = useState([])
  const [withdrawals, setWithdrawals] = useState([])

  async function reload() {
    setLoading(true)
    const s = await getTodaySession()
    setSession(s)
    if (s) {
      const [st, sl, wd] = await Promise.all([
        listDailyStock(s.id),
        listSales(s.id),
        listWithdrawals(s.id),
      ])
      setStock(st)
      setSales(sl)
      setWithdrawals(wd)
    }
    setLoading(false)
  }

  async function sangria() {
    const valor = prompt('Valor da retirada (R$):')
    if (!valor) return
    const n = Number(String(valor).replace(',', '.'))
    if (!n || n <= 0) return
    const motivo = prompt('Motivo da retirada (opcional):') || null
    await addWithdrawal(session.id, n, motivo)
    reload()
  }
  useEffect(() => {
    reload().catch((e) => {
      console.error(e)
      setLoading(false)
    })
  }, [])

  const estoque = useMemo(() => {
    const feitos = stock.reduce((s, r) => s + r.qty_initial, 0)
    const vendidos = stock.reduce((s, r) => s + r.qty_sold, 0)
    return { feitos, vendidos, restantes: feitos - vendidos }
  }, [stock])

  const totais = useMemo(() => computeTotals(sales), [sales])

  if (loading) return <p className="font-sans text-sm text-ink/50">Carregando…</p>

  if (mode === 'opening') {
    return (
      <OpenCashScreen
        onOpened={() => {
          setMode('view')
          reload()
        }}
      />
    )
  }

  if (!session || session.status === 'fechado') {
    const jaFechou = session?.status === 'fechado'
    return (
      <div className="mx-auto max-w-md pt-10 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accentLight text-accent">
          {jaFechou ? <Lock size={30} /> : <Sun size={30} />}
        </div>
        <h2 className="font-display text-3xl italic text-ink">
          {jaFechou ? 'Caixa de hoje encerrado' : 'Vamos começar o dia?'}
        </h2>
        <p className="mt-2 font-sans text-sm capitalize text-ink/50">{hoje()}</p>
        <p className="mt-4 font-sans text-sm text-ink/60">
          {jaFechou
            ? 'O caixa de hoje já foi fechado. Amanhã você abre um novo.'
            : 'Para começar o dia, abra o caixa e diga quantos bolos você fez hoje.'}
        </p>
        {!jaFechou && (
          <button
            onClick={() => setMode('opening')}
            className="mt-6 rounded-full bg-accent px-8 py-3 font-sans text-sm font-semibold text-white hover:brightness-105 active:scale-[0.98]"
          >
            Abrir caixa de hoje
          </button>
        )}
      </div>
    )
  }

  if (mode === 'selling') {
    return (
      <NewSaleScreen
        session={session}
        stock={stock}
        onCancel={() => setMode('view')}
        onDone={() => {
          setMode('view')
          reload()
        }}
      />
    )
  }

  if (mode === 'closing') {
    return (
      <CloseCashScreen
        session={session}
        sales={sales}
        withdrawals={withdrawals}
        stock={stock}
        totais={totais}
        estoque={estoque}
        onCancel={() => setMode('view')}
        onClosed={() => {
          setMode('view')
          reload()
        }}
      />
    )
  }

  // Caixa aberto — visão do dia
  return (
    <div>
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="font-display text-2xl italic text-ink">Caixa de hoje</h2>
          <p className="font-sans text-xs capitalize text-ink/45">
            {hoje()} · aberto às{' '}
            {new Date(session.opened_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('selling')}
            className="flex items-center gap-2 rounded-full bg-accent px-5 py-2 font-sans text-sm font-semibold text-white hover:brightness-105"
          >
            <Plus size={16} /> Nova venda
          </button>
          <button
            onClick={sangria}
            className="flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 font-sans text-xs text-ink/60 hover:bg-accentLight"
          >
            <ArrowDownCircle size={15} /> Sangria
          </button>
          <button
            onClick={() => setMode('closing')}
            className="rounded-full border border-ink/15 px-4 py-2 font-sans text-xs text-ink/60 hover:bg-accentLight"
          >
            Fechar caixa
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Faturamento" value={brl(totais.faturamento)} />
        <Metric label="Lucro" value={brl(totais.lucro)} accent />
        <Metric label="Vendas" value={totais.nVendas} />
        <Metric label="Ticket médio" value={brl(totais.ticket)} />
      </div>

      {withdrawals.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 font-sans text-sm text-amber-800">
          {withdrawals.length} sangria(s) hoje ·{' '}
          {brl(withdrawals.reduce((s, w) => s + Number(w.amount), 0))} retirado
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
          <div className="flex items-center gap-2 border-b border-ink/10 px-4 py-3">
            <CakeSlice size={16} className="text-accent" />
            <span className="font-sans text-sm font-semibold text-ink">Produtos do dia</span>
          </div>
          <table className="w-full font-sans text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-ink/40">
                <th className="px-4 py-2 font-medium">Produto</th>
                <th className="px-4 py-2 font-medium">Feito</th>
                <th className="px-4 py-2 font-medium">Vend.</th>
                <th className="px-4 py-2 font-medium">Resta</th>
              </tr>
            </thead>
            <tbody>
              {stock.map((r) => {
                const resta = r.qty_initial - r.qty_sold
                return (
                  <tr key={r.id} className="border-t border-ink/8">
                    <td className="px-4 py-2.5 text-ink">{r.products?.name ?? '—'}</td>
                    <td className="px-4 py-2.5 text-ink/70">{r.qty_initial}</td>
                    <td className="px-4 py-2.5 text-ink/70">{r.qty_sold}</td>
                    <td className={`px-4 py-2.5 font-semibold ${resta === 0 ? 'text-red-500' : 'text-ink'}`}>{resta}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
          <div className="border-b border-ink/10 px-4 py-3">
            <span className="font-sans text-sm font-semibold text-ink">Vendas de hoje</span>
          </div>
          {sales.length === 0 ? (
            <p className="px-4 py-8 text-center font-sans text-sm text-ink/40">
              Nenhuma venda ainda. Toque em “Nova venda”.
            </p>
          ) : (
            <ul className="divide-y divide-ink/8">
              {sales.map((v) => (
                <li key={v.id} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <p className="font-sans text-sm text-ink">
                      {(v.sale_items ?? []).reduce((s, it) => s + it.qty, 0)} itens · {labelPay(v.payment_method)}
                    </p>
                    <p className="font-sans text-[11px] text-ink/40">
                      {new Date(v.sold_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="font-sans text-sm font-semibold text-ink">{brl(Number(v.total))}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function labelPay(m) {
  return { dinheiro: 'Dinheiro', pix: 'Pix', debito: 'Débito', credito: 'Crédito' }[m] ?? m
}

function Metric({ label, value, accent }) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-ink/8">
      <p className="font-sans text-xs text-ink/50">{label}</p>
      <p className={`mt-1 font-sans text-2xl font-bold ${accent ? 'text-accent' : 'text-ink'}`}>{value}</p>
    </div>
  )
}
