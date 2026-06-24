import { motion } from 'framer-motion'
import { Gift } from 'lucide-react'
import { brl } from '../utils'

// Faixa de combos em destaque no topo do cardápio.
export default function CombosBanner({ combos }) {
  if (!combos || combos.length === 0) return null

  return (
    <section className="px-4 pb-2 pt-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-3 flex items-center gap-2">
          <Gift size={18} className="text-accent" />
          <h2 className="font-display text-xl italic text-ink">Combos especiais</h2>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {combos.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="relative min-w-[230px] max-w-[230px] overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-accentLight to-white p-4 shadow-card"
            >
              <span className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-1 font-sans text-[11px] font-bold text-white">
                {brl(Number(c.price))}
              </span>
              <p className="mb-1 pr-16 font-display text-lg italic leading-tight text-ink">{c.name}</p>
              {c.description && (
                <p className="mb-2 font-sans text-xs text-ink/55">{c.description}</p>
              )}
              <ul className="space-y-0.5">
                {(c.combo_items || []).map((it, idx) => (
                  <li key={idx} className="font-sans text-[12px] text-ink/60">
                    • {it.quantity}× {it.products?.name}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
