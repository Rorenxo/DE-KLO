import { supabase } from './supabaseClient'
import { createLocalId, enqueueOperation, offlineDatabase } from './offlineDatabase'
import { syncService } from './syncService'

const VALID_TYPES = ['income', 'expense', 'deposit', 'withdrawal']
const syncListeners = new Set()

function notifySync() {
  syncListeners.forEach((listener) => listener())
}

function visibleTransactions(records) {
  return records
    .filter((record) => record.sync_status !== 'pending-delete')
    .sort((a, b) => new Date(b.transaction_date || b.created_at) - new Date(a.transaction_date || a.created_at))
}

async function activeUserId(fallback) {
  try {
    const { data } = await supabase.auth.getSession()
    return data?.session?.user?.id || fallback
  } catch {
    return fallback
  }
}

export const transactionService = {
  subscribeSync(listener) {
    syncListeners.add(listener)
    return () => syncListeners.delete(listener)
  },

  async getLocalTransactions(userId) {
    if (!userId) return []
    return visibleTransactions(await offlineDatabase.transactions.where('user_id').equals(userId).toArray())
  },

  async getPendingCount(userId) {
    if (!userId) return 0
    return offlineDatabase.transactions
      .where('user_id').equals(userId)
      .filter((record) => record.sync_status !== 'synced')
      .count()
  },

  async getSyncState(userId) {
    const records = await offlineDatabase.transactions.where('user_id').equals(userId).toArray()
    const pending = records.filter((record) => record.sync_status !== 'synced')
    return {
      pendingCount: pending.length,
      syncing: pending.some((record) => record.sync_status === 'syncing'),
      hasError: pending.some((record) => record.sync_status === 'failed' || record.sync_error),
    }
  },

  async getTransactions(userId) {
    const activeId = await activeUserId(userId)
    if (!activeId || activeId === 'guest') return []

    // IndexedDB is the source of truth for the UI. The network refresh only fills it.
    const local = await this.getLocalTransactions(activeId)
    if (activeId !== 'device_user') {
      this.syncTransactions(activeId).catch(() => {})
    }
    return local
  },

  async createTransaction({ userId, type, amount, category, description }) {
    if (typeof amount !== 'number' || amount <= 0) throw new Error('Transaction amount must be a positive number')
    if (!VALID_TYPES.includes(type)) throw new Error(`Invalid transaction type: ${type}`)

    // A persisted Supabase session is authoritative when available. The fallback
    // is only used for device-local data and can never be uploaded to another user.
    const ownerId = await activeUserId(userId)
    if (!ownerId || ownerId === 'guest') throw new Error('A local user identity is required')
    const timestamp = new Date().toISOString()
    const record = {
      id: createLocalId(),
      user_id: ownerId,
      type,
      amount,
      category: category || (type === 'deposit' ? 'Deposit' : 'Withdrawal'),
      description: description || '',
      transaction_date: timestamp,
      created_at: timestamp,
      updated_at: timestamp,
      sync_status: 'pending',
      last_sync_attempt: null,
      sync_error: null,
    }

    // Commit locally before attempting any network work. This promise is the durability boundary.
    await offlineDatabase.transactions.put(record)
    await enqueueOperation({ user_id: ownerId, entity: 'transactions', entity_id: record.id, operation: 'upsert' })
    notifySync()
    if (ownerId !== 'device_user') {
      this.syncTransactions(ownerId).catch(() => {})
    }
    return record
  },

  async deleteTransaction(transactionId, userId) {
    if (!transactionId || !userId) return false
    const record = await offlineDatabase.transactions.get(transactionId)
    if (!record) return false
    const ownerId = await activeUserId(userId)
    if (record.user_id !== ownerId) return false

    if (record.sync_status === 'pending') {
      await offlineDatabase.transactions.delete(transactionId)
      await offlineDatabase.sync_operations.where({ entity: 'transactions', entity_id: transactionId, status: 'pending' }).modify({ status: 'completed' })
    } else {
      await offlineDatabase.transactions.update(transactionId, {
        sync_status: 'pending-delete',
        updated_at: new Date().toISOString(),
      })
    }
    await enqueueOperation({ user_id: ownerId, entity: 'transactions', entity_id: transactionId, operation: 'delete' })
    notifySync()
    if (ownerId !== 'device_user') this.syncTransactions(ownerId).catch(() => {})
    return true
  },

  async syncTransactions(userId) {
    try {
      return await syncService.syncPendingTransactions(userId)
    } finally {
      notifySync()
    }
  },

  calculateMetrics(transactionsList = []) {
    let totalIncome = 0
    let totalExpenses = 0
    transactionsList.forEach((tx) => {
      const amount = Number(tx.amount) || 0
      if (tx.type === 'deposit' || tx.type === 'income') totalIncome += amount
      if (tx.type === 'withdrawal' || tx.type === 'expense') totalExpenses += amount
    })
    return { balance: totalIncome - totalExpenses, totalIncome, totalExpenses }
  },
}

window.addEventListener('deklo:sync-complete', notifySync)
