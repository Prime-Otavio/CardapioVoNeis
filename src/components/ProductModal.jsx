import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, MessageCircle, ShoppingBag, UtensilsCrossed } from 'lucide-react'
import { brl } from '../utils'
import { WHATSAPP_NUMBER } from '../config'

// Categorias em que faz sentido oferecer colherzinha
const SPOON_CATS = ['fatias', 'delicias-pote']

export default function ProductModal({ item, onClose, onAddToCart }) {
  const [qty, setQty] = useState(1)
  const [colher, setColher] = useState(false)
  const [obs, setObs] = useState('')

  const open = !!item

  useEffect(() => {
    if (open) {
      setQty(1)
      setColher(false)
      setObs('')
    }
  }, [open, item?.id])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    if (open) window.addEventListener('keydown', onKey)
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!item) return null

  const showSpoon = SPOON_CATS.includes(item.catId)
  const subtotal = item.price * qty

  const buildDirectMessage = () => {
    let msg = '🍰 *Olá! Gostaria de fazer um pedido:*\n\n'
    msg += `- ${qty}x ${item.name} — ${brl(subtotal)}\n`
    if (showSpoon && colher) msg += '🥄 Com colherzinha, por favor\n'
    if (obs.trim()) msg += `📝 Obs: ${obs.trim()}\n`
    msg += `\n💰 *Total: ${brl(subtotal)}*\n\nAguardo confirmação! 😊`
    return msg
  }

  const orderNow = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildDirectMessage())}`
    window.open(url, '_blank')
  }

  const addToCart = () => {
    onAddToCart(item.id, qty, { colher: showSpoon && colher, obs: obs.trim() })
    onClose()
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
            style={{ backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-background shadow-drawer"
            role="dialog"
            aria-label={item.name}
          >
            <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-accentLight/60">
              {item.image ? (
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-accent/70">
                  <span className="text-6xl">{item.emoji}</span>
                  <span className="font-sans text-xs font-medium text-ink/40">Foto em breve</span>
                </div>
              )}
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-card/90 text-ink/70 shadow-card backdrop-blur hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-accent">
                {item.emoji} {item.catName}
              </p>
              <h2 className="mt-1 font-display text-3xl italic leading-tight text-ink">{item.name}</h2>
              {item.desc && (
                <p className="mt-2 font-sans text-sm leading-relaxed text-ink/60">{item.desc}</p>
              )}
              <p className="mt-2 font-sans text-xl font-bold text-accent">{brl(item.price)}</p>

              <div className="mt-4 flex items-center justify-between rounded-2xl bg-card p-3 shadow-card">
                <span className="font-sans text-sm font-medium text-ink/70">Quantidade</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="Diminuir"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/40 text-accent hover:bg-accentLight"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="w-6 text-center font-sans text-base font-bold text-ink">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    aria-label="Aumentar"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white hover:brightness-105"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>

              {showSpoon && (
                <button
                  onClick={() => setColher((c) => !c)}
                  className="mt-3 flex w-full items-center justify-between rounded-2xl bg-card p-3 shadow-card"
                >
                  <span className="flex items-center gap-2 font-sans text-sm font-medium text-ink/70">
                    <UtensilsCrossed size={16} className="text-accent" /> Precisa de colherzinha?
                  </span>
                  <span
                    className="relative h-5 w-9 rounded-full transition-colors"
                    style={{ backgroundColor: colher ? '#25D366' : '#C9B8A6' }}
                  >
                    <motion.span
                      layout
                      className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow"
                      style={{ left: colher ? '18px' : '2px' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </span>
                </button>
              )}

              <textarea
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                rows={2}
                maxLength={200}
                placeholder="Alguma observação? (ex.: sem granulado, escrever parabéns...)"
                className="mt-3 w-full resize-none rounded-2xl border border-accent/20 bg-card p-3 font-sans text-sm text-ink shadow-card outline-none placeholder:text-ink/35 focus:border-accent"
              />
            </div>

            <div className="shrink-0 border-t border-accent/15 bg-background px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="flex gap-2">
                <button
                  onClick={addToCart}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-accent py-3 font-sans text-sm font-semibold text-accent transition-transform active:scale-[0.98]"
                >
                  <ShoppingBag size={17} /> Adicionar · {brl(subtotal)}
                </button>
                <button
                  onClick={orderNow}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full py-3 font-sans text-sm font-semibold text-white transition-transform active:scale-[0.98]"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <MessageCircle size={17} /> Pedir agora
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
