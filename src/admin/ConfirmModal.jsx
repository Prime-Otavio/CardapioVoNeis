import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

// Substitui o confirm() nativo — que no celular aparece com a URL do site
// e assusta o usuário. props: title, message, confirmLabel, danger, onConfirm, onClose
export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirmar',
  danger = false,
  onConfirm,
  onClose,
}) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-2 flex items-center gap-2">
          {danger && <AlertTriangle size={18} className="text-red-500" />}
          <h3 className="font-display text-xl italic text-ink">{title}</h3>
        </div>
        <p className="mb-4 font-sans text-sm leading-relaxed text-ink/60">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-full py-3 font-sans text-sm font-semibold text-white ${
              danger ? 'bg-red-500' : 'bg-accent'
            }`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onClose}
            className="rounded-full border border-ink/15 px-5 py-3 font-sans text-sm text-ink/60"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
