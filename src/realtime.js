import { supabase } from './supabase.js'

export function subscribeToCheckins(onChange) {
  return supabase
    .channel('check_ins_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'check_ins' }, onChange)
    .subscribe()
}

export function unsubscribe(channel) {
  supabase.removeChannel(channel)
}
