import { useState } from 'react'
import { uploadProductImage } from '../lib/storage'
import { Upload, X, ImageIcon } from 'lucide-react'

export default function ProductForm({ categories, initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial ?? { name: '', price: 0, cost: 0, unit: 'fatia', description: '', image_url: '', category_id: '', active: true }
  )
  const [uploading, setUploading] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadProductImage(file)
      setForm((f) => ({ ...f, image_url: url }))
    } catch (err) {
      console.error(err)
      alert('Não foi possível enviar a foto: ' + (err.message || 'erro'))
    } finally {
      setUploading(false)
    }
  }

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
        <label className="mb-1 block text-sm text-ink/70">Foto do produto</label>
        <div className="flex items-center gap-3">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ink/15 bg-accentLight/40">
            {form.image_url ? (
              <img src={form.image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon size={24} className="text-ink/25" />
            )}
          </div>
          <div className="flex-1">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-accent/40 px-4 py-2 text-sm font-semibold text-accent hover:bg-accentLight">
              <Upload size={16} /> {uploading ? 'Enviando…' : 'Escolher foto'}
              <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} className="hidden" />
            </label>
            {form.image_url && (
              <button
                type="button"
                onClick={() => setForm({ ...form, image_url: '' })}
                className="ml-2 inline-flex items-center gap-1 text-sm text-ink/50 hover:text-red-500"
              >
                <X size={14} /> Remover
              </button>
            )}
            <p className="mt-1 text-xs text-ink/40">JPG ou PNG. A foto aparece no cardápio.</p>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white">Salvar</button>
        <button type="button" onClick={onCancel} className="rounded-full border border-accent/30 px-5 py-2 text-sm text-ink/70">Cancelar</button>
      </div>
    </form>
  )
}
