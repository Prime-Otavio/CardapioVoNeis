import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  fetchOptionsData, createGroup, deleteGroup,
  createOption, deleteOption, setOptionAvailable,
} from '../lib/options'
import { brl } from '../utils'
import { useStore } from './StoreProvider'
import { useToast } from './Toast'
import InputModal from './InputModal'
import ConfirmModal from './ConfirmModal'

// Gerenciador de adicionais. O caso de uso real: acabou a calda de ninho no
// meio do dia — desliga a opção aqui e ela some do cardápio na hora.
export default function OptionsPage() {
  const { storeId, loading: lojaCarregando } = useStore()
  const avisar = useToast()

  const [grupos, setGrupos] = useState([])
  const [opcoes, setOpcoes] = useState([])
  const [vinculos, setVinculos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [modal, setModal] = useState(null) // {tipo:'grupo'} | {tipo:'opcao', grupo} | {tipo:'delGrupo', grupo} | {tipo:'delOpcao', opcao}

  const recarregar = useCallback(async () => {
    setCarregando(true)
    const dados = await fetchOptionsData(storeId)
    setGrupos(dados.grupos)
    setOpcoes(dados.opcoes)
    setVinculos(dados.vinculos)
    setCarregando(false)
  }, [storeId])

  useEffect(() => {
    if (!lojaCarregando) recarregar()
  }, [lojaCarregando, recarregar])

  const opcoesDo = (gid) => opcoes.filter((o) => o.group_id === gid)

  // Otimista, igual ao "Esgotou": desfaz se o banco recusar.
  async function alternarDisponivel(opcao) {
    const novo = !opcao.available
    setOpcoes((os) => os.map((o) => (o.id === opcao.id ? { ...o, available: novo } : o)))
    try {
      await setOptionAvailable(opcao.id, novo)
      avisar(novo ? `${opcao.name} disponível` : `${opcao.name} indisponível`)
    } catch {
      setOpcoes((os) => os.map((o) => (o.id === opcao.id ? { ...o, available: !novo } : o)))
      avisar('Não salvou. Sem internet?', true)
    }
  }

  async function comErro(fn, sucesso) {
    try {
      await fn()
      setModal(null)
      avisar(sucesso)
      recarregar()
    } catch (err) {
      avisar(err.message || 'Não deu certo.', true)
    }
  }

  return (
    <div className="pb-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl italic text-ink">Adicionais</h2>
        <button
          onClick={() => setModal({ tipo: 'grupo' })}
          className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2.5 font-sans text-sm font-semibold text-white"
        >
          <Plus size={16} /> Grupo
        </button>
      </div>
      <p className="mb-4 font-sans text-sm text-ink/50">
        Um grupo (Calda, Cobertura…) é ligado a vários produtos. Desligar uma opção aqui
        tira ela do cardápio na hora, sem mexer nos produtos.
      </p>

      {carregando ? (
        <p className="py-16 text-center font-sans text-sm text-ink/40">Carregando…</p>
      ) : !grupos.length ? (
        <p className="py-16 text-center font-sans text-sm text-ink/40">
          Nenhum grupo ainda. Toque em “Grupo” para criar o primeiro.
        </p>
      ) : (
        <ul className="space-y-3">
          {grupos.map((g) => (
            <li key={g.id} className="rounded-2xl border border-ink/10 bg-white p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-sans text-base font-semibold text-ink">{g.name}</p>
                  <p className="font-sans text-xs text-ink/45">
                    {g.required ? 'obrigatório' : 'opcional'} · até {g.max_select} ·{' '}
                    {vinculos.filter((v) => v.group_id === g.id).length} produto(s)
                  </p>
                </div>
                <button
                  onClick={() => setModal({ tipo: 'delGrupo', grupo: g })}
                  aria-label={`Excluir ${g.name}`}
                  className="p-2 text-ink/30 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <ul className="mt-2">
                {opcoesDo(g.id).length ? (
                  opcoesDo(g.id).map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-3 border-t border-ink/10 py-3">
                      <span className="min-w-0 flex-1 font-sans text-sm text-ink">
                        {o.name}
                        <small className="block font-sans text-xs text-ink/45">
                          {Number(o.extra_price) > 0 ? `+ ${brl(o.extra_price)}` : 'sem custo extra'}
                        </small>
                      </span>
                      <button
                        onClick={() => setModal({ tipo: 'delOpcao', opcao: o })}
                        aria-label={`Excluir ${o.name}`}
                        className="p-2 text-ink/25 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                      <input
                        type="checkbox"
                        checked={!!o.available}
                        onChange={() => alternarDisponivel(o)}
                        aria-label={`${o.name} disponível`}
                        className="h-7 w-12 shrink-0 cursor-pointer appearance-none rounded-full bg-ink/15 transition-colors after:block after:h-6 after:w-6 after:translate-x-0.5 after:translate-y-0.5 after:rounded-full after:bg-white after:transition-transform checked:bg-folha checked:after:translate-x-[1.375rem]"
                      />
                    </li>
                  ))
                ) : (
                  <li className="border-t border-ink/10 py-3 font-sans text-sm text-ink/40">
                    Nenhuma opção ainda.
                  </li>
                )}
              </ul>

              <button
                onClick={() => setModal({ tipo: 'opcao', grupo: g })}
                className="mt-2 w-full rounded-xl border border-ink/15 py-3 font-sans text-sm font-semibold text-ink/70"
              >
                Adicionar opção
              </button>
            </li>
          ))}
        </ul>
      )}

      {modal?.tipo === 'grupo' && (
        <InputModal
          title="Novo grupo"
          label="Nome do grupo"
          placeholder="Calda, Cobertura, Recheio…"
          secondLabel="Quantas opções o cliente pode escolher?"
          secondPlaceholder="1"
          confirmLabel="Criar"
          onClose={() => setModal(null)}
          onConfirm={(nome, max) => {
            if (!nome.trim()) return avisar('O grupo precisa de um nome.', true)
            comErro(
              () => createGroup({
                storeId,
                name: nome.trim(),
                maxSelect: parseInt(max, 10) || 1,
                sortOrder: grupos.length + 1,
              }),
              'Grupo criado'
            )
          }}
        />
      )}

      {modal?.tipo === 'opcao' && (
        <InputModal
          title={`Opção em ${modal.grupo.name}`}
          label="Nome da opção"
          placeholder="Morango, Ninho, Chocolate…"
          secondLabel="Custo extra em R$ (0 se for grátis)"
          secondPlaceholder="0"
          confirmLabel="Criar"
          onClose={() => setModal(null)}
          onConfirm={(nome, extra) => {
            if (!nome.trim()) return avisar('A opção precisa de um nome.', true)
            comErro(
              () => createOption({
                groupId: modal.grupo.id,
                name: nome.trim(),
                extraPrice: parseFloat(String(extra).replace(',', '.')) || 0,
                sortOrder: opcoesDo(modal.grupo.id).length + 1,
              }),
              'Opção criada'
            )
          }}
        />
      )}

      {modal?.tipo === 'delGrupo' && (
        <ConfirmModal
          title={`Excluir "${modal.grupo.name}"?`}
          message={`Ele sai de ${vinculos.filter((v) => v.group_id === modal.grupo.id).length} produto(s) e as opções dele somem junto.`}
          confirmLabel="Excluir"
          danger
          onClose={() => setModal(null)}
          onConfirm={() => comErro(() => deleteGroup(modal.grupo.id), 'Grupo excluído')}
        />
      )}

      {modal?.tipo === 'delOpcao' && (
        <ConfirmModal
          title={`Excluir "${modal.opcao.name}"?`}
          message="Se a ideia é só tirar do cardápio hoje, use a chavinha de disponibilidade em vez de excluir."
          confirmLabel="Excluir"
          danger
          onClose={() => setModal(null)}
          onConfirm={() => comErro(() => deleteOption(modal.opcao.id), 'Opção excluída')}
        />
      )}
    </div>
  )
}
