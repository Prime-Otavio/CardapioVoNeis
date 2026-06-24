import { motion } from 'framer-motion'
import { Gift, MessageCircle } from 'lucide-react'
import { brl } from '../utils'
import { WHATSAPP_NUMBER } from '../config'

// Faixa de combos em destaque no topo do cardápio. Clicar pede pelo WhatsApp.
export default function CombosBanner({ combos }) {
  if (!combos || combos.length === 0) return null

  function pedir(c) {
    let msg = `🎁 *Olá! Quero o combo:*\n\n*${c.name}* — ${brl(Number(c.price))}\n`
    ;(c.combo_items || []).forEach((it) => {
      msg += `• ${it.quantity}x ${it.products?.name}\n`
    })
    if (c.description) msg += `\n_${c.description}_\n`
    msg += '\nAguardo confirmação! 😊'
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <section className="px-4 pb-3 pt-5">
      <div className="mx-auto max-w-2xl">
        <div className="mb-3 flex items-center justify-center gap-2">
          <Gift size={20} className="text-accent" />
          <h2 className="font-display text-2xl italic text-ink">Combos especiais</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {combos.map((c, i) => (
            <motion.button
              key={c.id}
              type="button"
              onClick={() => pedir(c)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.98 }}
              className="group relative overflow-hidden rounded-2xl border-2 border-accent/25 bg-card p-4 text-left shadow-card transition-shadow hover:shadow-cardHover"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xl italic leading-tight text-ink">{c.name}</p>
                  {c.description && (
                    <p className="mt-0.5 font-sans text-xs text-ink/55">{c.description}</p>
                  )}
                  <ul className="mt-2 space-y-0.5">
                    {(c.combo_items || []).map((it, idx) => (
                      <li key={idx} className="font-sans text-[12px] text-ink/60">
                        • {it.quantity}× {it.products?.name}
                      </li>
                    ))}
                  </ul>
                </div>
                <span className="shrink-0 rounded-full bg-accent px-3 py-1 font-sans text-sm font-bold text-white">
                  {brl(Number(c.price))}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-whatsapp/10 py-2 font-sans text-sm font-semibold text-whatsapp transition-colors group-hover:bg-whatsapp/15">
                <MessageCircle size={16} /> Pedir este combo
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  )
}
