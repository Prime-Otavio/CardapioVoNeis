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
import ProductModal from './components/ProductModal'

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
      if (note && (note.colher || note.obs)) {
        setNotes((n) => ({ ...n, [id]: note }))
      }
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
          return {
            id: Number(id),
            name: it.name,
            price: it.price,
            qty,
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
        </footer>
      </main>

      <ProductModal
        item={selectedId ? flatItems[selectedId] : null}
        onClose={() => setSelectedId(null)}
        onAddToCart={addWithOptions}
      />

      <AnimatePresence>
      