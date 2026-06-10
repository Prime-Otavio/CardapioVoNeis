import { motion } from 'framer-motion'
import ItemCard from './ItemCard'

export default function MenuSection({ category, registerRef, cart, onAdd, onRemove, adminMode, onToggle, onOpen }) {
  return (
    <section
      id={`section-${category.id}`}
      ref={(el) => registerRef(category.id, el)}
      className="scroll-mt-24 px-4 py-7"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center gap-3">
          <span className="ornament-line" aria-hidden="true" />
          <h2 className="flex items-center gap-2 text-center font-display text-3xl italic text-ink">
            <span className="text-2xl not-italic">{category.emoji}</span>
            {category.name}
          </h2>
          <span className="ornament-line" aria-hidden="true" />
        </div>

        {category.items.length === 0 ? (
          <div className="mx-auto flex max-w-xs flex-col items-center gap-2 rounded-2xl border border-dashed border-accent/30 bg-card/60 px-6 py-8 text-center">
            <span className="text-3xl">{category.emoji}</span>
            <p className="font-display text-xl italic text-ink/70">Em breve</p>
            <p className="font-sans text-xs text-ink/45">
              Novidades chegando! Fale