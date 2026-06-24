import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence, animate } from 'framer-motion'
import Lenis from 'lenis'
import { ShoppingBag } from 'lucide-react'
import { fetchPublicMenu } from './lib/products'
import { brl } from './utils'
import Header from './components/Header'
import CategoryNav from './components/CategoryNav'
import MenuSection from './components/MenuSection'
import CartDrawer from './components/CartDrawer'
import ProductModal from './components/ProductModal'
import CombosBanner from './components/CombosBanner'

const AVAIL_KEY = 'voneis_availability_v1'

export default function App() {
  const [availability, setAvailability] = useState(() => {
    try {
      const raw = localStorage.getItem(AVAIL_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  })

  const [cart, setCart] = useState({})
  const [notes, setNotes] = useState({})
  const [selectedId, setSelectedId] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [adminMode, setAdminMode] = useState(false)
  const [activeId, setActiveId] = useState(null)
  const [bump, setBump] = useState(0)

  // Cardápio vindo do banco (Supabase)
  const [menuData, setMenuData] = useState([])
  const [combos, setCombos] = useState([])
  const [menuLoading, setMenuLoading] = useState(true)

  useEffect(() => {
    fetchPublicMenu()
      .then(({ menu, combos }) => {
        setMenuData(menu)
        setCombos(combos)
        if (menu.length) setActiveId(menu[0].id)
      })
      .catch((err) => console.error('Erro ao carregar cardápio:', err))
      .finally(() => setMenuLoading(false))
  }, [])

  const sectionRefs = useRef({})
  const clickScrolling = useRef(false)
  const lenisRef = useRef(null)

  // Smooth scroll de página inteira — só em desktop com mouse (celular fica nativo)
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.05,
      smoothWheel: true,
      syncTouch: true,
      syncTouchLerp: 0.055,
      touchInertiaMultiplier: 38,
    })
    lenisRef.current = lenis

    let rafId
    const raf = (time) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  // Pausa o smooth scroll quando modal/carrinho estão abertos
  useEffect(() => {
    const lenis = lenisRef.current
    if (!lenis) return
    if (selectedId || drawerOpen) lenis.stop()
    else lenis.start()
  }, [selectedId, drawerOpen])

  useEffect(() => {
    try {
      localStorage.setItem(AVAIL_KEY, JSON.stringify(availability))
    } catch {}
  }, [availability])

  const menu = useMemo(
    () =>
      menuData.map((cat) => ({
        ...cat,
        items: cat.items.map((it) => ({
          ...it,
          available: availability[it.id] !== undefined ? availability[it.id] : it.available,
        })),
      })),
    [availability, menuData]
  )

  const flatItems = useMemo(() => {
    const map = {}
    menu.forEach((cat) =>
      cat.items.forEach((it) => {
        map[it.id] = { ...it, catId: cat.id, catName: cat.name, emoji: cat.emoji }
      })
    )
    return map
  }, [menu])

  const addItem = useCallback(
    (id) => {
      if (!flatItems[id]?.available) return
      setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }))
      setBump((b) => b + 1)
    },
    [flatItems]
  )

  const addWithOptions = useCallback(
    (id, qty, note) => {
      if (!flatItems[id]?.available) return
      setCart((c) => ({ ...c, [id]: (c[id] || 0) + qty }))
      if (note && (note.colher || note.calda || note.obs)) {
        setNotes((n) => ({ ...n, [id]: note }))
      }
      setBump((b) => b + 1)
    },
    [flatItems]
  )

  const setCalda = useCallback((id, calda) => {
    setNotes((n) => ({ ...n, [id]: { ...(n[id] || {}), calda } }))
  }, [])

  const clearNote = useCallback((id) => {
    setNotes((n) => {
      if (!(id in n)) return n
      const next = { ...n }
      delete next[id]
      return next
    })
  }, [])

  const removeItem = useCallback((id) => {
    setCart((c) => {
      const next = { ...c }
      const v = (next[id] || 0) - 1
      if (v <= 0) {
        delete next[id]
        clearNote(id)
      } else next[id] = v
      return next
    })
  }, [clearNote])

  const deleteItem = useCallback((id) => {
    setCart((c) => {
      const next = { ...c }
      delete next[id]
      return next
    })
    clearNote(id)
  }, [clearNote])

  const toggleAvailability = useCallback((id) => {
    setAvailability((a) => {
      const current = a[id] !== undefined ? a[id] : flatItems[id]?.available ?? true
      return { ...a, [id]: !current }
    })
  }, [flatItems])

  const resetAvailability = useCallback(() => setAvailability({}), [])

  const lines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => {
          const it = flatItems[id]
          if (!it) return null
          return {
            id,
            name: it.name,
            price: it.price,
            qty,
            catId: it.catId,
            catName: it.catName,
            emoji: it.emoji,
            note: notes[id] || null,
          }
        })
        .filter(Boolean),
    [cart, flatItems, notes]
  )

  const total = useMemo(() => lines.reduce((s, l) => s + l.price * l.qty, 0), [lines])
  const count = useMemo(() => lines.reduce((s, l) => s + l.qty, 0), [lines])

  const registerRef = useCallback((id, el) => {
    if (el) sectionRefs.current[id] = el
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        if (clickScrolling.current) return
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) setActiveId(visible[0].target.id.replace('section-', ''))
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: [0, 0.25, 0.5, 1] }
    )
    Object.values(sectionRefs.current).forEach((el) => el && obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const scrollTo = useCallback((id) => {
    setActiveId(id)
    clickScrolling.current = true
    const el = sectionRefs.current[id]
    // Destrava de segurança: nunca deixa a detecção de seção presa
    clearTimeout(scrollTo._t)
    scrollTo._t = setTimeout(() => {
      clickScrolling.current = false
    }, 1300)

    if (el) {
      const targetY = el.getBoundingClientRect().top + window.scrollY - 96
      if (lenisRef.current) {
        lenisRef.current.scrollTo(targetY, { duration: 1 })
      } else {
        animate(window.scrollY, targetY, {
          duration: 0.85,
          ease: [0.32, 0.72, 0, 1],
          onUpdate: (v) => window.scrollTo(0, v),
        })
      }
    } else {
      clickScrolling.current = false
    }
  }, [])

  if (menuLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-sans text-sm text-ink/50">Carregando o cardápio…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CombosBanner combos={combos} />
      <CategoryNav categories={menu} activeId={activeId} onSelect={scrollTo} />

      <main className="pb-28">
        {menu.map((cat) => (
          <MenuSection
            key={cat.id}
            category={cat}
            registerRef={registerRef}
            cart={cart}
            onAdd={addItem}
            onRemove={removeItem}
            adminMode={adminMode}
            onToggle={toggleAvailability}
            onOpen={setSelectedId}
          />
        ))}

        <footer className="mt-4 px-4 pb-6 text-center">
          <div className="mx-auto flex max-w-xs items-center gap-3">
            <span className="ornament-line" aria-hidden="true" />
            <span className="select-none text-sm text-accent/50">🍰</span>
            <span className="ornament-line" aria-hidden="true" />
          </div>
          <p className="mt-3 font-sans text-[11px] italic text-ink/40">
            Fotos meramente ilustrativas.
          </p>
          <p className="mt-1 font-display text-base italic text-ink/55">
            Vó Neis Confeitaria — feito com amor ♥
          </p>
          <p className="mt-1 font-sans text-[9px] text-ink/25">v2.2</p>
        </footer>
      </main>

      <ProductModal
        item={selectedId ? flatItems[selectedId] : null}
        onClose={() => setSelectedId(null)}
        onAddToCart={addWithOptions}
      />

      <AnimatePresence>
        {count > 0 && !adminMode && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 24 }}
            onClick={() => setDrawerOpen(true)}
            className="fixed bottom-5 right-5 z-30 flex items-center gap-3 rounded-full bg-accent py-3 pl-4 pr-5 text-white shadow-cardHover"
            style={{ bottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
          >
            <div className="relative">
              <ShoppingBag size={22} />
              <motion.span
                key={bump}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 0.3 }}
                className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 font-sans text-[11px] font-bold text-accent"
              >
                {count}
              </motion.span>
            </div>
            <span className="font-sans text-sm font-semibold">{brl(total)}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <CartDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        lines={lines}
        total={total}
        onAdd={addItem}
        onRemove={removeItem}
        onDelete={deleteItem}
        onSetCalda={setCalda}
      />
    </div>
  )
}
