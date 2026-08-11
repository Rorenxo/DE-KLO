import { supabase } from './supabaseClient'

const VALID_TYPES = ['income', 'expense', 'deposit', 'withdrawal']

async function getAuthenticatedUserId(fallbackId) {
  try {
    const { data } = await supabase.auth.getSession()
    const sessionUserId = data?.session?.user?.id
    if (sessionUserId) return sessionUserId
  } catch {}

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fallbackId)
  return isUuid ? fallbackId : null
}

export const transactionService = {
  subscribeSync() {
    return () => {}
  },

  async getLocalTransactions(userId) {
    return this.getTransactions(userId)
  },

  async getPendingCount() {
    return 0
  },

  async getSyncState() {
    return { pendingCount: 0, syncing: false, hasError: false }
  },

  async getTransactions(userId) {
    const activeId = await getAuthenticatedUserId(userId)
    if (!activeId) return []

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', activeId)
      .order('transaction_date', { ascending: false })

    if (error) {
      console.warn('Supabase fetch transactions warning:', error.message || error)
      return []
    }

    return data || []
  },

  async createTransaction({ userId, type, amount, category, description }) {
    if (typeof amount !== 'number' || amount <= 0) throw new Error('Transaction amount must be a positive number')
    if (!VALID_TYPES.includes(type)) throw new Error(`Invalid transaction type: ${type}`)

    const activeId = await getAuthenticatedUserId(userId)
    if (!activeId) {
      throw new Error('Please sign in with a valid account to perform transactions.')
    }

    const timestamp = new Date().toISOString()
    const payload = {
      user_id: activeId,
      type,
      amount,
      category: category || (type === 'deposit' ? 'Deposit' : 'Withdrawal'),
      description: description || '',
      transaction_date: timestamp,
      created_at: timestamp,
      updated_at: timestamp,
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert(payload)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error creating transaction:', error.message || error)
      throw new Error(error.message || 'Failed to create transaction')
    }

    return data || payload
  },

  async deleteTransaction(transactionId, userId) {
    if (!transactionId || !userId) return false
    const activeId = await getAuthenticatedUserId(userId)
    if (!activeId) return false

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', activeId)

    if (error) {
      console.error('Error deleting transaction:', error.message || error)
      throw error
    }

    return true
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
