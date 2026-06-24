import { supabase } from './supabase'

// Faz upload de uma imagem para o bucket 'produtos' e devolve a URL pública.
export async function uploadProductImage(file) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await supabase.storage
    .from('produtos')
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error

  const { data } = supabase.storage.from('produtos').getPublicUrl(path)
  return data.publicUrl
}
