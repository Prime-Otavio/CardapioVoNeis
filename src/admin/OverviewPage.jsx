import { useEffect, useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line,
} from 'recharts'
import { reportDaily, reportTopProducts, reportByPayment, daysAgo, today } from '../lib/reports'
import { brl } from '../utils'
import { BarChart3 } from 'lucide-react'

const PAY_LABEL = { dinheiro: 'Dinheiro', pix: 'Pix', debito: 'Débito', credito: 'Crédito' }
const PERIODOS = [
  { id: 7, label: '7 dias' },
  { id: 30, label: '30 dias' },
  { id: 90, label: '90 dias' },
]

export default function OverviewPage() {
  const [dias, setDias] = useState(7)
  const [daily, setDaily] = useState([])
  const [top, setTop] = useState([])
  const [pay, setPay] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const start = daysAgo(dias - 1)
    const end = today()
    setLoading(true)
    Promise.all([reportDaily(start, end), reportTopProducts(start, end), reportByPayment(start, end)])
      .then(([d, t, p]) => {
        setDaily(d)
        setTop(t)
        setPay(p)
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [dias])

  const totais = useMemo(() => {
    const faturamento = daily.reduce((s, d) => s + d.faturamento, 0)
    const lucro = daily.reduce((s, d) => s + d.lucro, 0)
    const vendas = daily.reduce((s, d) => s + d.vendas, 0)
    const ticket = vendas ? faturamento / vendas : 0
    return { faturamento, lucro, vendas, ticket }
  }, [daily])

  const chartData = useMemo(
    () =>
      daily.map((d) => ({
        dia: new Date(d.dia + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        Faturamento: d.faturamento,
        Lucro: d.lucro,
      })),
    [daily]
  )

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-accent" />
          <h2 className="font-display text-2xl italic text-ink">Visão geral</h2>
        </div>
        <div className="flex gap-1.5">
          {PERIODOS.map((p) => (
            <button
              key={p.id}
              onClick={() => setDias(p.id)}
              className={`rounded-full px-3 py-1.5 font-sans text-xs font-semibold transition-colors ${
                dias === p.id ? 'bg-accent text-white' : 'border border-ink/15 text-ink/60 hover:bg-accentLight'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="font-sans text-sm text-ink/50">Carregando…</p>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric label="Faturamento" value={brl(totais.faturamento)} />
            <Metric label="Lucro" value={brl(totais.lucro)} accent />
            <Metric label="Vendas" value={totais.vendas} />
            <Metric label="Ticket médio" value={brl(totais.ticket)} />
          </div>

          <div className="mb-5 rounded-xl border border-ink/10 bg-white p-4">
            <p className="mb-3 font-sans text-sm font-semibold text-ink">Faturamento e lucro por dia</p>
            {chartData.length === 0 ? (
              <Vazio />
            ) : (
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
                    <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#9a8478' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9a8478' }} />
                    <Tooltip formatter={(v) => brl(v)} />
                    <Line type="monotone" dataKey="Faturamento" stroke="#D96A85" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Lucro" stroke="#1D9E75" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-ink/10 bg-white p-4">
              <p className="mb-3 font-sans text-sm font-semibold text-ink">Produtos mais vendidos</p>
              {top.length === 0 ? (
                <Vazio />
              ) : (
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart data={top} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#9a8478' }} />
                      <YAxis type="category" dataKey="produto" width={120} tick={{ fontSize: 10, fill: '#5a4636' }} />
                      <Tooltip formatter={(v) => `${v} un`} />
                      <Bar dataKey="qtd" fill="#D96A85" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-ink/10 bg-white p-4">
              <p className="mb-3 font-sans text-sm font-semibold text-ink">Recebido por forma de pagamento</p>
              {pay.length === 0 ? (
                <Vazio />
              ) : (
                <ul className="space-y-2">
                  {pay.map((p) => {
                    const total = pay.reduce((s, x) => s + x.total, 0)
                    const pct = total ? (p.total / total) * 100 : 0
                    return (
                      <li key={p.forma}>
                        <div className="mb-1 flex items-center justify-between font-sans text-sm">
                          <span className="text-ink/70">{PAY_LABEL[p.forma] ?? p.forma}</span>
                          <span className="font-semibold text-ink">{brl(p.total)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-ink/8">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Metric({ label, value, accent }) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-ink/8">
      <p className="font-sans text-xs text-ink/50">{label}</p>
      <p className={`mt-1 font-sans text-2xl font-bold ${accent ? 'text-accent' : 'text-ink'}`}>{value}</p>
    </div>
  )
}

function Vazio() {
  return <p className="py-10 text-center font-sans text-sm text-ink/40">Sem vendas no período.</p>
}
