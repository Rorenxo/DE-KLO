import { syncService } from './syncService'
import { createLocalId, enqueueOperation, offlineDatabase } from './offlineDatabase'

const listeners = new Set()
const notify = () => listeners.forEach((listener) => listener())

export const savingsService = {
  subscribeSync(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  async getGoals(userId) {
    if (!userId || userId === 'guest') return []
    const local = await offlineDatabase.savings_goals.where('user_id').equals(userId).toArray()
    if (navigator.onLine && userId !== 'device_user') syncService.syncSavingsGoals(userId).then(notify).catch(() => {})
    return local.filter((goal) => goal.sync_status !== 'pending-delete')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  },

  async createGoal({ userId, name, target_amount, current_amount = 0, deadline = null }) {
    if (!userId || userId === 'guest') throw new Error('Please sign in to save goals.')
    if (!name) throw new Error('Goal name is required')
    if (typeof target_amount !== 'number' || target_amount <= 0) throw new Error('Target amount must be positive')
    const now = new Date().toISOString()
    const goal = { id: createLocalId(), user_id: userId, name, target_amount, current_amount, deadline, created_at: now, updated_at: now, sync_status: 'pending', last_sync_attempt: null, sync_error: null }
    await offlineDatabase.savings_goals.put(goal)
    await enqueueOperation({ user_id: userId, entity: 'savings_goals', entity_id: goal.id, operation: 'upsert' })
    syncService.syncSavingsGoals(userId).then(notify).catch(() => {})
    return goal
  },

  async updateGoal(goalId, userId, updates) {
    const goal = await offlineDatabase.savings_goals.get(goalId)
    if (!goal || goal.user_id !== userId) throw new Error('Goal not found')
    const updated = { ...goal, ...updates, updated_at: new Date().toISOString(), sync_status: 'pending', sync_error: null }
    await offlineDatabase.savings_goals.put(updated)
    await enqueueOperation({ user_id: userId, entity: 'savings_goals', entity_id: goalId, operation: 'upsert' })
    syncService.syncSavingsGoals(userId).then(notify).catch(() => {})
    return updated
  },

  async deleteGoal(goalId, userId) {
    const goal = await offlineDatabase.savings_goals.get(goalId)
    if (!goal || goal.user_id !== userId) return false
    if (goal.sync_status === 'pending') {
      await offlineDatabase.savings_goals.delete(goalId)
      await offlineDatabase.sync_operations.where({ entity: 'savings_goals', entity_id: goalId, status: 'pending' }).modify({ status: 'completed' })
    } else {
      await offlineDatabase.savings_goals.update(goalId, { sync_status: 'pending-delete', updated_at: new Date().toISOString() })
    }
    await enqueueOperation({ user_id: userId, entity: 'savings_goals', entity_id: goalId, operation: 'delete' })
    syncService.syncSavingsGoals(userId).then(notify).catch(() => {})
    return true
  },
}

window.addEventListener('deklo:sync-complete', notify)
