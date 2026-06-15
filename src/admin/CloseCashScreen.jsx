import { useMemo, useState } from 'react'
import { closeCash } from '../lib/cash'
import { brl } from '../utils'
import { X, Lock } from 'lucide-react'

const PAY_LABEL = { dinheiro: 'Dinheiro', pix: 'Pix', debito: 'Débito', credito: 'Crédito' }

// Tela de fechamento: resumo por pagamento + conferência do dinheiro.
// session: sessão atual (tem opening_float)
// sales: vendas do dia · withdrawals: sangrias
export default function CloseCashScreen({ session, sales, withdrawals, onClosed, onCancel }) {
  const [counted, setCounted] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)

  // Totais por forma de pagamento
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

  // Dinheiro esperado na gaveta = troco inicial + vendas em dinheiro - sangrias
  const esperado = trocoInicial + porPagamento.dinheiro - totalSangrias

  const contado = counted === '' ? null : Number(counted)
  const diff = contado === null ? null : contado - esperado

  async function confirmar() {
    setBusy(true)
    try {
      await closeCash(session.id, {
        countedCash: contado,
        diff,
        notes: notes.trim() || null,
      })
      onClosed()
    } catch (e) {
      console.error(e)
      alert('Não foi possível fechar o caixa: ' + (e.message || 'erro'))
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl italic text-ink">Fechar caixa</h2>
        <button onClick={onCancel} className="flex items-center gap-1 text-sm text-ink/50 hover:text-ink">
          <X size={16} /> Voltar
        </button>
      </div>

      <div className="mb-4 rounded-xl border border-ink/10 bg-white p-4">
        <p className="mb-2 font-sans text-sm font-semibold text-ink">Resumo por pagamento</p>
        <table className="w-full font-sans text-sm">
          <tbody>
            {Object.entries(porPagamento).map(([k, v]) => (
              <tr key={k} className="border-t border-ink/8 first:border-0">
                <td className="py-1.5 text-ink/60">{PAY_LABEL[k]}</td>
                <td className="py-1.5 text-right font-medium text-ink">{brl(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-4 rounded-xl border border-ink/10 bg-white p-4">
        <p className="mb-3 font-sans text-sm font-semibold text-ink">Conferência do dinheiro</p>
        <Row label="Troco inicial" value={brl(trocoInicial)} />
        <Row label="+ Vendas em dinheiro" value={brl(porPagamento.dinheiro)} />
        <Row label="− Sangrias" value={brl(totalSangrias)} />
        <div className="my-2 border-t border-ink/10" />
        <Row label="Dinheiro esperado na gaveta" value={brl(esperado)} bold />

        <label className="mt-4 mb-1 block font-sans text-sm text-ink/70">
          Quanto tem de dinheiro na gaveta agora?
        </label>
        <input
          value={counted}
          onChange={(e) => setCounted(e.target.value.replace(',', '.'))}
          inputMode="decimal"
          placeholder="0,00"
          className="w-full rounded-lg border border-accent/30 px-3 py-2.5 font-sans text-sm outline-none focus:border-accent"
        />

        {diff !== null && (
          <div
            className={`mt-3 rounded-lg px-3 py-2.5 font-sans text-sm ${
              Math.abs(diff) < 0.005
                ? 'bg-green-50 text-green-700'
                : diff > 0
                ? 'bg-amber-50 text-amber-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {Math.abs(diff) < 0.005
              ? '✓ Bateu certinho!'
              : diff > 0
              ? `Sobrou ${brl(diff)} na gaveta.`
              : `Faltou ${brl(-diff)} na gaveta.`}
          </div>
        )}

        {diff !== null && Math.abs(diff) >= 0.005 && (
          <>
            <label className="mt-3 mb-1 block font-sans text-xs text-ink/60">
              Observação (opcional) — o que explica a diferença?
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

      <button
        onClick={confirmar}
        disabled={busy || contado === null}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 font-sans text-sm font-semibold text-white disabled:opacity-50"
      >
        <Lock size={18} /> {busy ? 'Fechando…' : 'Confirmar fechamento'}
      </button>
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
