import { useState } from 'react'

export default function ProductForm({ categories, initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial ?? { name: '', price: 0, cost: 0, unit: 'fatia', description: '', image_url: '', category_id: '', active: true }
  )
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  function submit(e) {
    e.preventDefault()
    onSave({ ...form, price: Number(form.price), cost: Number(form.cost) })
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl bg-card p-4 shadow-card">
      <div>
        <label htmlFor="pf-name" className="mb-1 block text-sm text-ink/70">Nome</label>
        <input id="pf-name" value={form.name} onChange={set('name')} required
          className="w-full rounded-lg border border-accent/30 px-3 py-2" />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="pf-price" className="mb-1 block text-sm text-ink/70">Preço</label>
          <input id="pf-price" type="number" step="0.01" value={form.price} onChange={set('price')}
            className="w-full rounded-lg border border-accent/30 px-3 py-2" />
        </div>
        <div className="flex-1">
          <label htmlFor="pf-cost" className="mb-1 block text-sm text-ink/70">Custo (provisório)</label>
          <input id="pf-cost" type="number" step="0.01" value={form.cost} onChange={set('cost')}
            className="w-full rounded-lg border border-accent/30 px-3 py-2" />
        </div>
      </div>
      <div>
        <label htmlFor="pf-cat" className="mb-1 block text-sm text-ink/70">Categoria</label>
        <select id="pf-cat" value={form.category_id} onChange={set('category_id')}
          className="w-full rounded-lg border border-accent/30 px-3 py-2">
          <option value="">— selecione —</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="pf-desc" className="mb-1 block text-sm text-ink/70">Descrição</label>
        <textarea id="pf-desc" value={form.description ?? ''} onChange={set('description')}
          className="w-full rounded-lg border border-accent/30 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="pf-img" className="mb-1 block text-sm text-ink/70">URL da foto (opcional)</label>
        <input id="pf-img" value={form.image_url ?? ''} onChange={set('image_url')}
          className="w-full rounded-lg border border-accent/30 px-3 py-2" />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white">Salvar</button>
        <button type="button" onClick={onCancel} className="rounded-full border border-accent/30 px-5 py-2 text-sm text-ink/70">Cancelar</button>
      </div>
    </form>
  )
}
