import { motion } from 'framer-motion'
import ItemCard from './ItemCard'

export default function MenuSection({ category, registerRef, cart, onAdd, onRemove, adminMode, onToggle }) {
  return (
    <section
      id={`section-${category.id}`}
      ref={(el) => registerRef(category.id, el)}
      className="scroll-mt-24 px-4 py-8"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-baseline gap-2">
          <span className="text-2xl">{category.emoji}</span>
          <h2 className="font-display text-3xl italic text-ink">{category.name}</h2>
        </div>

        <motion.div
          className="menu-grid"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          variants={{ show: { transition: { staggerChildren: 0.018 } } }}
        >
          {category.items.map((it) => (
            <ItemCard
              key={it.id}
              item={it}
              emoji={category.emoji}
              qty={cart[it.id] || 0}
              onAdd={onAdd}
              onRemove={onRemove}
              adminMode={adminMode}
              onToggle={onToggle}
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
