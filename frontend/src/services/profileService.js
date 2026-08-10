import { syncService } from './syncService'
import { offlineDatabase } from './offlineDatabase'

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
    if (!userId) return null
    return offlineDatabase.profiles.get(userId)
  },

  async ensureProfile(user) {
    if (!user?.id) return null
    const existing = await offlineDatabase.profiles.get(user.id)
    const profile = existing || {
      ...profilePayload(user),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
      last_sync_attempt: null,
      sync_error: null,
    }
    await offlineDatabase.profiles.put(profile)
    syncService.syncProfile(user.id).catch(() => {})
    return profile
  },

  async updateProfile(userId, updates) {
    if (!userId) return null
    const existing = await offlineDatabase.profiles.get(userId)
    const updated = {
      ...(existing || { user_id: userId, created_at: new Date().toISOString(), currency: 'PHP' }),
      ...updates,
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
      sync_error: null,
    }
    await offlineDatabase.profiles.put(updated)
    syncService.syncProfile(userId).catch(() => {})
    return updated
  },
}
