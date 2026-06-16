import { useEffect, useState } from 'react'
import { listProducts, saveProduct, deleteProduct, listCategories } from '../lib/products'
import ProductForm from './ProductForm'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { brl } from '../utils'
import { usePin } from './PinGate'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [editing, setEditing] = useState(null) // objeto produto | 'new' | null
  const { requirePin } = usePin()

  async function reload() {
    const [p, c] = await Promise.all([listProducts(), listCategories()])
    setProducts(p)
    setCategories(c)
  }
  useEffect(() => {
    reload()
  }, [])

  async function handleSave(data) {
    await saveProduct(data)
    setEditing(null)
    reload()
  }
  function remove(id) {
    requirePin(async () => {
      if (!confirm('Remover este produto?')) return
      await deleteProduct(id)
      reload()
    }, 'Excluir um produto exige o PIN do dono.')
  }

  function margem(p) {
    if (!p.price) return '—'
    const pct = ((p.price - p.cost) / p.price) * 100
    return `${pct.toFixed(0)}%`
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl italic text-ink">Produtos</h2>
        {!editing && (
          <button onClick={() => setEditing('new')}
            className="flex items-center gap-1 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white">
            <Plus size={16} /> Novo produto
          </button>
        )}
      </div>

      {editing ? (
        <ProductForm
          categories={categories}
          initial={editing === 'new' ? null : editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <ul className="space-y-2">
          {products.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-lg bg-card px-4 py-3 shadow-card">
              <div className="min-w-0 flex-1">
                <p className="truncate font-sans text-sm font-semibold text-ink">{p.name}</p>
                <p className="font-sans text-xs text-ink/50">
                  {p.categories?.name ?? 'sem categoria'} · {brl(Number(p.price))} · margem {margem(p)}
                </p>
              </div>
              <button onClick={() => setEditing(p)} className="text-ink/40 hover:text-accent"><Pencil size={16} /></button>
              <button onClick={() => remove(p.id)} className="text-ink/30 hover:text-red-500"><Trash2 size={16} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
