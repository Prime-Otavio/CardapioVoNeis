import { memo, useEffect, useRef, useState } from 'react'
import ItemCard from './ItemCard'

function MenuSection({ category, registerRef, cart, onAdd, onRemove, adminMode, onToggle, onOpen }) {
  const headRef = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = headRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          obs.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section
      id={`section-${category.id}`}
      ref={(el) => registerRef(category.id, el)}
      className="menu-section scroll-mt-24 px-4 pb-8 pt-2"
    >
      <div className="mx-auto max-w-5xl">
        <div ref={headRef} className={`section-head mb-6 mt-6 ${inView ? 'in-view' : ''}`}>
          <div className="flex items-center gap-3">
            <span className="ornament-line" aria-hidden="true" />
            <span className="section-badge flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-card text-3xl shadow-card ring-1 ring-accent/20">
              {category.emoji}
            </span>
            <span className="ornament-line" aria-hidden="true" />
          </div>
          <h2 className="mt-2.5 text-center font-display text-3xl italic text-ink">
            {category.name}
          </h2>
          <p className="mt-0.5 text-center font-sans text-[10px] font-semibold uppercase tracking-[0.25em] text-accent/60">
            ✦ {category.items.length > 0 ? `${category.items.length} delícias` : 'em breve'} ✦
          </p>
        </div>

        {category.items.length === 0 ? (
          <div className="mx-auto flex max-w-xs flex-col items-center gap-2 rounded-2xl border border-dashed border-accent/30 bg-card/60 px-6 py-8 text-center">
            <span className="text-3xl">{category.emoji}</span>
            <p className="font-display text-xl italic text-ink/70">Em breve</p>
            <p className="font-sans text-xs text-ink/45">
              Novidades chegando! Fale com a gente no WhatsApp para encomendas.
            </p>
          </div>
        ) : (
          <div className="menu-grid">
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
                onOpen={onOpen}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default memo(MenuSection)
