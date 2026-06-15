import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, Trash2, MessageCircle } from 'lucide-react'
import { brl } from '../utils'
import { WHATSAPP_NUMBER } from '../config'

const CALDA_CATS = ['fatias', 'potes-copos']
const CALDAS = [null, 'Chocolate', 'Ninho']

export default function CartDrawer({ open, onClose, lines, total, onAdd, onRemove, onDelete, onSetCalda }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    if (open) {
      window.addEventListener('keydown', onKey)
      const sw = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      if (sw > 0) document.body.style.paddingRight = `${sw}px`
    }
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [open, onClose])

  const buildMessage = () => {
    const byCat = {}
    lines.forEach((l) => {
      byCat[l.catName] = byCat[l.catName] || { emoji: l.emoji, rows: [] }
      byCat[l.catName].rows.push(l)
    })
    let msg = '🍰 *Olá! Gostaria de fazer um pedido:*\n'
    Object.entries(byCat).forEach(([catName, { emoji, rows }]) => {
      msg += `\n*${emoji} ${catName}*\n`
      rows.forEach((r) => {
        msg += `- ${r.qty}x ${r.name} — ${brl(r.qty * r.price)}\n`
        if (r.note?.calda) msg += `  🍫 Calda: ${r.note.calda}\n`
        if (r.note?.colher) msg += `  🥄 Com colherzinha\n`
        if (r.note?.obs) msg += `  📝 Obs: ${r.note.obs}\n`
      })
    })
    msg += '━━━━━━━━━━━━━\n'
    msg += `💰 *Total: ${brl(total)}*\n\n`
    msg += 'Aguardo confirmação! 😊'
    return msg
  }

  const sendWhatsApp = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildMessage())}`
    window.open(url, '_blank')
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-ink/40"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-background shadow-drawer"
            role="dialog"
            aria-label="Carrinho"
          >
            <div className="flex items-center justify-between border-b border-accent/15 px-5 py-4">
              <h2 className="font-display text-2xl italic text-ink">Seu pedido</h2>
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink/60 transition-colors hover:bg-accentLight"
              >
                <X size={20} />
              </button>
            </div>

            <div data-lenis-prevent className="flex-1 overflow-y-auto px-5 py-4">
              {lines.length === 0 ? (
                <div className="mt-10 flex flex-col items-center gap-4 text-center">
                  <span className="text-4xl">🧁</span>
                  <p className="font-sans text-sm text-ink/50">
                    Sua sacola está vazia... que tal um docinho?
                  </p>
                  <button
                    onClick={onClose}
                    className="rounded-full border border-accent/40 px-5 py-2.5 font-sans text-sm font-semibold text-accent hover:bg-accentLight"
                  >
                    Voltar ao cardápio
                  </button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {lines.map((l) => (
                    <li
                      key={l.id}
                      className="flex flex-col gap-3 rounded-xl bg-card p-3.5 shadow-card sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-display text-base italic text-ink">{l.name}</p>
                            <p className="font-sans text-xs text-ink/50">{brl(l.price)} cada</p>
                          </div>
                          <button
                            onClick={() => onDelete(l.id)}
                            aria-label="Remover item"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink/30 transition-colors hover:bg-red-50 hover:text-red-500 sm:hidden"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {CALDA_CATS.includes(l.catId) && (
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span className="font-sans text-[10px] text-ink/45">Calda:</span>
                            {CALDAS.map((c) => (
                              <button
                                key={c ?? 'sem'}
                                onClick={() => onSetCalda(l.id, c)}
                                className={`rounded-full border px-2.5 py-1 font-sans text-[11px] font-semibold transition-colors ${
                                  (l.note?.calda ?? null) === c
                                    ? 'border-accent bg-accent text-white'
                                    : 'border-accent/30 text-ink/50 hover:bg-accentLight'
                                }`}
                              >
                                {c === null ? 'Sem' : c === 'Chocolate' ? '🍫 Choc.' : '🥛 Ninho'}
                              </button>
                            ))}
                          </div>
                        )}
                        {l.note?.colher && (
                          <p className="mt-1 font-sans text-[11px] text-ink/45">🥄 Com colherzinha</p>
                        )}
                        {l.note?.obs && (
                          <p className="mt-1 truncate font-sans text-[11px] text-ink/45">📝 {l.note.obs}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-3 border-t border-accent/10 pt-3 sm:border-0 sm:pt-0">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onRemove(l.id)}
                            aria-label="Diminuir"
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-accent/40 text-accent transition-colors hover:bg-accentLight active:scale-95 sm:h-7 sm:w-7"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-6 text-center font-sans text-base font-semibold sm:w-5 sm:text-sm">
                            {l.qty}
                          </span>
                          <button
                            onClick={() => onAdd(l.id)}
                            aria-label="Aumentar"
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white transition hover:brightness-105 active:scale-95 sm:h-7 sm:w-7"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <div className="text-right font-sans text-base font-bold text-ink sm:w-16 sm:text-sm sm:font-semibold">
                          {brl(l.qty * l.price)}
                        </div>
                        <button
                          onClick={() => onDelete(l.id)}
                          aria-label="Remover item"
                          className="hidden text-ink/30 transition-colors hover:text-red-500 sm:block"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {lines.length > 0 && (
              <div className="border-t border-accent/15 bg-background px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-sans text-sm text-ink/60">Total</span>
                  <span className="font-sans text-xl font-bold text-ink">{brl(total)}</span>
                </div>
                <button
                  onClick={sendWhatsApp}
                  className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 font-sans text-base font-semibold text-white transition-transform active:scale-[0.98]"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <MessageCircle size={20} /> Pedir via WhatsApp
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
