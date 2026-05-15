import { supabase } from './supabase.js'

function toLocal(r) {
  return {
    id: r.id,
    plate: r.plate,
    name: r.name,
    phone: r.phone,
    checkinTime: new Date(r.checkin_time).getTime(),
    checkoutTime: r.checkout_time ? new Date(r.checkout_time).getTime() : null,
    status: r.status,
    amount: r.amount,
  }
}

function settingsToLocal(s) {
  return {
    rateFirstHour: s.rate_first_hour,
    rateSubsequent: s.rate_subsequent,
    useSubsequentRate: s.use_subsequent_rate,
    showCost: s.show_cost,
  }
}

export async function createCheckin({ plate, name, phone }) {
  const { data, error } = await supabase
    .from('check_ins')
    .insert({ plate, name, phone, status: 'active' })
    .select()
    .single()
  if (error) throw error
  return toLocal(data)
}

export async function plateIsActive(plate) {
  const { data } = await supabase
    .from('check_ins')
    .select('id')
    .eq('plate', plate)
    .eq('status', 'active')
    .limit(1)
  return data && data.length > 0
}

export async function getActiveCheckins() {
  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .eq('status', 'active')
    .order('checkin_time', { ascending: false })
  if (error) throw error
  return data.map(toLocal)
}

export async function getRecentCheckouts(limit = 10) {
  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .eq('status', 'completed')
    .order('checkout_time', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data.map(toLocal)
}

export async function getTodayCheckins() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .gte('checkin_time', today.toISOString())
  if (error) throw error
  return data.map(toLocal)
}

export async function completeCheckout(id, amount) {
  const { error } = await supabase
    .from('check_ins')
    .update({ status: 'completed', checkout_time: new Date().toISOString(), amount })
    .eq('id', id)
  if (error) throw error
}

export async function getSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single()
  if (error) return { rateFirstHour: 10, rateSubsequent: 8, useSubsequentRate: true, showCost: true }
  return settingsToLocal(data)
}

export async function getCompletedInRange(startDate, endDate) {
  const { data, error } = await supabase
    .from('check_ins')
    .select('checkout_time, amount')
    .eq('status', 'completed')
    .gte('checkout_time', startDate.toISOString())
    .lt('checkout_time', endDate.toISOString())
    .order('checkout_time', { ascending: true })
  if (error) throw error
  return data
}

export async function updateSettings({ rateFirstHour, rateSubsequent, useSubsequentRate }) {
  const { error } = await supabase
    .from('settings')
    .update({ rate_first_hour: rateFirstHour, rate_subsequent: rateSubsequent, use_subsequent_rate: useSubsequentRate })
    .eq('id', 1)
  if (error) throw error
}

export async function deleteCheckin(id) {
  const { error } = await supabase
    .from('check_ins')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function deleteAllCheckins() {
  const { error } = await supabase
    .from('check_ins')
    .delete()
    .not('id', 'is', null)
  if (error) throw error
}
