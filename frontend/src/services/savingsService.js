import { supabase } from './supabaseClient'

const isUuid = (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

export const savingsService = {
  subscribeSync() {
    return () => {}
  },

  async getGoals(userId) {
    if (!isUuid(userId)) return []

    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Supabase fetch savings goals warning:', error.message || error)
      return []
    }

    return data || []
  },

  async createGoal({ userId, name, target_amount, current_amount = 0, deadline = null }) {
    if (!isUuid(userId)) {
      throw new Error('Please sign in with a valid account to create savings goals.')
    }
    if (!name) throw new Error('Goal name is required')
    if (typeof target_amount !== 'number' || target_amount <= 0) throw new Error('Target amount must be positive')

    const now = new Date().toISOString()
    const payload = {
      user_id: userId,
      name,
      target_amount,
      current_amount,
      deadline,
      created_at: now,
      updated_at: now,
    }

    const { data, error } = await supabase
      .from('savings_goals')
      .insert(payload)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error creating savings goal:', error.message || error)
      throw error
    }

    return data || payload
  },

  async updateGoal(goalId, userId, updates) {
    if (!goalId || !isUuid(userId)) throw new Error('Invalid goal or user ID')

    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('savings_goals')
      .update(payload)
      .eq('id', goalId)
      .eq('user_id', userId)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error updating savings goal:', error.message || error)
      throw error
    }

    return data
  },

  async deleteGoal(goalId, userId) {
    if (!goalId || !isUuid(userId)) return false

    const { error } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting savings goal:', error.message || error)
      throw error
    }

    return true
  },
}
