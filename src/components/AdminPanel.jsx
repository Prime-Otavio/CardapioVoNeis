import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, X, RotateCcw, LogOut } from 'lucide-react'
import { ADMIN_PIN } from '../config'

export default function AdminPanel({ adminMode, onEnter, onExit, onReset }) {
  const [askPin, setAskPin] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setAskPin(false)
    if (askPin) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [askPin])

  const submit = (e) => {
    e.preventDefault()
    if (pin === ADMIN_PIN) {
      onEnter()
      setAskPin(false)
      setPin('')
      setError(false)
    } else {
      setError(true)
      setPin('')
    }
  }

  return (
    <>
      {!adminMode && (
        <button
          onClick={() => setAskPin(true)}
          aria-label="Modo administrador"
          className="fixed bottom-4 left-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-card/80 text-ink/40 shadow-card backdrop-blur transition-colors hover:text-ink/70"
          style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <Settings size={18} />
        </button>
      )}

      {adminMode && (
        <div className="sticky top-[57px] z-20 bg-accent text-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2">
            <span className="font-sans text-xs font-semibold uppercase tracking-wider">
              ⚙ Modo Estoque do Dia ativo
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onReset}
                className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 font-sans text-xs font-medium hover:bg-white/30"
              >
                <RotateCcw size={13} /> Resetar tudo
              </button>
              <button
                onClick={onExit}
                className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 font-sans text-xs font-medium hover:bg-white/30"
              >
                <LogOut size={13} /> Sair
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {askPin && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAskPin(false)}
              className="fixed inset-0 z-50 bg-ink/40"
              style={{ backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="fixed left-1/2 top-1/2 z-50 w-[90%] max-w-xs -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card p-6 shadow-drawer"
              role="dialog"
              aria-label="PIN de administrador"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-2xl italic text-ink">Acesso restrito</h3>
                <button
                  onClick={() => setAskPin(false)}
                  aria-label="Fechar"
                  className="text-ink/40 hover:text-ink/70"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={submit}>
                <input
                  autoFocus
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value)
                    setError(false)
                  }}
                  placeholder="PIN"
                  className="w-full rounded-xl border border-accent/30 bg-background px-4 py-3 text-center font-sans text-lg tracking-[0.4em] text-ink outline-none focus:border-accent"
                />
                {error && (
                  <p className="mt-2 text-center font-sans text-xs text-red-500">PIN incorreto</p>
                )}
                <button
                  type="submit"
                  className="mt-4 w-full rounded-full bg-accent py-3 font-sans text-sm font-semibold text-white hover:brightness-105"
                >
                  Entrar
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
