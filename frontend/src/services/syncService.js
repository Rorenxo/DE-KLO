import { supabase } from './supabaseClient'
import { offlineDatabase } from './offlineDatabase'

let syncInProgress = false

function notifyComplete() {
  window.dispatchEvent(new CustomEvent('deklo:sync-complete'))
}

async function currentUserId(userId) {
  if (userId) return userId
  const { data } = await supabase.auth.getSession()
  return data?.session?.user?.id || null
}

async function markFailed(table, id, attempt, error) {
  await offlineDatabase[table].update(id, {
    sync_status: 'failed',
    last_sync_attempt: attempt,
    sync_error: error?.message || 'Sync failed',
  })
}

export const syncService = {
  async getSyncState(userId) {
    const activeId = await currentUserId(userId)
    if (!activeId) return { pendingCount: 0, syncing: false, hasError: false }

    const [transactions, goals, recurring, profile] = await Promise.all([
      offlineDatabase.transactions.where('user_id').equals(activeId).filter((record) => record.sync_status !== 'synced').toArray(),
      offlineDatabase.savings_goals.where('user_id').equals(activeId).filter((record) => record.sync_status !== 'synced').toArray(),
      offlineDatabase.recurring_transactions.where('user_id').equals(activeId).filter((record) => record.sync_status !== 'synced').toArray(),
      offlineDatabase.profiles.get(activeId),
    ])
    const pendingRecords = [...transactions, ...goals, ...recurring]
    if (profile && profile.sync_status !== 'synced') pendingRecords.push(profile)

    return {
      pendingCount: pendingRecords.length,
      syncing: pendingRecords.some((record) => record.sync_status === 'syncing'),
      hasError: pendingRecords.some((record) => record.sync_status === 'failed' || record.sync_error),
    }
  },

  async syncPendingTransactions(userId) {
    const activeId = await currentUserId(userId)
    if (!navigator.onLine || !activeId || activeId === 'guest' || activeId === 'device_user') return false

    const pending = await offlineDatabase.transactions.where('user_id').equals(activeId)
      .filter((record) => record.sync_status !== 'synced').toArray()

    for (const record of pending) {
      const attempt = new Date().toISOString()
      await offlineDatabase.transactions.update(record.id, {
        sync_status: 'syncing', last_sync_attempt: attempt, sync_error: null,
      })
      try {
        if (record.sync_status === 'pending-delete') {
          const { error } = await supabase.from('transactions').delete().eq('id', record.id).eq('user_id', activeId)
          if (error && error.code !== 'PGRST116') throw error
          await offlineDatabase.transactions.delete(record.id)
        } else {
          const { data, error } = await supabase.from('transactions').upsert({
            id: record.id, user_id: activeId, type: record.type, amount: record.amount,
            category: record.category, description: record.description,
            transaction_date: record.transaction_date, updated_at: record.updated_at,
          }, { onConflict: 'id' }).select().single()
          if (error) throw error
          await offlineDatabase.transactions.put({
            ...record, ...(data || {}), sync_status: 'synced',
            last_sync_attempt: attempt, sync_error: null,
          })
        }
        await offlineDatabase.sync_operations.where({ entity: 'transactions', entity_id: record.id, status: 'pending' })
          .modify({ status: 'completed' })
      } catch (error) {
        await markFailed('transactions', record.id, attempt, error)
      }
    }

    const { data: remote, error } = await supabase.from('transactions').select('*').eq('user_id', activeId)
    if (error) throw error
    const pendingIds = new Set(pending.map((record) => record.id))
    for (const record of remote || []) {
      if (!pendingIds.has(record.id)) await offlineDatabase.transactions.put({ ...record, sync_status: 'synced' })
    }
    return true
  },

  async syncSavingsGoals(userId) {
    const activeId = await currentUserId(userId)
    if (!navigator.onLine || !activeId || activeId === 'guest' || activeId === 'device_user') return false
    const pending = await offlineDatabase.savings_goals.where('user_id').equals(activeId)
      .filter((goal) => goal.sync_status !== 'synced').toArray()
    for (const goal of pending) {
      const attempt = new Date().toISOString()
      await offlineDatabase.savings_goals.update(goal.id, { sync_status: 'syncing', last_sync_attempt: attempt, sync_error: null })
      try {
        if (goal.sync_status === 'pending-delete') {
          const { error } = await supabase.from('savings_goals').delete().eq('id', goal.id).eq('user_id', activeId)
          if (error) throw error
          await offlineDatabase.savings_goals.delete(goal.id)
        } else {
          const { data, error } = await supabase.from('savings_goals').upsert({
            id: goal.id, user_id: activeId, name: goal.name, target_amount: goal.target_amount,
            current_amount: goal.current_amount, deadline: goal.deadline, updated_at: goal.updated_at,
          }, { onConflict: 'id' }).select().single()
          if (error) throw error
          await offlineDatabase.savings_goals.put({ ...goal, ...(data || {}), sync_status: 'synced', last_sync_attempt: attempt, sync_error: null })
        }
        await offlineDatabase.sync_operations.where({ entity: 'savings_goals', entity_id: goal.id, status: 'pending' }).modify({ status: 'completed' })
      } catch (error) {
        await markFailed('savings_goals', goal.id, attempt, error)
      }
    }
    const { data: remote, error } = await supabase.from('savings_goals').select('*').eq('user_id', activeId)
    if (error) throw error
    const pendingIds = new Set(pending.map((goal) => goal.id))
    for (const goal of remote || []) if (!pendingIds.has(goal.id)) await offlineDatabase.savings_goals.put({ ...goal, sync_status: 'synced' })
    return true
  },

  async syncRecurringTransactions(userId) {
    const activeId = await currentUserId(userId)
    if (!navigator.onLine || !activeId || activeId === 'guest' || activeId === 'device_user') return false
    const pending = await offlineDatabase.recurring_transactions.where('user_id').equals(activeId)
      .filter((row) => row.sync_status !== 'synced').toArray()
    for (const row of pending) {
      const attempt = new Date().toISOString()
      await offlineDatabase.recurring_transactions.update(row.id, { sync_status: 'syncing', last_sync_attempt: attempt, sync_error: null })
      try {
        if (row.sync_status === 'pending-delete') {
          const { error } = await supabase.from('recurring_transactions').delete().eq('id', row.id).eq('user_id', activeId)
          if (error) throw error
          await offlineDatabase.recurring_transactions.delete(row.id)
        } else {
          const { data, error } = await supabase.from('recurring_transactions').upsert({
            id: row.id, user_id: activeId, name: row.name, amount: row.amount, type: row.type,
            frequency: row.frequency, next_date: row.next_date, updated_at: row.updated_at,
          }, { onConflict: 'id' }).select().single()
          if (error) throw error
          await offlineDatabase.recurring_transactions.put({ ...row, ...(data || {}), sync_status: 'synced', last_sync_attempt: attempt, sync_error: null })
        }
        await offlineDatabase.sync_operations.where({ entity: 'recurring_transactions', entity_id: row.id, status: 'pending' }).modify({ status: 'completed' })
      } catch (error) {
        await markFailed('recurring_transactions', row.id, attempt, error)
      }
    }
    const { data: remote, error } = await supabase.from('recurring_transactions').select('*').eq('user_id', activeId)
    if (error) throw error
    const pendingIds = new Set(pending.map((row) => row.id))
    for (const row of remote || []) if (!pendingIds.has(row.id)) await offlineDatabase.recurring_transactions.put({ ...row, sync_status: 'synced' })
    return true
  },

  async syncProfile(userId) {
    const activeId = await currentUserId(userId)
    if (!navigator.onLine || !activeId || activeId === 'guest' || activeId === 'device_user') return false
    const profile = await offlineDatabase.profiles.get(activeId)
    // App startup can run before the local profile cache has been populated.
    // In that case there is nothing local to upload yet; fetch the cloud copy below.
    if (profile && profile.sync_status !== 'synced') {
      const attempt = new Date().toISOString()
      await offlineDatabase.profiles.update(activeId, { sync_status: 'syncing', last_sync_attempt: attempt, sync_error: null })
      try {
        const { data, error } = await supabase.from('profiles').upsert({
          user_id: activeId, nickname: profile.nickname, card_number: profile.card_number,
          ctd_date: profile.ctd_date, avatar_url: profile.avatar_url, currency: profile.currency,
          updated_at: profile.updated_at,
        }, { onConflict: 'user_id' }).select().single()
        if (error) throw error
        await offlineDatabase.profiles.put({ ...profile, ...(data || {}), sync_status: 'synced', last_sync_attempt: attempt, sync_error: null })
      } catch (error) {
        await markFailed('profiles', activeId, attempt, error)
      }
    }
    const { data: remote, error } = await supabase.from('profiles').select('*').eq('user_id', activeId).maybeSingle()
    if (error) throw error
    if (remote && (!profile || profile.sync_status === 'synced')) await offlineDatabase.profiles.put({ ...remote, sync_status: 'synced' })
    return true
  },

  async syncAll(userId) {
    if (syncInProgress || !navigator.onLine) return false
    syncInProgress = true
    try {
      const activeId = await currentUserId(userId)
      if (!activeId) return false
      await Promise.all([
        this.syncPendingTransactions(activeId),
        this.syncSavingsGoals(activeId),
        this.syncRecurringTransactions(activeId),
        this.syncProfile(activeId),
      ])
      return true
    } catch (error) {
      console.warn('Sync deferred; local data remains safe:', error)
      return false
    } finally {
      syncInProgress = false
      notifyComplete()
    }
  },
}

window.addEventListener('online', () => syncService.syncAll().catch(() => {}))
