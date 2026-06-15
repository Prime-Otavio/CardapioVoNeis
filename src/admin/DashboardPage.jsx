import { useEffect, useMemo, useState } from 'react'
import { getTodaySession, listDailyStock, closeCash } from '../lib/cash'
import OpenCashScreen from './OpenCashScreen'
import { brl } from '../utils'
import { CakeSlice, Sun, Lock } from 'lucide-react'

const hoje = () =>
  new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [opening, setOpening] = useState(false)
  const [stock, setStock] = useState([])

  async function reload() {
    setLoading(true)
    const s = await getTodaySession()
    setSession(s)
    if (s) setStock(await listDailyStock(s.id))
    setLoading(false)
  }
  useEffect(() => {
    reload().catch((e) => {
      console.error(e)
      setLoading(false)
    })
  }, [])

  const totals = useMemo(() => {
    const feitos = stock.reduce((s, r) => s + r.qty_initial, 0)
    const vendidos = stock.reduce((s, r) => s + r.qty_sold, 0)
    const restantes = feitos - vendidos
    const potencial = stock.reduce(
      (s, r) => s + (r.qty_initial - r.qty_sold) * Number(r.products?.price ?? 0),
      0
    )
    return { feitos, vendidos, restantes, potencial }
  }, [stock])

  if (loading) {
    return <p className="font-sans text-sm text-ink/50">Carregando…</p>
  }

  // Estado: abrindo o caixa
  if (opening) {
    return (
      <OpenCashScreen
        onOpened={(s) => {
          setOpening(false)
          setSession(s)
          reload()
        }}
      />
    )
  }

  // Estado: caixa fechado (ainda não aberto hoje)
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
            onClick={() => setOpening(true)}
            className="mt-6 rounded-full bg-accent px-8 py-3 font-sans text-sm font-semibold text-white hover:brightness-105 active:scale-[0.98]"
          >
            Abrir caixa de hoje
          </button>
        )}
      </div>
    )
  }

  // Estado: caixa aberto — produtos do dia
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
        <button
          onClick={async () => {
            if (!confirm('Fechar o caixa de hoje?')) return
            await closeCash(session.id)
            reload()
          }}
          className="rounded-full border border-ink/15 px-4 py-2 font-sans text-xs text-ink/60 hover:bg-accentLight"
        >
          Fechar caixa
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Feitos hoje" value={totals.feitos} />
        <Metric label="Vendidos" value={totals.vendidos} />
        <Metric label="Restantes" value={totals.restantes} accent />
        <Metric label="A vender (R$)" value={brl(totals.potencial)} />
      </div>

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
              <th className="px-4 py-2 font-medium">Vendido</th>
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
                  <td className={`px-4 py-2.5 font-semibold ${resta === 0 ? 'text-red-500' : 'text-ink'}`}>
                    {resta}
                  </td>
                </tr>
              )
            })}
            {stock.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink/40">
                  Nenhum produto no caixa de hoje.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 font-sans text-xs text-ink/40">
        O lançamento de vendas (dar baixa no estoque) chega na próxima etapa.
      </p>
    </div>
  )
}

function Metric({ label, value, accent }) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-ink/8">
      <p className="font-sans text-xs text-ink/50">{label}</p>
      <p className={`mt-1 font-sans text-2xl font-bold ${accent ? 'text-accent' : 'text-ink'}`}>
        {value}
      </p>
    </div>
  )
}
