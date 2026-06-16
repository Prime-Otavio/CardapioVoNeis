import { useEffect, useState } from 'react'
import { listCategories, saveCategory, deleteCategory } from '../lib/products'
import { Plus, Trash2 } from 'lucide-react'
import { usePin } from './PinGate'

export default function CategoriesPage() {
  const [cats, setCats] = useState([])
  const [draft, setDraft] = useState({ name: '', emoji: '', sort_order: 0 })
  const { requirePin } = usePin()

  async function reload() {
    setCats(await listCategories())
  }
  useEffect(() => {
    reload()
  }, [])

  async function add(e) {
    e.preventDefault()
    if (!draft.name.trim()) return
    await saveCategory(draft)
    setDraft({ name: '', emoji: '', sort_order: 0 })
    reload()
  }

  function remove(id) {
    requirePin(async () => {
      if (!confirm('Remover esta categoria?')) return
      await deleteCategory(id)
      reload()
    }, 'Excluir uma categoria exige o PIN do dono.')
  }

  return (
    <div>
      <h2 className="mb-4 font-display text-2xl italic text-ink">Categorias</h2>
      <form onSubmit={add} className="mb-5 flex gap-2">
        <input value={draft.emoji} onChange={(e) => setDraft({ ...draft, emoji: e.target.value })}
          placeholder="🎂" className="w-16 rounded-lg border border-accent/30 px-3 py-2 text-center" />
        <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="Nome da categoria" className="flex-1 rounded-lg border border-accent/30 px-3 py-2" />
        <button className="flex items-center gap-1 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white">
          <Plus size={16} /> Adicionar
        </button>
      </form>
      <ul className="space-y-2">
        {cats.map((c) => (
          <li key={c.id} className="flex items-center justify-between rounded-lg bg-card px-4 py-3 shadow-card">
            <span className="font-sans text-sm text-ink">{c.emoji} {c.name}</span>
            <button onClick={() => remove(c.id)} className="text-ink/30 hover:text-red-500"><Trash2 size={16} /></button>
          </li>
        ))}
      </ul>
    </div>
  )
}
