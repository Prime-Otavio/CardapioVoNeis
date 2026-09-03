import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastCtx = createContext(() => {})

// Aviso curto no rodapé. O painel roda no balcão, em pé: erro tem que ser
// visível sem o usuário procurar, e nunca pode fingir que salvou.
export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null)
  const timer = useRef(null)

  const avisar = useCallback((texto, erro = false) => {
    setMsg({ texto, erro })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMsg(null), erro ? 4200 : 2600)
  }, [])

  return (
    <ToastCtx.Provider value={avisar}>
      {children}
      {msg && (
        <div
          role="status"
          className={`fixed inset-x-4 z-[70] mx-auto max-w-sm rounded-xl px-4 py-3 text-center font-sans text-sm font-medium text-white shadow-xl ${
            msg.erro ? 'bg-red-500' : 'bg-ink'
          }`}
          style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
        >
          {msg.texto}
        </div>
      )}
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
