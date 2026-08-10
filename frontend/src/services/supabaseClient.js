import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseOrigin = supabaseUrl ? supabaseUrl.replace(/\/+$/, '') : ''

// Initialize Supabase client configured for persistent PWA offline session storage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

export async function checkSupabaseConnectivity(timeoutMs = 4000) {
  if (!supabaseOrigin) return false
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`${supabaseOrigin}/auth/v1/health`, {
      method: 'GET',
      headers: supabaseAnonKey ? { apikey: supabaseAnonKey } : undefined,
      cache: 'no-store',
      signal: controller.signal,
    })
    // Any HTTP response means the network path to Supabase is alive.
    return response.status > 0
  } catch {
    return false
  } finally {
    window.clearTimeout(timeoutId)
  }
}
