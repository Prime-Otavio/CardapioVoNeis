import { useEffect, useState } from 'react'
import { listCategories, saveCategory, deleteCategory, reorderCategories } from '../lib/products'
import { Plus, Trash2, Pencil, Check, X, ChevronUp, ChevronDown } from 'lucide-react'
import { usePin } from './PinGate'
import { useStoreId } from './StoreContext'

export default function CategoriesPage() {
  const [cats, setCats] = useState([])
  const [draft, setDraft] = useState({ name: '', emoji: '' })
  const [editId, setEditId] = useState(null)
  const [editDraft, setEditDraft] = useState({ name: '', emoji: '' })
  const [erro, setErro] = useState('')
  const { requirePin } = usePin()
  const storeId = useStoreId()

  async function reload() {
    setCats(await listCategories(storeId))
  }
  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId])

  async function add(e) {
    e.preventDefault()
    if (!draft.name.trim()) return
    // entra no fim da lista, não empilhado em sort_order 0
    const fim = cats.reduce((max, c) => Math.max(max, c.sort_order ?? 0), -1) + 1
    await saveCategory({ ...draft, name: draft.name.trim(), sort_order: fim }, storeId)
    setDraft({ name: '', emoji: '' })
    reload()
  }

  function startEdit(c) {
    setEditId(c.id)
    setEditDraft({ name: c.name, emoji: c.emoji || '' })
  }

  async function saveEdit(c) {
    if (!editDraft.name.trim()) return
    await saveCategory({ id: c.id, name: editDraft.name.trim(), emoji: editDraft.emoji, sort_order: c.sort_order }, storeId)
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

  // Move e já mostra o resultado; se o banco recusar, volta como estava.
  async function mover(i, passo) {
    const alvo = i + passo
    if (alvo < 0 || alvo >= cats.length) return
    const anterior = cats
    const nova = [...cats]
    ;[nova[i], nova[alvo]] = [nova[alvo], nova[i]]
    setCats(nova.map((c, pos) => ({ ...c, sort_order: pos })))
    setErro('')
    try {
      await reorderCategories(nova.map((c) => c.id))
    } catch {
      setCats(anterior)
      setErro('Não deu para salvar a nova ordem. Tente de novo.')
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-1 font-display text-2xl italic text-ink">Categorias</h2>
      <p className="mb-4 font-sans text-sm text-ink/50">
        A ordem daqui é a ordem em que as categorias aparecem no cardápio.
      </p>
      <form onSubmit={add} className="mb-5 flex gap-2">
        <input value={draft.emoji} onChange={(e) => setDraft({ ...draft, emoji: e.target.value })}
          placeholder="🎂" className="w-16 rounded-lg border border-ink/15 px-3 py-2 text-center outline-none focus:border-accent" />
        <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="Nome da categoria" className="flex-1 rounded-lg border border-ink/15 px-3 py-2 outline-none focus:border-accent" />
        <button className="flex items-center gap-1 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white">
          <Plus size={16} /> Adicionar
        </button>
      </form>
      {erro && <p className="mb-3 font-sans text-sm text-red-600">{erro}</p>}
      <ul className="space-y-2">
        {cats.map((c, i) => (
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
                <div className="flex flex-col">
                  <button
                    onClick={() => mover(i, -1)}
                    disabled={i === 0}
                    aria-label={`Subir ${c.name}`}
                    className="text-ink/40 hover:text-accent disabled:opacity-20"
                  >
                    <ChevronUp size={18} />
                  </button>
                  <button
                    onClick={() => mover(i, 1)}
                    disabled={i === cats.length - 1}
                    aria-label={`Descer ${c.name}`}
                    className="text-ink/40 hover:text-accent disabled:opacity-20"
                  >
                    <ChevronDown size={18} />
                  </button>
                </div>
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
