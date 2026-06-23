import { useEffect, useState } from 'react'
import { listCategories, saveCategory, deleteCategory } from '../lib/products'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { usePin } from './PinGate'

export default function CategoriesPage() {
  const [cats, setCats] = useState([])
  const [draft, setDraft] = useState({ name: '', emoji: '', sort_order: 0 })
  const [editId, setEditId] = useState(null)
  const [editDraft, setEditDraft] = useState({ name: '', emoji: '' })
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

  function startEdit(c) {
    setEditId(c.id)
    setEditDraft({ name: c.name, emoji: c.emoji || '' })
  }

  async function saveEdit(c) {
    if (!editDraft.name.trim()) return
    await saveCategory({ id: c.id, name: editDraft.name.trim(), emoji: editDraft.emoji, sort_order: c.sort_order })
    setEditId(null)
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
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-4 font-display text-2xl italic text-ink">Categorias</h2>
      <form onSubmit={add} className="mb-5 flex gap-2">
        <input value={draft.emoji} onChange={(e) => setDraft({ ...draft, emoji: e.target.value })}
          placeholder="🎂" className="w-16 rounded-lg border border-ink/15 px-3 py-2 text-center outline-none focus:border-accent" />
        <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="Nome da categoria" className="flex-1 rounded-lg border border-ink/15 px-3 py-2 outline-none focus:border-accent" />
        <button className="flex items-center gap-1 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white">
          <Plus size={16} /> Adicionar
        </button>
      </form>
      <ul className="space-y-2">
        {cats.map((c) => (
          <li key={c.id} className="flex items-center gap-2 rounded-xl border border-ink/10 bg-white px-4 py-3">
            {editId === c.id ? (
              <>
                <input
                  value={editDraft.emoji}
                  onChange={(e) => setEditDraft({ ...editDraft, emoji: e.target.value })}
                  className="w-14 rounded-lg border border-ink/15 px-2 py-1.5 text-center outline-none focus:border-accent"
                />
                <input
                  value={editDraft.name}
                  onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                  className="flex-1 rounded-lg border border-ink/15 px-3 py-1.5 outline-none focus:border-accent"
                  autoFocus
                />
                <button onClick={() => saveEdit(c)} className="text-green-600 hover:text-green-700"><Check size={18} /></button>
                <button onClick={() => setEditId(null)} className="text-ink/40 hover:text-ink"><X size={18} /></button>
              </>
            ) : (
              <>
                <span className="flex-1 font-sans text-sm text-ink">{c.emoji} {c.name}</span>
                <button onClick={() => startEdit(c)} className="text-ink/40 hover:text-accent"><Pencil size={16} /></button>
                <button onClick={() => remove(c.id)} className="text-ink/30 hover:text-red-500"><Trash2 size={16} /></button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
