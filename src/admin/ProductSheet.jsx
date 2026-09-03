import { useMemo, useState } from 'react'
import { X, ImageIcon, Upload } from 'lucide-react'
import { brl } from '../utils'
import { encolherImagem } from '../lib/image'
import { uploadProductImage } from '../lib/storage'
import { setProductGroups, applyGroupsToProducts } from '../lib/options'
import { supabase } from '../lib/supabase'
import { useToast } from './Toast'
import ConfirmModal from './ConfirmModal'

const UNIDADES = ['unidade', 'fatia', 'pote', 'copo', 'cento', 'kg']

const VAZIO = {
  name: '',
  description: '',
  price: 0,
  cost: 0,
  unit: 'unidade',
  category_id: '',
  active: true,
  on_menu: true,
  sold_out: false,
  featured: false,
  image_url: '',
}

// Editor de produto em bottom sheet — pensado para o polegar, no balcão.
// Os três estados não são a mesma coisa e a UI precisa deixar isso claro:
//   active   = existe no sistema/PDV
//   on_menu  = aparece no cardápio online
//   sold_out = acabou hoje; continua listado, marcado como indisponível
export default function ProductSheet({
  produto,          // objeto do produto, ou null para criar
  categorias,
  grupos,
  opcoes,
  produtosDaLoja,   // usado no "aplicar a toda a categoria"
  storeId,
  onClose,
  onSaved,
}) {
  const editando = !!produto?.id
  const avisar = useToast()

  const [form, setForm] = useState({
    ...VAZIO,
    category_id: categorias[0]?.id ?? '',
    ...(produto ?? {}),
  })
  const [gruposMarcados, setGruposMarcados] = useState(
    () => new Set(produto?.gruposIds ?? [])
  )
  const [fotoNova, setFotoNova] = useState(null)
  const [previa, setPrevia] = useState(produto?.image_url || '')
  const [salvando, setSalvando] = useState(false)
  const [confirmandoCategoria, setConfirmandoCategoria] = useState(false)

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const margem = useMemo(() => {
    const preco = Number(form.price) || 0
    const custo = Number(form.cost) || 0
    if (!custo) return null
    const lucro = preco - custo
    return { lucro, pct: preco ? (lucro / preco) * 100 : 0 }
  }, [form.price, form.cost])

  const irmaos = useMemo(
    () => produtosDaLoja.filter((p) => p.category_id === form.category_id),
    [produtosDaLoja, form.category_id]
  )

  function alternarGrupo(id) {
    setGruposMarcados((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  async function escolherFoto(e) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    try {
      const menor = await encolherImagem(arquivo)
      setFotoNova(menor)
      setPrevia(URL.createObjectURL(menor))
    } catch (err) {
      avisar(err.message || 'Não consegui ler a foto.', true)
    }
  }

  async function salvar(e) {
    e.preventDefault()
    const nome = form.name.trim()
    if (!nome) return avisar('O produto precisa de um nome.', true)
    setSalvando(true)

    let imageUrl = form.image_url || null
    if (fotoNova) {
      try {
        imageUrl = await uploadProductImage(fotoNova)
      } catch {
        avisar('A foto não subiu. Salvei o resto.', true)
      }
    }

    const dados = {
      ...(storeId ? { store_id: storeId } : {}),
      name: nome,
      description: form.description?.trim() || null,
      price: Number(form.price) || 0,
      cost: Number(form.cost) || 0,
      unit: form.unit,
      category_id: form.category_id || null,
      active: form.active,
      on_menu: form.on_menu,
      sold_out: form.sold_out,
      featured: form.featured,
      image_url: imageUrl,
    }

    const resposta = editando
      ? await supabase.from('products').update(dados).eq('id', produto.id).select().single()
      : await supabase.from('products').insert(dados).select().single()

    if (resposta.error) {
      setSalvando(false)
      return avisar(`Não consegui salvar: ${resposta.error.message}`, true)
    }

    try {
      await setProductGroups(resposta.data.id, [...gruposMarcados])
    } catch {
      avisar('Produto salvo, mas os adicionais não foram gravados.', true)
    }

    setSalvando(false)
    avisar(editando ? 'Produto atualizado' : 'Produto criado')
    onSaved()
  }

  async function aplicarNaCategoria() {
    setConfirmandoCategoria(false)
    try {
      await applyGroupsToProducts(irmaos.map((p) => p.id), [...gruposMarcados])
      avisar(`Adicionais aplicados em ${irmaos.length} produto(s)`)
      onSaved()
    } catch (err) {
      avisar(`Não deu para aplicar: ${err.message}`, true)
    }
  }

  const opcoesDo = (gid) => opcoes.filter((o) => o.group_id === gid)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 sm:items-center">
      <form
        onSubmit={salvar}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-background p-5 sm:max-w-lg sm:rounded-3xl"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-2xl italic text-ink">
            {editando ? 'Editar produto' : 'Novo produto'}
          </h3>
          <button type="button" onClick={onClose} aria-label="Fechar" className="p-2 text-ink/40">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-ink/10 bg-accentLight/40">
            {previa ? (
              <img src={previa} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon size={24} className="text-ink/25" />
            )}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-accent/40 px-4 py-3 font-sans text-sm font-semibold text-accent">
            <Upload size={16} /> Escolher foto
            <input type="file" accept="image/*" onChange={escolherFoto} className="hidden" />
          </label>
        </div>

        <Campo label="Nome">
          <input value={form.name} onChange={set('name')} className={estiloInput} />
        </Campo>

        <Campo label="Descrição no cardápio">
          <textarea
            rows={2}
            value={form.description ?? ''}
            onChange={set('description')}
            placeholder="Ex.: massa de chocolate com brigadeiro cremoso"
            className={estiloInput}
          />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Preço de venda">
            <input type="number" step="0.01" inputMode="decimal" value={form.price} onChange={set('price')} className={estiloInput} />
          </Campo>
          <Campo label="Custo">
            <input type="number" step="0.01" inputMode="decimal" value={form.cost} onChange={set('cost')} className={estiloInput} />
          </Campo>
        </div>

        <p className="-mt-2 mb-4 font-sans text-xs text-ink/50">
          {margem ? (
            <>
              Lucro de <b className={margem.pct < 30 ? 'text-red-500' : 'text-folha'}>{brl(margem.lucro)}</b> por{' '}
              {form.unit} · {margem.pct.toFixed(0)}% de margem
            </>
          ) : (
            'Sem custo cadastrado — a margem deste produto não entra no painel.'
          )}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Categoria">
            <select value={form.category_id ?? ''} onChange={set('category_id')} className={estiloInput}>
              <option value="">— sem categoria —</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Unidade">
            <select value={form.unit} onChange={set('unit')} className={estiloInput}>
              {UNIDADES.map((u) => <option key={u}>{u}</option>)}
            </select>
          </Campo>
        </div>

        <Troca titulo="No cardápio" ajuda="Aparece para o cliente" checked={form.on_menu} onChange={set('on_menu')} />
        <Troca titulo="Esgotado hoje" ajuda="Continua no cardápio, marcado como indisponível" checked={form.sold_out} onChange={set('sold_out')} />
        <Troca titulo="Destaque" ajuda="Sobe para o topo do cardápio" checked={form.featured} onChange={set('featured')} />
        <Troca titulo="Ativo no sistema" ajuda="Desligue só se parou de fazer de vez" checked={form.active} onChange={set('active')} />

        <h4 className="mb-1 mt-6 font-display text-lg italic text-ink">Adicionais</h4>
        <p className="mb-2 font-sans text-xs text-ink/50">
          O cliente escolhe na hora do pedido. Marque os grupos que valem para este produto.
        </p>
        {grupos.length ? (
          grupos.map((g) => (
            <Troca
              key={g.id}
              titulo={g.name}
              ajuda={
                opcoesDo(g.id)
                  .map((o) => o.name + (Number(o.extra_price) > 0 ? ` +${brl(o.extra_price)}` : ''))
                  .join(' · ') || 'sem opções ainda'
              }
              checked={gruposMarcados.has(g.id)}
              onChange={() => alternarGrupo(g.id)}
            />
          ))
        ) : (
          <p className="font-sans text-sm text-ink/45">Nenhum grupo criado ainda. Veja a aba Adicionais.</p>
        )}

        {editando && irmaos.length > 1 && (
          <button
            type="button"
            onClick={() => setConfirmandoCategoria(true)}
            className="mt-4 w-full rounded-xl border border-ink/15 bg-white py-3 font-sans text-sm font-semibold text-ink/70"
          >
            Aplicar esses adicionais a toda a categoria
          </button>
        )}

        <button
          type="submit"
          disabled={salvando}
          className="mt-6 w-full rounded-xl bg-accent py-4 font-sans text-base font-semibold text-white disabled:opacity-50"
        >
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full rounded-xl border border-ink/15 bg-white py-3 font-sans text-sm text-ink/60"
        >
          Cancelar
        </button>

        {confirmandoCategoria && (
          <ConfirmModal
            title="Aplicar à categoria"
            message={`Os ${irmaos.length} produtos desta categoria vão ficar com exatamente estes adicionais. Os que eles têm hoje são substituídos.`}
            confirmLabel="Aplicar"
            onConfirm={aplicarNaCategoria}
            onClose={() => setConfirmandoCategoria(false)}
          />
        )}
      </form>
    </div>
  )
}

const estiloInput =
  'w-full rounded-xl border border-ink/15 bg-white px-4 py-3 font-sans text-base outline-none focus:border-accent'

function Campo({ label, children }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1 block font-sans text-xs font-semibold uppercase tracking-wide text-ink/45">
        {label}
      </span>
      {children}
    </label>
  )
}

function Troca({ titulo, ajuda, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-4 border-t border-ink/10 py-3">
      <span className="font-sans text-sm text-ink">
        {titulo}
        <small className="block font-sans text-xs text-ink/45">{ajuda}</small>
      </span>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={onChange}
        className="h-7 w-12 shrink-0 cursor-pointer appearance-none rounded-full bg-ink/15 transition-colors after:block after:h-6 after:w-6 after:translate-x-0.5 after:translate-y-0.5 after:rounded-full after:bg-white after:transition-transform checked:bg-folha checked:after:translate-x-[1.375rem]"
      />
    </label>
  )
}
