import { syncService } from './syncService'
import { createLocalId, enqueueOperation, offlineDatabase } from './offlineDatabase'

export const recurringService = {
  async getRecurring(userId) {
    if (!userId) return []
    const local = await offlineDatabase.recurring_transactions.where('user_id').equals(userId).toArray()
    if (userId !== 'device_user') syncService.syncRecurringTransactions(userId).catch(() => {})
    return local.filter((row) => row.sync_status !== 'pending-delete')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  },

  async createRecurring({ userId, name, amount, type = 'expense', frequency = 'monthly', next_date = null }) {
    if (!userId || !name || typeof amount !== 'number' || amount <= 0) throw new Error('Valid recurring transaction details are required')
    const now = new Date().toISOString()
    const row = { id: createLocalId(), user_id: userId, name, amount, type, frequency, next_date, created_at: now, updated_at: now, sync_status: 'pending', last_sync_attempt: null, sync_error: null }
    await offlineDatabase.recurring_transactions.put(row)
    await enqueueOperation({ user_id: userId, entity: 'recurring_transactions', entity_id: row.id, operation: 'upsert' })
    syncService.syncRecurringTransactions(userId).catch(() => {})
    return row
  },

  async deleteRecurring(recurringId, userId) {
    const row = await offlineDatabase.recurring_transactions.get(recurringId)
    if (!row || row.user_id !== userId) return false
    if (row.sync_status === 'pending') {
      await offlineDatabase.recurring_transactions.delete(recurringId)
      await offlineDatabase.sync_operations.where({ entity: 'recurring_transactions', entity_id: recurringId, status: 'pending' }).modify({ status: 'completed' })
    } else {
      await offlineDatabase.recurring_transactions.update(recurringId, { sync_status: 'pending-delete', updated_at: new Date().toISOString() })
    }
    await enqueueOperation({ user_id: userId, entity: 'recurring_transactions', entity_id: recurringId, operation: 'delete' })
    syncService.syncRecurringTransactions(userId).catch(() => {})
    return true
  },
}
