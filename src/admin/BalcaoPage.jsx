import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { listCatalog, setSoldOut } from '../lib/products'
import { fetchOptionsData } from '../lib/options'
import { brl } from '../utils'
import { useStore } from './StoreProvider'
import { useToast } from './Toast'
import ProductSheet from './ProductSheet'

// Tela do balcão: a lista do dia com o botão "Esgotou" como elemento mais
// óbvio da linha. Uso em pé, com pressa — alvo de toque grande e contraste alto.
export default function BalcaoPage() {
  const { storeId, loading: lojaCarregando } = useStore()
  const avisar = useToast()

  const [categorias, setCategorias] = useState([])
  const [produtos, setProdutos] = useState([])
  const [grupos, setGrupos] = useState([])
  const [opcoes, setOpcoes] = useState([])
  const [vinculos, setVinculos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todas')
  const [editando, setEditando] = useState(null) // produto | 'novo' | null

  const recarregar = useCallback(async () => {
    setCarregando(true)
    try {
      const [cat, ops] = await Promise.all([listCatalog(storeId), fetchOptionsData(storeId)])
      setCategorias(cat.categorias)
      setProdutos(cat.produtos)
      setGrupos(ops.grupos)
      setOpcoes(ops.opcoes)
      setVinculos(ops.vinculos)
    } catch (err) {
      avisar(`Não consegui carregar o cardápio: ${err.message}`, true)
    } finally {
      setCarregando(false)
    }
  }, [storeId, avisar])

  useEffect(() => {
    if (!lojaCarregando) recarregar()
  }, [lojaCarregando, recarregar])

  const gruposDe = useCallback(
    (pid) =>
      vinculos
        .filter((v) => v.product_id === pid)
        .map((v) => grupos.find((g) => g.id === v.group_id))
        .filter(Boolean),
    [vinculos, grupos]
  )

  const categoriasUsadas = useMemo(
    () => categorias.filter((c) => produtos.some((p) => p.category_id === c.id)),
    [categorias, produtos]
  )

  const visiveis = useMemo(() => {
    let lista = produtos
    if (filtro === 'esgotados') lista = lista.filter((p) => p.sold_out)
    else if (filtro !== 'todas') lista = lista.filter((p) => p.category_id === filtro)
    const q = busca.trim().toLowerCase()
    if (q) lista = lista.filter((p) => p.name.toLowerCase().includes(q))
    return lista
  }, [produtos, filtro, busca])

  const porCategoria = useMemo(() => {
    const mapa = new Map()
    visiveis.forEach((p) => {
      const chave = p.category_id ?? 'sem'
      if (!mapa.has(chave)) mapa.set(chave, [])
      mapa.get(chave).push(p)
    })
    return [...categorias.map((c) => c.id), 'sem']
      .filter((id) => mapa.has(id))
      .map((id) => ({
        id,
        nome: categorias.find((c) => c.id === id)?.name ?? 'Sem categoria',
        emoji: categorias.find((c) => c.id === id)?.emoji ?? '',
        itens: mapa.get(id),
      }))
  }, [visiveis, categorias])

  // Update otimista: muda na tela na hora e, se o request falhar, desfaz e
  // avisa — nunca deixa a tela mentir que salvou.
  async function alternarEsgotado(produto) {
    const novo = !produto.sold_out
    setProdutos((ps) => ps.map((p) => (p.id === produto.id ? { ...p, sold_out: novo } : p)))
    try {
      await setSoldOut(produto.id, novo)
      avisar(novo ? `${produto.name} marcado como esgotado` : `${produto.name} voltou ao cardápio`)
    } catch {
      setProdutos((ps) => ps.map((p) => (p.id === produto.id ? { ...p, sold_out: !novo } : p)))
      avisar('Não salvou. Sem internet?', true)
    }
  }

  return (
    <div className="pb-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl italic text-ink">Balcão</h2>
        <button
          onClick={() => setEditando('novo')}
          className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2.5 font-sans text-sm font-semibold text-white"
        >
          <Plus size={16} /> Produto
        </button>
      </div>

      <div className="relative mb-3">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30" />
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar bolo, cone, docinho…"
          className="w-full rounded-full border border-ink/15 bg-white py-3 pl-11 pr-4 font-sans text-base outline-none focus:border-accent"
        />
      </div>

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Chip ativo={filtro === 'todas'} onClick={() => setFiltro('todas')}>Tudo</Chip>
        <Chip ativo={filtro === 'esgotados'} onClick={() => setFiltro('esgotados')}>
          Esgotados ({produtos.filter((p) => p.sold_out).length})
        </Chip>
        {categoriasUsadas.map((c) => (
          <Chip key={c.id} ativo={filtro === c.id} onClick={() => setFiltro(c.id)}>
            {c.emoji ? `${c.emoji} ` : ''}{c.name}
          </Chip>
        ))}
      </div>

      {carregando ? (
        <p className="py-16 text-center font-sans text-sm text-ink/40">Carregando cardápio…</p>
      ) : !porCategoria.length ? (
        <p className="py-16 text-center font-sans text-sm text-ink/40">
          Nada aqui. Toque em “Produto” para cadastrar o primeiro.
        </p>
      ) : (
        porCategoria.map((grupo) => (
          <section key={grupo.id} className="mb-5">
            <h3 className="mb-2 flex items-baseline gap-2 font-display text-lg italic text-ink">
              {grupo.emoji} {grupo.nome}
              <span className="font-sans text-xs not-italic text-ink/40">{grupo.itens.length}</span>
            </h3>
            <ul className="space-y-2">
              {grupo.itens.map((p) => (
                <Linha
                  key={p.id}
                  produto={p}
                  adicionais={gruposDe(p.id)}
                  onAbrir={() => setEditando(p)}
                  onAlternar={() => alternarEsgotado(p)}
                />
              ))}
            </ul>
          </section>
        ))
      )}

      {editando && (
        <ProductSheet
          produto={
            editando === 'novo'
              ? null
              : { ...editando, gruposIds: gruposDe(editando.id).map((g) => g.id) }
          }
          categorias={categorias}
          grupos={grupos}
          opcoes={opcoes}
          produtosDaLoja={produtos}
          storeId={storeId}
          onClose={() => setEditando(null)}
          onSaved={() => {
            setEditando(null)
            recarregar()
          }}
        />
      )}
    </div>
  )
}

function Chip({ ativo, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={ativo}
      className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 font-sans text-sm font-medium ${
        ativo ? 'border-ink bg-ink text-background' : 'border-ink/15 bg-white text-ink/70'
      }`}
    >
      {children}
    </button>
  )
}

function Linha({ produto, adicionais, onAbrir, onAlternar }) {
  const fora = !produto.active || !produto.on_menu
  return (
    <li
      className={`flex items-center gap-3 rounded-2xl border p-2.5 shadow-card ${
        produto.sold_out ? 'border-mel/30 bg-melLight' : 'border-ink/10 bg-white'
      } ${fora ? 'opacity-60' : ''}`}
    >
      <button onClick={onAbrir} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        {produto.image_url ? (
          <img src={produto.image_url} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-accentLight font-display text-xl italic text-accent">
            {produto.name.trim()[0] || '?'}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate font-sans text-sm font-semibold text-ink ${
              produto.sold_out ? 'line-through' : ''
            }`}
          >
            {produto.name}
          </span>
          <span className="block truncate font-sans text-xs text-ink/50">
            {brl(produto.price)} · {produto.unit}
            {adicionais.length ? ` · ${adicionais.map((g) => g.name).join(', ')}` : ''}
          </span>
          {fora && (
            <span className="mt-0.5 inline-block rounded border border-ink/15 px-1.5 py-px font-sans text-[10px] font-bold uppercase text-ink/45">
              {!produto.active ? 'desativado' : 'fora do cardápio'}
            </span>
          )}
        </span>
      </button>

      <button
        onClick={onAlternar}
        className={`min-w-[92px] shrink-0 rounded-full border-2 px-4 py-3 font-sans text-sm font-bold transition-transform active:scale-95 ${
          produto.sold_out
            ? 'border-mel bg-mel/15 text-mel'
            : 'border-folha bg-folhaLight text-folha'
        }`}
      >
        {produto.sold_out ? 'Voltou' : 'Esgotou'}
      </button>
    </li>
  )
}
