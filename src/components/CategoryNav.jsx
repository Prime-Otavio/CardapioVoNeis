import { motion } from 'framer-motion'

export default function CategoryNav({ categories, activeId, onSelect }) {
  return (
    <nav className="sticky top-0 z-30 border-b border-accent/10 bg-background/90 backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-3">
        <div className="no-scrollbar flex gap-2 overflow-x-auto py-3">
          {categories.map((cat) => {
            const active = cat.id === activeId
            return (
              <button
                key={cat.id}
                onClick={() => onSelect(cat.id)}
                className="relative shrink-0 rounded-full px-4 py-2 font-sans text-sm font-medium transition-colors"
                style={{ color: active ? '#FFFFFF' : '#1C0B00' }}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-accent"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10 whitespace-nowrap">
                  {cat.emoji} {cat.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
