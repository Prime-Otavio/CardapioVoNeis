import { useMemo, useState } from 'react'
import { closeCash } from '../lib/cash'
import { brl } from '../utils'
import { X, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react'

const PAY_LABEL = { dinheiro: 'Dinheiro', pix: 'Pix', debito: 'Débito', credito: 'Crédito' }

export default function CloseCashScreen({
  session,
  sales,
  withdrawals,
  stock = [],
  totais,
  estoque,
  onClosed,
  onCancel,
}) {
  const [counted, setCounted] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)

  const porPagamento = useMemo(() => {
    const m = { dinheiro: 0, pix: 0, debito: 0, credito: 0 }
    sales.forEach((v) => {
      m[v.payment_method] = (m[v.payment_method] || 0) + Number(v.total)
    })
    return m
  }, [sales])

  const totalSangrias = useMemo(
    () => withdrawals.reduce((s, w) => s + Number(w.amount), 0),
    [withdrawals]
  )

  const trocoInicial = Number(session.opening_float || 0)
  const esperado = trocoInicial + porPagamento.dinheiro - totalSangrias

  const contado = counted === '' ? null : Number(counted)
  const diff = contado === null ? null : contado - esperado
  const bateu = diff !== null && Math.abs(diff) < 0.005

  async function confirmar() {
    setBusy(true)
    try {
      await closeCash(session.id, { countedCash: contado, diff, notes: notes.trim() || null })
      onClosed()
    } catch (e) {
      console.error(e)
      alert('Não foi possível fechar o caixa: ' + (e.message || 'erro'))
      setBusy(false)
    }
  }

  const sobrouEstoque = (estoque?.restantes ?? 0) > 0

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl italic text-ink">Fechamento de caixa</h2>
          <p className="font-sans text-xs text-ink/45">
            Confira os números do dia antes de encerrar.
          </p>
        </div>
        <button onClick={onCancel} className="flex items-center gap-1 text-sm text-ink/50 hover:text-ink">
          <X size={16} /> Voltar
        </button>
      </div>

      <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-600" />
        <div className="font-sans text-sm text-amber-800">
          <p className="font-semibold">Isto encerra o caixa de hoje.</p>
          <p className="mt-0.5 text-amber-700">
            Depois de fechar, não dá pra lançar novas vendas no dia de hoje. O resumo abaixo fica salvo
            no histórico. Amanhã você abre um caixa novo.
            {sobrouEstoque &&
              ` Atenção: ainda restam ${estoque.restantes} produto(s) sem vender hoje.`}
          </p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card label="Vendas" value={totais?.nVendas ?? 0} />
        <Card label="Faturamento" value={brl(totais?.faturamento ?? 0)} />
        <Card label="Lucro" value={brl(totais?.lucro ?? 0)} accent />
        <Card label="Ticket médio" value={brl(totais?.ticket ?? 0)} />
      </div>

      <div className="mb-4 rounded-xl border border-ink/10 bg-white p-4">
        <p className="mb-2 font-sans text-sm font-semibold text-ink">Recebido por forma de pagamento</p>
        <table className="w-full font-sans text-sm">
          <tbody>
            {Object.entries(porPagamento).map(([k, v]) => (
              <tr key={k} className="border-t border-ink/8 first:border-0">
                <td className="py-1.5 text-ink/60">{PAY_LABEL[k]}</td>
                <td className="py-1.5 text-right font-medium text-ink">{brl(v)}</td>
              </tr>
            ))}
            <tr className="border-t border-ink/15">
              <td className="py-1.5 font-semibold text-ink">Total</td>
              <td className="py-1.5 text-right font-bold text-ink">{brl(totais?.faturamento ?? 0)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mb-5 rounded-xl border border-ink/10 bg-white p-4">
        <p className="mb-3 font-sans text-sm font-semibold text-ink">Conferência do dinheiro na gaveta</p>
        <Row label="Troco inicial (abertura)" value={brl(trocoInicial)} />
        <Row label="+ Vendas em dinheiro" value={brl(porPagamento.dinheiro)} />
        <Row label="− Sangrias / retiradas" value={brl(totalSangrias)} />
        <div className="my-2 border-t border-ink/10" />
        <Row label="= Dinheiro que deveria ter" value={brl(esperado)} bold />

        <label className="mt-4 mb-1 block font-sans text-sm text-ink/70">
          Conte o dinheiro físico e digite o valor:
        </label>
        <div className="flex items-center gap-2">
          <span className="font-sans text-sm text-ink/50">R$</span>
          <input
            value={counted}
            onChange={(e) => setCounted(e.target.value.replace(',', '.'))}
            inputMode="decimal"
            placeholder="0,00"
            className="w-40 rounded-lg border border-accent/30 px-3 py-2.5 font-sans text-sm outline-none focus:border-accent"
          />
        </div>

        {diff !== null && (
          <div
            className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2.5 font-sans text-sm ${
              bateu
                ? 'bg-green-50 text-green-700'
                : diff > 0
                ? 'bg-amber-50 text-amber-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {bateu ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span className="font-medium">
              {bateu
                ? 'Conferido — o dinheiro bateu certinho.'
                : diff > 0
                ? `Sobrou ${brl(diff)} na gaveta a mais do que o esperado.`
                : `Faltou ${brl(-diff)} na gaveta.`}
            </span>
          </div>
        )}

        {diff !== null && !bateu && (
          <>
            <label className="mt-3 mb-1 block font-sans text-xs text-ink/60">
              Observação sobre a diferença (recomendado):
            </label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: dei troco a mais numa venda"
              className="w-full rounded-lg border border-ink/15 px-3 py-2 font-sans text-sm outline-none focus:border-accent"
            />
          </>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 rounded-full border border-ink/15 py-3 font-sans text-sm font-semibold text-ink/60 hover:bg-accentLight"
        >
          Cancelar
        </button>
        <button
          onClick={confirmar}
          disabled={busy || contado === null}
          className="flex flex-[2] items-center justify-center gap-2 rounded-full bg-accent py-3 font-sans text-sm font-semibold text-white disabled:opacity-50"
        >
          <Lock size={18} /> {busy ? 'Encerrando…' : 'Encerrar caixa de hoje'}
        </button>
      </div>
      {contado === null && (
        <p className="mt-2 text-center font-sans text-xs text-ink/40">
          Digite o valor contado para liberar o fechamento.
        </p>
      )}
    </div>
  )
}

function Card({ label, value, accent }) {
  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-ink/8">
      <p className="font-sans text-[11px] text-ink/50">{label}</p>
      <p className={`mt-0.5 font-sans text-lg font-bold ${accent ? 'text-accent' : 'text-ink'}`}>{value}</p>
    </div>
  )
}

function Row({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={`font-sans text-sm ${bold ? 'font-semibold text-ink' : 'text-ink/60'}`}>{label}</span>
      <span className={`font-sans text-sm ${bold ? 'font-bold text-ink' : 'text-ink/80'}`}>{value}</span>
    </div>
  )
}
