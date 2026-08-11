import { supabase } from './supabaseClient'

const isUuid = (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

export function generateCardNumber() {
  return `DK-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`
}

export function getCtdDate() {
  const now = new Date()
  return `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getFullYear()).slice(-2)}`
}

function profilePayload(user) {
  return {
    user_id: user.id,
    nickname: user.user_metadata?.nickname || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
    card_number: user.user_metadata?.card_number || generateCardNumber(),
    ctd_date: user.user_metadata?.ctd_date || getCtdDate(),
    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
    currency: 'PHP',
  }
}

export const profileService = {
  async getProfile(userId) {
    if (!isUuid(userId)) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.warn('Supabase fetch profile warning:', error.message || error)
      return null
    }

    return data
  },

  async ensureProfile(user) {
    if (!isUuid(user?.id)) return null

    const existing = await this.getProfile(user.id)
    if (existing) return existing

    const payload = {
      ...profilePayload(user),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .maybeSingle()

    if (error) {
      console.warn('Supabase ensure profile warning:', error.message || error)
      return payload
    }

    return data || payload
  },

  async updateProfile(userId, updates) {
    if (!isUuid(userId)) return null

    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('user_id', userId)
      .select()
      .maybeSingle()

    if (error) {
      console.warn('Supabase update profile warning:', error.message || error)
      throw error
    }

    return data
  },
}
