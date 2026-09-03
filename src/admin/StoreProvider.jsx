import { createContext, useContext, useEffect, useState } from 'react'
import { listStores } from '../lib/stores'

const StoreCtx = createContext({ stores: [], store: null, setStoreId: () => {}, loading: true })

const CHAVE = 'voneis.loja'

// Loja selecionada no painel. Fica no localStorage para o balconista não ter
// que reescolher a cada abertura. Se o banco não tiver a tabela `stores`
// (migration 0014 não aplicada), store fica null e as páginas rodam sem filtro.
export function StoreProvider({ children }) {
  const [stores, setStores] = useState([])
  const [storeId, setStoreId] = useState(() => localStorage.getItem(CHAVE) || null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let vivo = true
    listStores()
      .then((lista) => {
        if (!vivo) return
        setStores(lista)
        setStoreId((atual) => {
          if (atual && lista.some((l) => l.id === atual)) return atual
          const padrao = lista.find((l) => l.is_main) ?? lista[0]
          return padrao?.id ?? null
        })
      })
      .finally(() => vivo && setLoading(false))
    return () => {
      vivo = false
    }
  }, [])

  useEffect(() => {
    if (storeId) localStorage.setItem(CHAVE, storeId)
  }, [storeId])

  const store = stores.find((l) => l.id === storeId) ?? null

  return (
    <StoreCtx.Provider value={{ stores, store, storeId, setStoreId, loading }}>
      {children}
    </StoreCtx.Provider>
  )
}

export const useStore = () => useContext(StoreCtx)
