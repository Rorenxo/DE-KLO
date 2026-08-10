import { supabase } from './supabaseClient'

export const savingsService = {
  // Fetch savings goals belonging strictly to authenticated user
  async getGoals(userId) {
    try {
      const { data: authData } = await supabase.auth.getUser()
      const activeUserId = authData?.user?.id || userId

      if (!activeUserId || activeUserId === 'guest' || activeUserId === 'device_user') {
        return []
      }

      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', activeUserId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase fetch savings_goals error:', error)
        return []
      }
      return data || []
    } catch (err) {
      console.error('Savings goals fetch error:', err)
      return []
    }
  },

  // Insert a new savings goal record into Supabase PostgreSQL
  async createGoal({ userId, name, target_amount, current_amount = 0, deadline = null }) {
    const { data: authData } = await supabase.auth.getUser()
    const activeUserId = authData?.user?.id || userId

    if (!activeUserId || activeUserId === 'guest' || activeUserId === 'device_user') {
      throw new Error('Please log in with Google or Email/Password to sync with Supabase Cloud Database.')
    }

    if (!name) throw new Error('Goal name is required')
    if (typeof target_amount !== 'number' || target_amount <= 0) {
      throw new Error('Target amount must be a positive number')
    }

    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .insert({
          user_id: activeUserId,
          name,
          target_amount,
          current_amount,
          deadline,
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase savings_goals insert error:', error)
        throw error
      }
      return data
    } catch (err) {
      console.error('Create savings goal error:', err)
      throw err
    }
  },

  // Update existing goal in Supabase
  async updateGoal(goalId, userId, updates) {
    if (!goalId) throw new Error('Goal ID is required')
    const { data: authData } = await supabase.auth.getUser()
    const activeUserId = authData?.user?.id || userId

    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .update(updates)
        .eq('id', goalId)
        .eq('user_id', activeUserId)
        .select()
        .single()

      if (error) {
        console.error('Supabase savings_goals update error:', error)
        throw error
      }
      return data
    } catch (err) {
      console.error('Update savings goal error:', err)
      throw err
    }
  },

  // Delete goal by ID
  async deleteGoal(goalId, userId) {
    if (!goalId) return false
    const { data: authData } = await supabase.auth.getUser()
    const activeUserId = authData?.user?.id || userId

    try {
      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', activeUserId)

      if (error) {
        console.error('Supabase savings_goals delete error:', error)
        throw error
      }
      return true
    } catch (err) {
      console.error('Delete savings goal error:', err)
      throw err
    }
  },
}
