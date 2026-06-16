import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { verifyPin } from '../lib/pin'
import { Lock, X } from 'lucide-react'

const PinContext = createContext(null)

// Provider que dá a função requirePin(fn, descricao).
// Ao chamar, abre um modal pedindo o PIN; se correto, executa fn.
export function PinProvider({ children }) {
  const [open, setOpen] = useState(false)
  const [desc, setDesc] = useState('')
  const [pin, setPinValue] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const actionRef = useRef(null)

  const requirePin = useCallback((fn, descricao = 'Esta ação exige o PIN do dono.') => {
    actionRef.current = fn
    setDesc(descricao)
    setPinValue('')
    setError(null)
    setOpen(true)
  }, [])

  function cancel() {
    setOpen(false)
    actionRef.current = null
  }

  async function confirm(e) {
    e?.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const ok = await verifyPin(pin)
      if (!ok) {
        setError('PIN incorreto.')
        setBusy(false)
        return
      }
      const fn = actionRef.current
      setOpen(false)
      actionRef.current = null
      setBusy(false)
      if (fn) await fn()
    } catch (err) {
      console.error(err)
      setError('Erro ao verificar o PIN.')
      setBusy(false)
    }
  }

  return (
    <PinContext.Provider value={{ requirePin }}>
      {children}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <form
            onSubmit={confirm}
            className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accentLight text-accent">
                  <Lock size={16} />
                </div>
                <h3 className="font-sans text-sm font-semibold text-ink">PIN do dono</h3>
              </div>
              <button type="button" onClick={cancel} className="text-ink/40 hover:text-ink">
                <X size={18} />
              </button>
            </div>
            <p className="mb-3 font-sans text-xs text-ink/55">{desc}</p>
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={(e) => setPinValue(e.target.value)}
              placeholder="• • • • • •"
              className="mb-2 w-full rounded-lg border border-accent/30 px-3 py-2.5 text-center font-sans text-lg tracking-widest outline-none focus:border-accent"
            />
            {error && <p className="mb-2 font-sans text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={busy || !pin}
              className="w-full rounded-full bg-accent py-2.5 font-sans text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? 'Verificando…' : 'Confirmar'}
            </button>
          </form>
        </div>
      )}
    </PinContext.Provider>
  )
}

export function usePin() {
  const ctx = useContext(PinContext)
  if (!ctx) return { requirePin: (fn) => fn() } // fallback: sem proteção
  return ctx
}
