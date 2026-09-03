import { supabase } from './supabase'

// Multi-loja (migration 0014). O painel antigo não conhecia lojas; se a tabela
// ainda não existir no banco em que este build está apontando, devolvemos lista
// vazia e o app segue em modo loja única — sem filtro por store_id.
export async function listStores() {
  const { data, error } = await supabase.from('stores').select('*').order('sort_order')
  if (error) return []
  return data ?? []
}

export async function saveMerchantId(storeId, merchantId) {
  const { error } = await supabase
    .from('stores')
    .update({ ifood_merchant_id: merchantId || null })
    .eq('id', storeId)
  if (error) throw error
}
