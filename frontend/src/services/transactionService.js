import { supabase } from './supabaseClient'

export const transactionService = {
  // Fetch all transactions belonging strictly to authenticated user
  async getTransactions(userId) {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const authUser = sessionData?.session?.user || (await supabase.auth.getUser()).data?.user
      const activeUserId = authUser?.id || userId

      if (!activeUserId || activeUserId === 'guest' || activeUserId === 'device_user') {
        return []
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', activeUserId)
        .order('transaction_date', { ascending: false })

      if (error) {
        console.error('Supabase fetch transactions error:', error)
        return []
      }
      return data || []
    } catch (err) {
      console.error('Transaction list error:', err)
      return []
    }
  },

  // Insert a new transaction record into Supabase PostgreSQL
  async createTransaction({ userId, type, amount, category, description }) {
    // 1. Fetch current active Supabase authenticated user session
    const { data: sessionData } = await supabase.auth.getSession()
    const currentAuthUser = sessionData?.session?.user || (await supabase.auth.getUser()).data?.user

    if (!currentAuthUser || !currentAuthUser.id) {
      console.warn('Supabase DB Insert Cancelled: No active Supabase auth session found.')
      throw new Error('Please sign in with Google or Email/Password to persist data to Supabase Database.')
    }

    const activeUserId = currentAuthUser.id

    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Transaction amount must be a positive number')
    }

    const validTypes = ['income', 'expense', 'deposit', 'withdrawal']
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid transaction type: ${type}`)
    }

    const payload = {
      user_id: activeUserId,
      type,
      amount,
      category: category || (type === 'deposit' ? 'Deposit' : 'Withdrawal'),
      description: description || '',
      transaction_date: new Date().toISOString(),
    }

    console.log('Inserting into Supabase PostgreSQL table "transactions":', payload)

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([payload])
        .select()

      if (error) {
        console.error('Supabase PostgreSQL insert failed:', error)
        throw error
      }

      console.log('SUCCESS: Transaction inserted into Supabase PostgreSQL:', data)
      return data && data.length > 0 ? data[0] : payload
    } catch (err) {
      console.error('Create transaction failed:', err)
      throw err
    }
  },

  // Delete transaction by ID
  async deleteTransaction(transactionId, userId) {
    if (!transactionId) return false
    const { data: sessionData } = await supabase.auth.getSession()
    const activeUserId = sessionData?.session?.user?.id || userId

    if (!activeUserId) return false

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', activeUserId)

      if (error) {
        console.error('Supabase transaction delete error:', error)
        throw error
      }
      return true
    } catch (err) {
      console.error('Delete transaction error:', err)
      throw err
    }
  },

  // Derived Financial Summary Metrics calculated from real user transactions
  calculateMetrics(transactionsList = []) {
    let totalIncome = 0
    let totalExpenses = 0

    transactionsList.forEach((tx) => {
      const amt = Number(tx.amount) || 0
      if (tx.type === 'deposit' || tx.type === 'income') {
        totalIncome += amt
      } else if (tx.type === 'withdrawal' || tx.type === 'expense') {
        totalExpenses += amt
      }
    })

    const balance = totalIncome - totalExpenses

    return {
      balance,
      totalIncome,
      totalExpenses,
    }
  },
}
