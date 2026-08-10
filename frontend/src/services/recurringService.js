import { supabase } from './supabaseClient'

export const recurringService = {
  // Fetch recurring transactions belonging strictly to authenticated user
  async getRecurring(userId) {
    if (!userId) return []
    try {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase fetch recurring_transactions error:', error)
        return []
      }
      return data || []
    } catch (err) {
      console.error('Recurring transactions fetch error:', err)
      return []
    }
  },

  // Insert a new recurring transaction into Supabase PostgreSQL
  async createRecurring({ userId, name, amount, type = 'expense', frequency = 'monthly', next_date = null }) {
    if (!userId) throw new Error('User ID is required for recurring transactions')
    if (!name) throw new Error('Recurring item name is required')
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Amount must be a positive number')
    }

    try {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert({
          user_id: userId,
          name,
          amount,
          type,
          frequency,
          next_date,
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase recurring_transactions insert error:', error)
        throw error
      }
      return data
    } catch (err) {
      console.error('Create recurring transaction error:', err)
      throw err
    }
  },

  // Delete recurring record
  async deleteRecurring(recurringId, userId) {
    if (!recurringId || !userId) return false
    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', recurringId)
        .eq('user_id', userId)

      if (error) {
        console.error('Supabase recurring_transactions delete error:', error)
        throw error
      }
      return true
    } catch (err) {
      console.error('Delete recurring transaction error:', err)
      throw err
    }
  },
}
