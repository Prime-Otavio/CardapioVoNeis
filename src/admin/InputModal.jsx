import { useEffect, useState } from 'react'
import { X, Check } from 'lucide-react'

// Modal de input reutilizável (substitui o prompt() feio do navegador).
// props: title, label, prefix, placeholder, initial, secondLabel/secondPlaceholder (opcional),
//        confirmLabel, onConfirm(value, second), onClose, numeric
export default function InputModal({
  title,
  label,
  prefix,
  placeholder = '',
  initial = '',
  secondLabel,
  secondPlaceholder = '',
  confirmLabel = 'Confirmar',
  numeric = false,
  onConfirm,
  onClose,
}) {
  const [value, setValue] = useState(initial)
  const [second, setSecond] = useState('')

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function submit(e) {
    e.preventDefault()
    onConfirm(value, second)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-xl italic text-ink">{title}</h3>
          <button type="button" onClick={onClose} className="text-ink/40 hover:text-ink"><X size={18} /></button>
        </div>

        {label && <label className="mb-1 block font-sans text-sm text-ink/60">{label}</label>}
        <div className="mb-3 flex items-center gap-2">
          {prefix && <span className="font-sans text-sm text-ink/50">{prefix}</span>}
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(numeric ? e.target.value.replace(',', '.') : e.target.value)}
            inputMode={numeric ? 'decimal' : 'text'}
            placeholder={placeholder}
            className="w-full rounded-lg border border-accent/30 px-3 py-2.5 font-sans text-sm outline-none focus:border-accent"
          />
        </div>

        {secondLabel && (
          <>
            <label className="mb-1 block font-sans text-sm text-ink/60">{secondLabel}</label>
            <input
              value={second}
              onChange={(e) => setSecond(e.target.value)}
              placeholder={secondPlaceholder}
              className="mb-3 w-full rounded-lg border border-ink/15 px-3 py-2.5 font-sans text-sm outline-none focus:border-accent"
            />
          </>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-accent py-2.5 font-sans text-sm font-semibold text-white"
          >
            <Check size={16} /> {confirmLabel}
          </button>
          <button
            type="button" onClick={onClose}
            className="rounded-full border border-ink/15 px-5 py-2.5 font-sans text-sm text-ink/60"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
