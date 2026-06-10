import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export default function CategoryNav({ categories, activeId, onSelect }) {
  const btnRefs = useRef({})

  useEffect(() => {
    const el = btnRefs.current[activeId]
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [activeId])
  return (
    <nav className="sticky top-0 z-30 border-b border-accent/10 bg-background/90 backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-3">
        <div className="no-scrollbar flex gap-2 overflow-x-auto py-3 [&>*:first-child]:ml-auto [&>*:last-child]:mr-auto">
          {categories.map((cat) => {
            const active = cat.id === activeId
            return (
              <button
                key={cat.id}
                ref={(el) => (btnRefs.current[cat.id] = el)}
                onClick={() => onSelect(cat.id)}
                className="relative shrink-0 rounded-full px-4 py-2 font-sans text-sm font-medium transition-colors"
                style={{ color: active ? '#FFFFFF' : '#1C0B00' }}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-accent