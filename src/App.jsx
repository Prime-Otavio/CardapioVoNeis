import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'
import { menuData } from './menuData'
import { brl } from './utils'
import Header from './components/Header'
import CategoryNav from './components/CategoryNav'
import MenuSection from './components/MenuSection'
import CartDrawer from './components/CartDrawer'
import AdminPanel from './components/AdminPanel'

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
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [adminMode, setAdminMode] = useState(false)
  const [activeId, setActiveId] = useState(menuData[0].id)
  const [bump, setBump] = useState(0)

  const sectionRefs = useRef({})
  const clickScrolling = useRef(false)

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
    [availability]
  )

  const flatItems = useMemo(() => {
    const map = {}
    menu.forEach((cat) =>
      cat.items.forEach((it) => {
        map[it.id] = { ...it, catName: cat.name, emoji: cat.emoji }
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

  const removeItem = useCallback((id) => {
    setCart((c) => {
      const next = { ...c }
      const v = (next[id] || 0) - 1
      if (v <= 0) delete next[id]
      else next[id] = v
      return next
    })
  }, [])

  const deleteItem = useCallback((id) => {
    setCart((c) => {
      const next = { ...c }
      delete next[id]
      return next
    })
  }, [])

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
          return { id: Number(id), name: it.name, price: it.price, qty, catName: it.catName, emoji: it.emoji }
        })
        .filter(Boolean),
    [cart, flatItems]
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
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setTimeout(() => {
      clickScrolling.current = false
    }, 800)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CategoryNav categories={menu} activeId={activeId} onSelect={scrollTo} />

      <AdminPanel
        adminMode={adminMode}
        onEnter={() => setAdminMode(true)}
        onExit={() => setAdminMode(false)}
        onReset={resetAvailability}
      />

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
          />
        ))}
      </main>

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
      />
    </div>
  )
}
