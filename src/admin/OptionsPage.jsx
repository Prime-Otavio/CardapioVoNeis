import { useEffect, useMemo, useState } from 'react'
import {
  listOptionGroups,
  saveOptionGroup,
  deleteOptionGroup,
  saveOption,
  deleteOption,
  listProductGroupLinks,
  applyGroupsToProducts,
} from '../lib/options'
import { listProducts, listCategories } from '../lib/products'
import { brl } from '../utils'
import { Plus, Trash2, Check, X } from 'lucide-react'
import { usePin } from './PinGate'
import { useStoreId } from './StoreContext'

const grupoVazio = { name: '', required: false, max_select: 1 }
const opcaoVazia = { name: '', extra_price: '' }

export default function OptionsPage() {
  const [groups, setGroups] = useState([])
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [links, setLinks] = useState({})
  const [draft, setDraft] = useState(grupoVazio)
  const [novaOpcao, setNovaOpcao] = useState({}) // { [groupId]: {name, extra_price} }
  const [catAlvo, setCatAlvo] = useState('')
  const [aplicando, setAplicando] = useState(false)
  const [msg, setMsg] = useState('')
  const { requirePin } = usePin()
  const storeId = useStoreId()

  async function reload() {
    const [g, p, c, l] = await Promise.all([
      listOptionGroups(storeId),
      listProducts(storeId),
      listCategories(storeId),
      listProductGroupLinks(),
    ])
    setGroups(g)
    setProducts(p)
    setCategories(c)
    setLinks(l)
  }
  useEffect(() => {
    reload().catch((e) => setMsg(e.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId])

  // Quantos produtos desta loja usam cada grupo.
  const usoPorGrupo = useMemo(() => {
    const meus = new Set(products.map((p) => p.id))
    const c = {}
    Object.entries(links).forEach(([pid, gids]) => {
      if (!meus.has(pid)) return
      gids.forEach((g) => (c[g] = (c[g] || 0) + 1))
    })
    return c
  }, [links, products])

  async function criarGrupo(e) {
    e.preventDefault()
    if (!draft.name.trim()) return
    await saveOptionGroup({
      ...draft,
      name: draft.name.trim(),
      max_select: Number(draft.max_select) || 1,
      sort_order: groups.length,
      store_id: storeId,
    })
    setDraft(grupoVazio)
    reload()
  }

  function removerGrupo(g) {
    requirePin(async () => {
      const n = usoPorGrupo[g.id] || 0
      if (!confirm(`Excluir "${g.name}"? Sai de ${n} produto(s) e as opções dele somem.`)) return
      await deleteOptionGroup(g.id)
      reload()
    }, 'Excluir um grupo de adicionais exige o PIN do dono.')
  }

  async function criarOpcao(groupId) {
    const nova = novaOpcao[groupId] ?? opcaoVazia
    if (!nova.name?.trim()) return
    const grupo = groups.find((g) => g.id === groupId)
    await saveOption({
      group_id: groupId,
      name: nova.name.trim(),
      extra_price: Number(String(nova.extra_price).replace(',', '.')) || 0,
      sort_order: grupo?.options.length ?? 0,
    })
    setNovaOpcao({ ...novaOpcao, [groupId]: opcaoVazia })
    reload()
  }

  // Desligar a opção é o gesto do dia a dia: acabou a calda de ninho no meio
  // da tarde, some do cardápio na hora sem apagar nada.
  async function alternarDisponivel(o) {
    setGroups((gs) =>
      gs.map((g) => ({ ...g, options: g.options.map((x) => (x.id === o.id ? { ...x, available: !o.available } : x)) })),
    )
    try {
      await saveOption({ id: o.id, available: !o.available })
    } catch {
      setMsg('Não deu para salvar. A opção voltou como estava.')
      reload()
    }
  }

  async function aplicarNaCategoria(g) {
    if (!catAlvo) return
    const alvos = products.filter((p) => p.category_id === catAlvo)
    const cat = categories.find((c) => c.id === catAlvo)
    if (!confirm(`Aplicar "${g.name}" aos ${alvos.length} produtos de ${cat?.name}? Os adicionais atuais deles são substituídos.`)) return
    setAplicando(true)
    try {
      await applyGroupsToProducts(alvos.map((p) => p.id), [g.id])
      setMsg(`"${g.name}" aplicado em ${alvos.length} produto(s) de ${cat?.name}.`)
      reload()
    } catch (e) {
      setMsg(e.message || 'Não deu para aplicar.')
    } finally {
      setAplicando(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-1 font-display text-2xl italic text-ink">Adicionais</h2>
      <p className="mb-5 font-sans text-sm text-ink/50">
        Um grupo vale para vários produtos — crie “Calda” uma vez e aplique nas fatias inteiras.
        O cliente escolhe na hora do pedido e a escolha vai na mensagem do WhatsApp.
      </p>

      {msg && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-accent/25 bg-accentLight/40 px-4 py-2.5">
          <p className="font-sans text-sm text-ink/70">{msg}</p>
          <button onClick={() => setMsg('')} className="text-ink/40 hover:text-ink"><X size={16} /></button>
        </div>
      )}

      <form onSubmit={criarGrupo} className="mb-6 flex flex-wrap items-end gap-2 rounded-xl bg-card p-4 shadow-card">
        <div className="min-w-[180px] flex-1">
          <label htmlFor="g-nome" className="mb-1 block font-sans text-xs text-ink/60">Novo grupo</label>
          <input id="g-nome" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Calda, Cobertura, Recheio…"
            className="w-full rounded-lg border border-accent/30 px-3 py-2" />
        </div>
        <div className="w-28">
          <label htmlFor="g-max" className="mb-1 block font-sans text-xs text-ink/60">Escolhe até</label>
          <input id="g-max" type="number" min="1" value={draft.max_select}
            onChange={(e) => setDraft({ ...draft, max_select: e.target.value })}
            className="w-full rounded-lg border border-accent/30 px-3 py-2" />
        </div>
        <label className="flex items-center gap-2 py-2 font-sans text-sm text-ink/70">
          <input type="checkbox" checked={draft.required}
            onChange={(e) => setDraft({ ...draft, required: e.target.checked })} />
          Obrigatório
        </label>
        <button className="flex items-center gap-1 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white">
          <Plus size={16} /> Criar
        </button>
      </form>

      {groups.length === 0 ? (
        <p className="rounded-xl bg-card p-6 text-center font-sans text-sm text-ink/50 shadow-card">
          Nenhum grupo ainda.
        </p>
      ) : (
        <ul className="space-y-4">
          {groups.map((g) => (
            <li key={g.id} className="rounded-xl bg-card p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-base font-semibold text-ink">{g.name}</p>
                  <p className="font-sans text-xs text-ink/50">
                    {g.required ? 'obrigatório' : 'opcional'} · escolhe até {g.max_select} ·{' '}
                    em {usoPorGrupo[g.id] || 0} produto(s)
                  </p>
                </div>
                <button onClick={() => removerGrupo(g)} className="text-ink/30 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>

              <ul className="mt-3 divide-y divide-ink/5">
                {g.options.map((o) => (
                  <li key={o.id} className="flex items-center gap-3 py-2">
                    <button
                      onClick={() => alternarDisponivel(o)}
                      aria-label={o.available ? `Desligar ${o.name}` : `Ligar ${o.name}`}
                      className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                        o.available ? 'border-green-600 bg-green-600 text-white' : 'border-ink/20 text-transparent'
                      }`}
                    >
                      <Check size={14} />
                    </button>
                    <span className={`flex-1 font-sans text-sm ${o.available ? 'text-ink' : 'text-ink/35 line-through'}`}>
                      {o.name}
                    </span>
                    <span className="font-sans text-xs text-ink/50">
                      {Number(o.extra_price) > 0 ? `+ ${brl(Number(o.extra_price))}` : 'sem custo extra'}
                    </span>
                    <button onClick={() => deleteOption(o.id).then(reload)} className="text-ink/25 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
                {g.options.length === 0 && (
                  <li className="py-2 font-sans text-xs text-ink/40">Nenhuma opção ainda.</li>
                )}
              </ul>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  value={(novaOpcao[g.id] ?? opcaoVazia).name}
                  onChange={(e) => setNovaOpcao({ ...novaOpcao, [g.id]: { ...(novaOpcao[g.id] ?? opcaoVazia), name: e.target.value } })}
                  placeholder="Nova opção (ex.: Morango)"
                  className="min-w-[160px] flex-1 rounded-lg border border-accent/30 px-3 py-1.5 text-sm"
                />
                <input
                  value={(novaOpcao[g.id] ?? opcaoVazia).extra_price}
                  onChange={(e) => setNovaOpcao({ ...novaOpcao, [g.id]: { ...(novaOpcao[g.id] ?? opcaoVazia), extra_price: e.target.value } })}
                  placeholder="R$ 0,00"
                  className="w-24 rounded-lg border border-accent/30 px-3 py-1.5 text-sm"
                />
                <button onClick={() => criarOpcao(g.id)}
                  className="rounded-full border border-accent/40 px-4 py-1.5 text-sm font-semibold text-accent hover:bg-accentLight">
                  Adicionar opção
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink/5 pt-3">
                <select value={catAlvo} onChange={(e) => setCatAlvo(e.target.value)}
                  className="rounded-lg border border-accent/30 px-3 py-1.5 text-sm">
                  <option value="">— categoria inteira —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => aplicarNaCategoria(g)}
                  disabled={!catAlvo || aplicando}
                  className="rounded-full border border-accent/40 px-4 py-1.5 text-sm font-semibold text-accent hover:bg-accentLight disabled:opacity-40"
                >
                  {aplicando ? 'Aplicando…' : `Aplicar "${g.name}" na categoria`}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
