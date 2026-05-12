import { supabase } from './supabase.js'

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signOut() {
  await supabase.auth.signOut()
  window.location.href = '/login.html'
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    window.location.href = '/login.html'
    return null
  }
  return session
}
