import { useState, useRef, memo } from 'react'
import { Plus, Minus, Check } from 'lucide-react'
import { brl } from '../utils'

function ItemCard({ item, emoji, qty, onAdd, onRemove, adminMode, onToggle, onOpen }) {
  const [pulse, setPulse] = useState(false)
  const [showCheck, setShowCheck] = useState(false)
  const checkTimer = useRef(null)

  const handleAdd = () => {
    onAdd(item.id)
    setPulse(true)
    setShowCheck(true)
    clearTimeout(checkTimer.current)
    checkTimer.current = setTimeout(() => setShowCheck(false), 600)
  }

  const unavailable = !item.available && !adminMode
  const clickable = !unavailable && !adminMode

  return (
    <article
      className={`card-pika group relative flex flex-col overflow-hidden bg-card ${pulse ? 'card-pulse' : ''}`}
      onAnimationEnd={() => setPulse(false)}
    >
      <div
        className={`relative aspect-square overflow-hidden bg-accentLight/60 ${clickable ? 'cursor-pointer' : ''}`}
        onClick={() => clickable && onOpen?.(item.id)}
        role="button"
        aria-label={`Ver detalhes de ${item.name}`}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-accent/70">
            <span className="text-4xl drop-shadow-sm">{emoji}</span>
            <span className="font-sans text-[11px] font-medium tracking-wide text-ink/40">
              Foto em breve
            </span>
          </div>
        )}

        {unavailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/55">
            <span className="rounded-full bg-card/95 px-3 py-1 font-sans text-xs font-semibold text-ink">
              Indisponível hoje
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center px-2.5 pb-3 pt-2.5 text-center">
        <div
          className={`flex w-full flex-col items-center ${clickable ? 'cursor-pointer' : ''}`}
          onClick={() => clickable && onOpen?.(item.id)}
        >
          <h3 className="item-name w-full font-display text-[17px] italic leading-tight text-ink">
            {item.name}
          </h3>
          <p className="mt-1 font-sans text-sm font-bold text-accent">{brl(item.price)}</p>
        </div>

        <div className="mt-2.5 flex w-full items-center justify-center">
          {adminMode ? (
            <button
              onClick={() => onToggle(item.id)}
              className="flex w-full items-center justify-between rounded-full bg-accentLight px-3 py-1.5"
            >
              <span className="font-sans text-xs font-medium text-ink/70">
                {item.available ? 'Disponível' : 'Indisponível'}
              </span>
              <span
                className="relative h-5 w-9 rounded-full transition-colors"
                style={{ backgroundColor: item.available ? '#25D366' : '#C9B8A6' }}
              >
                <span
                  className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200"
                  style={{ left: item.available ? '18px' : '2px' }}
                />
              </span>
            </button>
          ) : qty > 0 ? (
            <div className="flex h-9 w-full items-center justify-between">
              <button
                onClick={() => onRemove(item.id)}
                disabled={unavailable}
                aria-label="Remover um"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-accent/40 text-accent transition-colors hover:bg-accentLight disabled:opacity-40"
              >
                <Minus size={16} />
              </button>
              <span className="font-sans text-sm font-semibold text-ink">{qty}</span>
              <button
                onClick={handleAdd}
                disabled={unavailable}
                aria-label="Adicionar um"
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white transition-colors hover:brightness-105 disabled:opacity-40"
              >
                <Plus size={16} />
                <CheckBadge show={showCheck} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              disabled={unavailable}
              className="relative flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-accent px-3 font-sans text-sm font-semibold text-white transition-colors hover:brightness-105 disabled:opacity-40"
            >
              <Plus size={16} /> Adicionar
              <CheckBadge show={showCheck} />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export default memo(ItemCard)

function CheckBadge({ show }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute inset-0 flex items-center justify-center rounded-full bg-whatsapp text-white transition-opacity duration-150 ${show ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
    >
      <Check size={16} strokeWidth={3} />
    </span>
  )
}
