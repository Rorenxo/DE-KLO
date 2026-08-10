import { checkSupabaseConnectivity, supabase } from './supabaseClient'
import { offlineDatabase } from './offlineDatabase'

let syncInProgress = false
let lastConnectionCheckAt = 0
let lastKnownOnline = navigator.onLine

function notifyComplete() {
  window.dispatchEvent(new CustomEvent('deklo:sync-complete'))
}

async function currentUserId(userId) {
  try {
    const { data } = await supabase.auth.getSession()
    const sessionUserId = data?.session?.user?.id
    if (sessionUserId) return sessionUserId
  } catch {}

  if (userId && userId !== 'guest' && userId !== 'device_user' && userId !== 'active_user' && !userId.includes('@')) {
    return userId
  }
  return null
}

function isNetworkError(error) {
  if (!navigator.onLine) return true
  const msg = (error?.message || '').toLowerCase()
  const name = (error?.name || '').toLowerCase()
  return (
    name === 'fetcherror' ||
    name === 'aborterror' ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network error') ||
    msg.includes('connection') ||
    error?.status === 0
  )
}

async function markFailed(table, id, attempt, error) {
  const parts = []
  if (error?.message) parts.push(error.message)
  if (error?.code) parts.push(`Code: ${error.code}`)
  if (error?.details) parts.push(`Details: ${error.details}`)
  if (error?.hint) parts.push(`Hint: ${error.hint}`)
  const formattedError = parts.join(' | ') || 'Sync failed'

  await offlineDatabase[table].update(id, {
    sync_status: 'failed',
    last_sync_attempt: attempt,
    sync_error: formattedError,
  })
}

async function resolveOnlineStatus({ forceProbe = false } = {}) {
  if (!navigator.onLine) {
    lastKnownOnline = false
    return false
  }

  const now = Date.now()
  const shouldProbe = forceProbe || (now - lastConnectionCheckAt > 15000)

  if (!shouldProbe) {
    return lastKnownOnline
  }

  lastConnectionCheckAt = now
  const reachable = await checkSupabaseConnectivity()
  lastKnownOnline = reachable
  return reachable
}

export const syncService = {
  async getConnectionState({ refresh = false } = {}) {
    const isOnline = await resolveOnlineStatus({ forceProbe: refresh })
    return { isOnline }
  },

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
      hasError: pendingRecords.some((record) => record.sync_status === 'failed' || Boolean(record.sync_error)),
    }
  },

  async syncPendingTransactions(userId) {
    const activeId = await currentUserId(userId)
    if (!activeId) return false
    if (!(await resolveOnlineStatus())) return false

    const pending = await offlineDatabase.transactions
      .filter((record) =>
        (record.user_id === activeId || record.user_id === 'device_user' || record.user_id === 'active_user') &&
        record.sync_status !== 'synced'
      ).toArray()

    for (const record of pending) {
      const attempt = new Date().toISOString()
      await offlineDatabase.transactions.update(record.id, {
        user_id: activeId,
        sync_status: 'syncing',
        last_sync_attempt: attempt,
        sync_error: null,
      })
      try {
        if (record.sync_status === 'pending-delete') {
          const { error } = await supabase.from('transactions').delete().eq('id', record.id).eq('user_id', activeId)
          if (error && error.code !== 'PGRST116') throw error
          await offlineDatabase.transactions.delete(record.id)
        } else {
          const payload = {
            id: record.id,
            user_id: activeId,
            type: record.type,
            amount: record.amount,
            category: record.category || (record.type === 'deposit' ? 'Deposit' : 'Withdrawal'),
            description: record.description || '',
            transaction_date: record.transaction_date || attempt,
            created_at: record.created_at || record.transaction_date || attempt,
            updated_at: record.updated_at || attempt,
          }
          const { data, error } = await supabase
            .from('transactions')
            .upsert(payload, { onConflict: 'id' })
            .select()
            .maybeSingle()

          if (error) throw error

          await offlineDatabase.transactions.put({
            ...record,
            ...(data || payload),
            user_id: activeId,
            sync_status: 'synced',
            last_sync_attempt: attempt,
            sync_error: null,
          })
        }
        await offlineDatabase.sync_operations
          .where({ entity: 'transactions', entity_id: record.id, status: 'pending' })
          .modify({ status: 'completed' })
      } catch (error) {
        if (isNetworkError(error)) {
          await offlineDatabase.transactions.update(record.id, {
            user_id: activeId,
            sync_status: 'pending',
            last_sync_attempt: attempt,
            sync_error: null,
          })
          break
        } else {
          await markFailed('transactions', record.id, attempt, error)
        }
      }
    }

    try {
      const { data: remote, error } = await supabase.from('transactions').select('*').eq('user_id', activeId)
      if (!error && remote) {
        const localRecords = await offlineDatabase.transactions.where('user_id').equals(activeId).toArray()
        const pendingIds = new Set(localRecords.filter((r) => r.sync_status !== 'synced').map((r) => r.id))
        for (const record of remote) {
          if (!pendingIds.has(record.id)) {
            await offlineDatabase.transactions.put({ ...record, sync_status: 'synced' })
          }
        }
      }
    } catch {}

    return true
  },

  async syncSavingsGoals(userId) {
    const activeId = await currentUserId(userId)
    if (!activeId) return false
    if (!(await resolveOnlineStatus())) return false
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
          }, { onConflict: 'id' }).select().maybeSingle()
          if (error) throw error
          await offlineDatabase.savings_goals.put({ ...goal, ...(data || {}), sync_status: 'synced', last_sync_attempt: attempt, sync_error: null })
        }
        await offlineDatabase.sync_operations.where({ entity: 'savings_goals', entity_id: goal.id, status: 'pending' }).modify({ status: 'completed' })
      } catch (error) {
        if (isNetworkError(error)) {
          await offlineDatabase.savings_goals.update(goal.id, { sync_status: 'pending', last_sync_attempt: attempt, sync_error: null })
          break
        } else {
          await markFailed('savings_goals', goal.id, attempt, error)
        }
      }
    }
    try {
      const { data: remote, error } = await supabase.from('savings_goals').select('*').eq('user_id', activeId)
      if (!error && remote) {
        const pendingIds = new Set(pending.map((goal) => goal.id))
        for (const goal of remote) if (!pendingIds.has(goal.id)) await offlineDatabase.savings_goals.put({ ...goal, sync_status: 'synced' })
      }
    } catch {}
    return true
  },

  async syncRecurringTransactions(userId) {
    const activeId = await currentUserId(userId)
    if (!activeId) return false
    if (!(await resolveOnlineStatus())) return false
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
          }, { onConflict: 'id' }).select().maybeSingle()
          if (error) throw error
          await offlineDatabase.recurring_transactions.put({ ...row, ...(data || {}), sync_status: 'synced', last_sync_attempt: attempt, sync_error: null })
        }
        await offlineDatabase.sync_operations.where({ entity: 'recurring_transactions', entity_id: row.id, status: 'pending' }).modify({ status: 'completed' })
      } catch (error) {
        if (isNetworkError(error)) {
          await offlineDatabase.recurring_transactions.update(row.id, { sync_status: 'pending', last_sync_attempt: attempt, sync_error: null })
          break
        } else {
          await markFailed('recurring_transactions', row.id, attempt, error)
        }
      }
    }
    try {
      const { data: remote, error } = await supabase.from('recurring_transactions').select('*').eq('user_id', activeId)
      if (!error && remote) {
        const pendingIds = new Set(pending.map((row) => row.id))
        for (const row of remote) if (!pendingIds.has(row.id)) await offlineDatabase.recurring_transactions.put({ ...row, sync_status: 'synced' })
      }
    } catch {}
    return true
  },

  async syncProfile(userId) {
    const activeId = await currentUserId(userId)
    if (!activeId) return false
    if (!(await resolveOnlineStatus())) return false
    const profile = await offlineDatabase.profiles.get(activeId)
    if (profile && profile.sync_status !== 'synced') {
      const attempt = new Date().toISOString()
      await offlineDatabase.profiles.update(activeId, { sync_status: 'syncing', last_sync_attempt: attempt, sync_error: null })
      try {
        const { data, error } = await supabase.from('profiles').upsert({
          user_id: activeId, nickname: profile.nickname, card_number: profile.card_number,
          ctd_date: profile.ctd_date, avatar_url: profile.avatar_url, currency: profile.currency,
          updated_at: profile.updated_at,
        }, { onConflict: 'user_id' }).select().maybeSingle()
        if (error) throw error
        await offlineDatabase.profiles.put({ ...profile, ...(data || {}), sync_status: 'synced', last_sync_attempt: attempt, sync_error: null })
      } catch (error) {
        if (isNetworkError(error)) {
          await offlineDatabase.profiles.update(activeId, { sync_status: 'pending', last_sync_attempt: attempt, sync_error: null })
        } else {
          await markFailed('profiles', activeId, attempt, error)
        }
      }
    }
    try {
      const { data: remote, error } = await supabase.from('profiles').select('*').eq('user_id', activeId).maybeSingle()
      if (!error && remote && (!profile || profile.sync_status === 'synced')) {
        await offlineDatabase.profiles.put({ ...remote, sync_status: 'synced' })
      }
    } catch {}
    return true
  },

  async syncAll(userId) {
    if (syncInProgress) return false
    if (!(await resolveOnlineStatus())) return false
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

