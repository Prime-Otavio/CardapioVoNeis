import { supabase } from './supabase'

export async function verifyPin(pin) {
  const { data, error } = await supabase.rpc('verify_owner_pin', { p_pin: pin })
  if (error) throw error
  return data === true
}

export async function setPin(pin) {
  const { error } = await supabase.rpc('set_owner_pin', { p_pin: pin })
  if (error) throw error
}

export async function pinIsSet() {
  const { data, error } = await supabase.rpc('owner_pin_is_set')
  if (error) throw error
  return data === true
}
