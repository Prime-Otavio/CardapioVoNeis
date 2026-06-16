import { useState } from 'react'
import { verifyPin, setPin } from '../lib/pin'
import { Settings, KeyRound, Check } from 'lucide-react'

export default function SettingsPage() {
  const [current, setCurrent] = useState('')
  const [novo, setNovo] = useState('')
  const [confirma, setConfirma] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [err, setErr] = useState(null)

  async function salvar(e) {
    e.preventDefault()
    setErr(null)
    setMsg(null)
    if (novo.length < 4) {
      setErr('O novo PIN deve ter ao menos 4 dígitos.')
      return
    }
    if (novo !== confirma) {
      setErr('A confirmação não bate com o novo PIN.')
      return
    }
    setBusy(true)
    try {
      const ok = await verifyPin(current)
      if (!ok) {
        setErr('PIN atual incorreto.')
        setBusy(false)
        return
      }
      await setPin(novo)
      setMsg('PIN atualizado com sucesso!')
      setCurrent('')
      setNovo('')
      setConfirma('')
    } catch (e) {
      console.error(e)
      setErr('Erro ao salvar o PIN.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-1 flex items-center gap-2">
        <Settings size={20} className="text-accent" />
        <h2 className="font-display text-2xl italic text-ink">Configurações</h2>
      </div>
      <p className="mb-5 font-sans text-sm text-ink/55">
        Gerencie o PIN do dono, usado para liberar ações sensíveis (excluir vendas, gastos, reabrir caixa, etc.).
      </p>

      <form onSubmit={salvar} className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accentLight text-accent">
            <KeyRound size={18} />
          </div>
          <h3 className="font-sans text-sm font-semibold text-ink">Trocar PIN</h3>
        </div>

        <label className="mb-1 block font-sans text-xs text-ink/60">PIN atual</label>
        <input
          type="password" inputMode="numeric" value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className="mb-3 w-full rounded-lg border border-ink/15 px-3 py-2.5 text-center font-sans text-lg tracking-widest outline-none focus:border-accent"
        />

        <label className="mb-1 block font-sans text-xs text-ink/60">Novo PIN (mín. 4 dígitos)</label>
        <input
          type="password" inputMode="numeric" value={novo}
          onChange={(e) => setNovo(e.target.value)}
          className="mb-3 w-full rounded-lg border border-ink/15 px-3 py-2.5 text-center font-sans text-lg tracking-widest outline-none focus:border-accent"
        />

        <label className="mb-1 block font-sans text-xs text-ink/60">Confirmar novo PIN</label>
        <input
          type="password" inputMode="numeric" value={confirma}
          onChange={(e) => setConfirma(e.target.value)}
          className="mb-4 w-full rounded-lg border border-ink/15 px-3 py-2.5 text-center font-sans text-lg tracking-widest outline-none focus:border-accent"
        />

        {err && <p className="mb-3 font-sans text-sm text-red-500">{err}</p>}
        {msg && (
          <p className="mb-3 flex items-center gap-1.5 font-sans text-sm text-green-600">
            <Check size={16} /> {msg}
          </p>
        )}

        <button
          type="submit" disabled={busy}
          className="rounded-full bg-accent px-6 py-2.5 font-sans text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? 'Salvando…' : 'Salvar novo PIN'}
        </button>
      </form>
    </div>
  )
}
