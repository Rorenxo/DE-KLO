import { supabase } from './supabaseClient'

export function generateCardNumber() {
  const block1 = Math.floor(1000 + Math.random() * 9000)
  const block2 = Math.floor(1000 + Math.random() * 9000)
  const block3 = Math.floor(1000 + Math.random() * 9000)
  return `DK-${block1}-${block2}-${block3}`
}

export function getCtdDate() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = String(now.getFullYear()).slice(-2)
  return `${month}/${year}`
}

export const profileService = {
  async getProfile(userId) {
    if (!userId) return null
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Supabase profile error:', error)
      }
      return data
    } catch (err) {
      console.error('Profile fetch error:', err)
      return null
    }
  },

  async ensureProfile(user) {
    if (!user || !user.id) return null

    const nickname =
      user?.user_metadata?.nickname ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split('@')[0] ||
      'User'

    const avatarUrl =
      user?.user_metadata?.avatar_url ||
      user?.user_metadata?.picture ||
      null

    const cardNumber = user?.user_metadata?.card_number || generateCardNumber()
    const ctdDate = user?.user_metadata?.ctd_date || getCtdDate()

    try {
      console.log('Ensuring profile in Supabase PostgreSQL "profiles" table for user:', user.id)

      const payload = {
        user_id: user.id,
        nickname,
        card_number: cardNumber,
        ctd_date: ctdDate,
        avatar_url: avatarUrl,
        currency: 'PHP',
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single()

      if (error) {
        console.error('Supabase profile upsert error:', error)
        // If upsert failed due to schema, return formatted profile object
        return payload
      }

      console.log('Profile successfully saved/updated in Supabase "profiles" table:', data)
      return data
    } catch (err) {
      console.error('Profile creation error:', err)
      return {
        user_id: user.id,
        nickname,
        card_number: cardNumber,
        ctd_date: ctdDate,
        avatar_url: avatarUrl,
        currency: 'PHP',
      }
    }
  },

  async updateProfile(userId, updates) {
    if (!userId) return null
    try {
      console.log('Updating profile in Supabase "profiles" table:', userId, updates)
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('Supabase profile update error:', error)
        throw error
      }

      // Also update auth user metadata for consistency
      await supabase.auth.updateUser({
        data: updates,
      }).catch(() => {})

      return data
    } catch (err) {
      console.error('Profile update error:', err)
      throw err
    }
  },
}
