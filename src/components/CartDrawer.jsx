import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, Trash2, MessageCircle } from 'lucide-react'
import { brl } from '../utils'
import { WHATSAPP_NUMBER } from '../config'

export default function CartDrawer({ open, onClose, lines, total, onAdd, onRemove, onDelete }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
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
            className="fixed inset-0 z-40 bg-ink/30"
            style={{ backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
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

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {lines.length === 0 ? (
                <p className="mt-10 text-center font-sans text-sm text-ink/50">
                  Seu carrinho está vazio.
                </p>
              ) : (
                <ul className="space-y-3">
                  {lines.map((l) => (
                    <li
                      key={l.id}
                      className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-card"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-base italic text-ink">{l.name}</p>
                        <p className="font-sans text-xs text-ink/50">{brl(l.price)} cada</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onRemove(l.id)}
                          aria-label="Diminuir"
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-accent/40 text-accent hover:bg-accentLight"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-5 text-center font-sans text-sm font-semibold">{l.qty}</span>
                        <button
                          onClick={() => onAdd(l.id)}
                          aria-label="Aumentar"
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white hover:brightness-105"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="w-16 text-right font-sans text-sm font-semibold text-ink">
                        {brl(l.qty * l.price)}
                      </div>
                      <button
                        onClick={() => onDelete(l.id)}
                        aria-label="Remover item"
                        className="text-ink/30 transition-colors hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
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
