import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, MessageCircle, ShoppingBag, UtensilsCrossed } from 'lucide-react'
import { brl } from '../utils'

const CALDAS = ['Chocolate', 'Ninho']

// Decide pelo NOME da categoria (ids vêm do banco como uuid).
// Vale para fatias de bolo e potes & copos.
function temCaldaOuColher(catName) {
  const n = (catName || '').toLowerCase()
  return n.includes('fatia') || n.includes('pote')
}

export default function ProductModal({ item, onClose, onAddToCart, whatsapp }) {
  const [qty, setQty] = useState(1)
  const [colher, setColher] = useState(false)
  const [calda, setCalda] = useState(null)
  const [obs, setObs] = useState('')
  // Escolhas de adicionais vindas do banco: { [groupId]: [optionId, ...] }
  const [escolhas, setEscolhas] = useState({})

  const open = !!item

  useEffect(() => {
    if (open) {
      setQty(1)
      setColher(false)
      setCalda(null)
      setObs('')
      setEscolhas({})
    }
  }, [open, item?.id])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    if (open) {
      window.addEventListener('keydown', onKey)
      // Trava o scroll compensando a largura da barra — sem "pulo" de layout
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

  if (!item) return null

  const grupos = item.optionGroups ?? []
  const showSpoon = temCaldaOuColher(item.catName)
  // A calda fixa no código só aparece para produto que ainda não tem grupo
  // cadastrado no painel — assim nada some do cardápio na transição.
  const showCalda = grupos.length === 0 && temCaldaOuColher(item.catName)

  const escolhidas = grupos.flatMap((g) =>
    (escolhas[g.id] ?? [])
      .map((oid) => {
        const o = g.options.find((x) => x.id === oid)
        return o ? { groupName: g.name, name: o.name, extraPrice: o.extraPrice } : null
      })
      .filter(Boolean),
  )
  const extras = escolhidas.reduce((s, o) => s + o.extraPrice, 0)
  const faltaObrigatorio = grupos.some((g) => g.required && !(escolhas[g.id] ?? []).length)
  const subtotal = (item.price + extras) * qty

  // maxSelect 1 troca a escolha; acima disso marca e desmarca até o limite.
  const escolher = (g, oid) =>
    setEscolhas((e) => {
      const atual = e[g.id] ?? []
      if (g.maxSelect <= 1) return { ...e, [g.id]: atual[0] === oid ? [] : [oid] }
      if (atual.includes(oid)) return { ...e, [g.id]: atual.filter((x) => x !== oid) }
      if (atual.length >= g.maxSelect) return e
      return { ...e, [g.id]: [...atual, oid] }
    })

  const buildDirectMessage = () => {
    let msg = '🍰 *Olá! Gostaria de fazer um pedido:*\n\n'
    msg += `- ${qty}x ${item.name} — ${brl(subtotal)}\n`
    escolhidas.forEach((o) => {
      msg += `✨ ${o.groupName}: ${o.name}${o.extraPrice > 0 ? ` (+${brl(o.extraPrice)})` : ''}\n`
    })
    if (showCalda && calda) msg += `🍫 Calda: ${calda}\n`
    if (showSpoon && colher) msg += '🥄 Com colherzinha, por favor\n'
    if (obs.trim()) msg += `📝 Obs: ${obs.trim()}\n`
    msg += `\n💰 *Total: ${brl(subtotal)}*\n\nAguardo confirmação! 😊`
    return msg
  }

  const orderNow = () => {
    if (!whatsapp) return
    const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(buildDirectMessage())}`
    window.open(url, '_blank')
  }

  const addToCart = () => {
    onAddToCart(item.id, qty, {
      colher: showSpoon && colher,
      calda: showCalda ? calda : null,
      options: escolhidas,
      obs: obs.trim(),
    })
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
            className="fixed inset-0 z-40 bg-ink/50"
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
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" decoding="async" />
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

            <div data-lenis-prevent className="flex-1 overflow-y-auto px-5 py-4">
              <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-accent">
                {item.emoji} {item.catName}
              </p>
              <h2 className="mt-1 font-display text-3xl italic leading-tight text-ink">{item.name}</h2>
              {item.desc && (
                <p className="mt-2 font-sans text-sm leading-relaxed text-ink/60">{item.desc}</p>
              )}
              <p className="mt-2 font-sans text-xl font-bold text-accent">{brl(item.price)}</p>
              {item.image && (
                <p className="mt-1 font-sans text-[10px] italic text-ink/35">
                  Imagem meramente ilustrativa
                </p>
              )}

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

              {grupos.map((g) => (
                <div key={g.id} className="mt-3 rounded-2xl bg-card p-3 shadow-card">
                  <p className="font-sans text-sm font-medium text-ink/70">
                    {g.name}
                    <span className="ml-1 text-xs text-ink/40">
                      {g.required ? '(escolha obrigatória)' : g.maxSelect > 1 ? `(até ${g.maxSelect})` : '(opcional)'}
                    </span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {g.options.map((o) => {
                      const marcada = (escolhas[g.id] ?? []).includes(o.id)
                      return (
                        <button
                          key={o.id}
                          onClick={() => escolher(g, o.id)}
                          aria-pressed={marcada}
                          className={`flex-1 rounded-full border px-3 py-2 font-sans text-xs font-semibold transition-colors ${
                            marcada
                              ? 'border-accent bg-accent text-white'
                              : 'border-accent/30 bg-background text-ink/60 hover:bg-accentLight'
                          }`}
                        >
                          {o.name}
                          {o.extraPrice > 0 && ` +${brl(o.extraPrice)}`}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {showCalda && (
                <div className="mt-3 rounded-2xl bg-card p-3 shadow-card">
                  <p className="font-sans text-sm font-medium text-ink/70">Calda por cima?</p>
                  <div className="mt-2 flex gap-2">
                    {[null, ...CALDAS].map((c) => (
                      <button
                        key={c ?? 'sem'}
                        onClick={() => setCalda(c)}
                        className={`flex-1 rounded-full border px-2 py-2 font-sans text-xs font-semibold transition-colors ${
                          calda === c
                            ? 'border-accent bg-accent text-white'
                            : 'border-accent/30 bg-background text-ink/60 hover:bg-accentLight'
                        }`}
                      >
                        {c === null ? 'Sem calda' : c === 'Chocolate' ? '🍫 Chocolate' : '🥛 Ninho'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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

              <div className="relative mt-3">
                <textarea
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  rows={2}
                  maxLength={200}
                  placeholder="Alguma observação? (ex.: sem granulado, escrever parabéns...)"
                  className="w-full resize-none rounded-2xl border border-accent/20 bg-card p-3 pb-5 font-sans text-sm text-ink shadow-card outline-none placeholder:text-ink/35 focus:border-accent"
                />
                {obs.length > 0 && (
                  <span className="pointer-events-none absolute bottom-2.5 right-3 font-sans text-[10px] text-ink/35">
                    {obs.length}/200
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0 border-t border-accent/15 bg-background px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="flex gap-2">
                <button
                  onClick={addToCart}
                  disabled={faltaObrigatorio}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-accent py-3 font-sans text-sm font-semibold text-accent transition-transform active:scale-[0.98] disabled:opacity-40"
                >
                  <ShoppingBag size={17} /> Adicionar · {brl(subtotal)}
                </button>
                <button
                  onClick={orderNow}
                  disabled={faltaObrigatorio || !whatsapp}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full py-3 font-sans text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-40"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <MessageCircle size={17} /> {whatsapp ? 'Pedir agora' : 'Em breve'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
