import { useCallback, useEffect, useState } from 'react'
import { listQueue, clearQueue, callIfoodSync, ROTULO_CAMPO, valorLegivel } from '../lib/ifood'
import { saveMerchantId } from '../lib/stores'
import { brl } from '../utils'
import { useStore } from './StoreProvider'
import { useToast } from './Toast'
import ConfirmModal from './ConfirmModal'

// Fila de mudanças pendentes no iFood. A Edge Function ifood-sync ainda não
// tem credencial em produção — até lá, o fluxo real é ajustar no Gestor de
// Pedidos e usar "já ajustei na mão" para zerar a fila.
export default function IfoodPage() {
  const { store, storeId, loading: lojaCarregando } = useStore()
  const avisar = useToast()

  const [fila, setFila] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [merchant, setMerchant] = useState('')
  const [saida, setSaida] = useState('')
  const [ocupado, setOcupado] = useState(null)
  const [confirmando, setConfirmando] = useState(false)

  const recarregar = useCallback(async () => {
    setCarregando(true)
    setFila(await listQueue(storeId))
    setCarregando(false)
  }, [storeId])

  useEffect(() => {
    if (!lojaCarregando) recarregar()
  }, [lojaCarregando, recarregar])

  useEffect(() => {
    setMerchant(store?.ifood_merchant_id ?? '')
  }, [store])

  async function salvarMerchant() {
    if (!storeId) return avisar('Sem loja selecionada.', true)
    try {
      await saveMerchantId(storeId, merchant.trim())
      avisar('ID do iFood salvo')
    } catch (err) {
      avisar(`Não salvou o ID: ${err.message}`, true)
    }
  }

  async function chamar(acao, corpo) {
    setOcupado(acao)
    setSaida('')
    const r = await callIfoodSync(corpo)
    setOcupado(null)
    setSaida(r?.mensagem || r?.erro || JSON.stringify(r, null, 1))
    return r
  }

  return (
    <div className="pb-4">
      <h2 className="mb-2 font-display text-2xl italic text-ink">iFood</h2>
      <p className="mb-4 font-sans text-sm text-ink/50">
        Tudo que mudou aqui e ainda não foi refletido no iFood.
      </p>

      <div className="mb-5 rounded-2xl border border-ink/10 bg-white p-4 shadow-card">
        <label className="mb-1 block font-sans text-xs font-semibold uppercase tracking-wide text-ink/45">
          ID desta loja no iFood
        </label>
        <input
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          placeholder="cole aqui o merchant id"
          className="w-full rounded-xl border border-ink/15 px-4 py-3 font-sans text-base outline-none focus:border-accent"
        />
        <button
          onClick={salvarMerchant}
          className="mt-2 w-full rounded-xl border border-ink/15 py-3 font-sans text-sm font-semibold text-ink/70"
        >
          Salvar ID
        </button>
      </div>

      {carregando ? (
        <p className="py-10 text-center font-sans text-sm text-ink/40">Carregando fila…</p>
      ) : !fila.length ? (
        <p className="py-10 text-center font-sans text-sm text-ink/40">Tudo em dia com o iFood.</p>
      ) : (
        <ul className="space-y-2">
          {fila.map((f) => (
            <li key={f.id} className="rounded-2xl border border-ink/10 bg-white p-3.5 shadow-card">
              <p className="font-sans text-sm font-semibold text-ink">{f.product_name}</p>
              <p className="font-sans text-xs text-ink/50">
                {ROTULO_CAMPO[f.field] ?? f.field}:{' '}
                <del>{valorLegivel(f.field, f.old_value, brl)}</del> →{' '}
                <ins className="font-bold text-folha no-underline">
                  {valorLegivel(f.field, f.new_value, brl)}
                </ins>
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 space-y-2">
        <button
          disabled={!fila.length || ocupado}
          onClick={async () => {
            const r = await chamar('sync', { action: 'sync', store_id: storeId })
            avisar(r?.ok ? `${r.enviados ?? 0} enviados ao iFood` : 'Deu problema — veja o detalhe abaixo', !r?.ok)
            recarregar()
          }}
          className="w-full rounded-xl bg-accent py-4 font-sans text-base font-semibold text-white disabled:opacity-40"
        >
          {ocupado === 'sync' ? 'Enviando…' : 'Enviar para o iFood agora'}
        </button>
        <button
          disabled={!!ocupado}
          onClick={() => chamar('ping', { action: 'ping' })}
          className="w-full rounded-xl border border-ink/15 bg-white py-3 font-sans text-sm font-semibold text-ink/70 disabled:opacity-40"
        >
          {ocupado === 'ping' ? 'Testando…' : 'Testar conexão com o iFood'}
        </button>
        <button
          disabled={!fila.length}
          onClick={() => setConfirmando(true)}
          className="w-full rounded-xl border border-ink/15 bg-white py-3 font-sans text-sm text-ink/60 disabled:opacity-40"
        >
          Já ajustei na mão, limpar a fila
        </button>
      </div>

      {saida && (
        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-ink/5 p-3 font-mono text-xs text-ink/60">
          {saida}
        </pre>
      )}

      {confirmando && (
        <ConfirmModal
          title="Limpar a fila"
          message="Isso apenas marca as mudanças como resolvidas aqui, sem mexer no iFood. Confirma que você já ajustou lá?"
          confirmLabel="Já ajustei"
          onClose={() => setConfirmando(false)}
          onConfirm={async () => {
            setConfirmando(false)
            try {
              await clearQueue(storeId)
              avisar('Fila do iFood zerada')
              recarregar()
            } catch (err) {
              avisar(`Não deu para limpar: ${err.message}`, true)
            }
          }}
        />
      )}
    </div>
  )
}
