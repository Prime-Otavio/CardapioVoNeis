import { createContext, useContext, useEffect, useState } from 'react'
import { listStores } from '../lib/stores'

const Ctx = createContext(null)
const CHAVE = 'voneis:loja'

// Qual loja o painel está operando. Fica no localStorage para não voltar
// para a sede a cada refresh de quem trabalha na outra unidade.
export function StoreProvider({ children }) {
  const [stores, setStores] = useState([])
  const [store, setStore] = useState(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    listStores()
      .then((lista) => {
        setStores(lista)
        const salva = localStorage.getItem(CHAVE)
        setStore(lista.find((s) => s.id === salva) || lista.find((s) => s.is_main) || lista[0] || null)
      })
      .catch((e) => setErro(e.message || 'Não deu para carregar as lojas.'))
  }, [])

  function selectStore(id) {
    const s = stores.find((x) => x.id === id)
    if (!s) return
    localStorage.setItem(CHAVE, s.id)
    setStore(s)
  }

  if (erro) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF7F4] px-6 text-center">
        <p className="font-sans text-sm text-red-600">{erro}</p>
      </div>
    )
  }
  if (!store) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF7F4]">
        <p className="font-sans text-sm text-ink/50">Carregando as lojas…</p>
      </div>
    )
  }

  return <Ctx.Provider value={{ store, stores, selectStore }}>{children}</Ctx.Provider>
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore precisa estar dentro de <StoreProvider>')
  return ctx
}

// Atalho: quase toda tela só quer o id para filtrar as queries.
export function useStoreId() {
  return useStore().store.id
}
