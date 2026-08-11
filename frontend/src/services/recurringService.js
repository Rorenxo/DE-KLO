import { supabase } from './supabaseClient'

const isUuid = (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

export const recurringService = {
  async getRecurring(userId) {
    if (!isUuid(userId)) return []

    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Supabase fetch recurring transactions warning:', error.message || error)
      return []
    }

    return data || []
  },

  async createRecurring({ userId, name, amount, type = 'expense', frequency = 'monthly', next_date = null }) {
    if (!isUuid(userId)) {
      throw new Error('Please sign in with a valid account to create recurring transactions.')
    }
    if (!name || typeof amount !== 'number' || amount <= 0) {
      throw new Error('Valid recurring transaction details are required')
    }

    const now = new Date().toISOString()
    const payload = {
      user_id: userId,
      name,
      amount,
      type,
      frequency,
      next_date,
      created_at: now,
      updated_at: now,
    }

    const { data, error } = await supabase
      .from('recurring_transactions')
      .insert(payload)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error creating recurring transaction:', error.message || error)
      throw error
    }

    return data || payload
  },

  async deleteRecurring(recurringId, userId) {
    if (!recurringId || !isUuid(userId)) return false

    const { error } = await supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', recurringId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting recurring transaction:', error.message || error)
      throw error
    }

    return true
  },
}
