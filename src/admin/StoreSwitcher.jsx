import { Store as StoreIcon } from 'lucide-react'
import { useStore } from './StoreContext'

// Trocador de loja. Enquanto só a sede opera ele fica visível de propósito:
// deixa explícito de qual unidade são os números na tela.
export default function StoreSwitcher() {
  const { store, stores, selectStore } = useStore()

  return (
    <div className="mb-4 px-2">
      <label htmlFor="loja" className="mb-1 flex items-center gap-1.5 font-sans text-[11px] font-semibold uppercase tracking-wide text-ink/40">
        <StoreIcon size={12} /> Loja
      </label>
      <select
        id="loja"
        value={store.id}
        onChange={(e) => selectStore(e.target.value)}
        className="w-full rounded-lg border border-ink/15 bg-white px-2.5 py-2 font-sans text-sm text-ink outline-none focus:border-accent"
      >
        {stores.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name.replace('Vó Neis — ', '')}
            {s.active ? '' : ' (fechada)'}
          </option>
        ))}
      </select>
    </div>
  )
}
