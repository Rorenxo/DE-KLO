import { supabase } from './supabaseClient'

function sanitizeInput(str) {
  if (typeof str !== 'string') return ''
  return str.trim().replace(/[<>]/g, '')
}

export function generateCardNumber() {
  const block1 = Math.floor(1000 + Math.random() * 9000)
  const block2 = Math.floor(1000 + Math.random() * 9000)
  const block3 = Math.floor(1000 + Math.random() * 9000)
  return `DK-${block1}-${block2}-${block3}`
}

export function getCtdDate() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = String(now.getFullYear()).slice(-2)
  return `${month}/${year}`
}

export const authService = {
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
    if (error) throw error
    return data
  },

  async login({ email, password }) {
    const cleanEmail = sanitizeInput(email)
    if (!cleanEmail || !password) {
      throw new Error('Invalid credentials format')
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })
    if (error) throw error
    return data
  },

  async register({ nickname, email, password }) {
    const cleanNickname = sanitizeInput(nickname)
    const cleanEmail = sanitizeInput(email)

    if (!cleanEmail || !password || !cleanNickname) {
      throw new Error('Invalid registration data format')
    }

    const cardNumber = generateCardNumber()
    const ctdDate = getCtdDate()

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          nickname: cleanNickname,
          card_number: cardNumber,
          ctd_date: ctdDate,
          balance: 0,
          income: 0,
          expenses: 0,
          savings: 0,
        },
      },
    })
    if (error) throw error

    if (data?.user?.id) {
      try {
        localStorage.setItem(`deklo_card_${data.user.id}`, cardNumber)
        localStorage.setItem(`deklo_ctd_${data.user.id}`, ctdDate)
      } catch (e) {}
    }

    return data
  },

  getUserCardInfo(user) {
    if (!user) {
      return {
        cardNumber: 'DK-0000-0000-0000',
        cardMasked: '•••• •••• •••• 0000',
        ctdDate: '01/26',
      }
    }

    const userId = user.id || user.email || 'guest'
    let cardNumber = user?.user_metadata?.card_number
    let ctdDate = user?.user_metadata?.ctd_date

    if (!cardNumber) {
      try {
        cardNumber = localStorage.getItem(`deklo_card_${userId}`)
      } catch (e) {}
    }

    if (!ctdDate) {
      try {
        ctdDate = localStorage.getItem(`deklo_ctd_${userId}`)
      } catch (e) {}
    }

    if (!cardNumber) {
      cardNumber = generateCardNumber()
      ctdDate = getCtdDate()

      try {
        localStorage.setItem(`deklo_card_${userId}`, cardNumber)
        localStorage.setItem(`deklo_ctd_${userId}`, ctdDate)
        supabase.auth.updateUser({
          data: { card_number: cardNumber, ctd_date: ctdDate }
        }).catch(() => {})
      } catch (e) {}
    }

    const last4 = cardNumber.slice(-4)
    const cardMasked = `•••• •••• •••• ${last4}`

    return {
      cardNumber,
      cardMasked,
      ctdDate: ctdDate || getCtdDate(),
    }
  },

  async updateUserData(userId, userData) {
    if (!userId) return

    try {
      localStorage.setItem(`deklo_user_data_${userId}`, JSON.stringify(userData))
    } catch (e) {}

    try {
      await supabase.auth.updateUser({
        data: userData,
      })
    } catch (err) {
      console.warn('Supabase user data sync fallback:', err)
    }
  },

  getUserSavedData(userId) {
    if (!userId) return null
    try {
      const saved = localStorage.getItem(`deklo_user_data_${userId}`)
      return saved ? JSON.parse(saved) : null
    } catch (e) {
      return null
    }
  },

  async sendPasswordResetOtp(email) {
    const cleanEmail = sanitizeInput(email)
    const { data, error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
    })
    if (error) throw error
    return data
  },

  async verifyPasswordResetOtp(email, token) {
    const cleanEmail = sanitizeInput(email)
    const cleanToken = sanitizeInput(token)
    const { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'email',
    })
    if (error) throw error
    return data
  },

  async updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (error) throw error
    return data
  },

  async sendPinResetEmail(email) {
    const cleanEmail = sanitizeInput(email)
    const { data, error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
    })
    if (error) throw error
    return data
  },

  getStoredPin(userId) {
    if (!userId) return null
    try {
      return localStorage.getItem(`deklo_pin_${userId}`) || localStorage.getItem('deklo_device_pin') || null
    } catch (e) {
      return null
    }
  },

  savePin(userId, pin) {
    if (!userId) return
    try {
      localStorage.setItem(`deklo_pin_${userId}`, pin)
      localStorage.setItem('deklo_device_pin', pin)
      localStorage.setItem(`deklo_device_setup_${userId}`, 'true')
      localStorage.setItem('deklo_last_user_id', userId)
    } catch (e) {}
  },

  isDeviceConfigured(userId) {
    if (!userId) return false
    try {
      const hasPin = Boolean(this.getStoredPin(userId))
      const hasSetup = localStorage.getItem(`deklo_device_setup_${userId}`) === 'true'
      return hasPin || hasSetup
    } catch (e) {
      return false
    }
  },

  hasDeviceAccount() {
    try {
      const lastUserId = this.getLastUserId()
      return Boolean(lastUserId && (this.isDeviceConfigured(lastUserId) || localStorage.getItem('deklo_device_pin')))
    } catch (e) {
      return false
    }
  },

  getLastUserId() {
    try {
      return localStorage.getItem('deklo_last_user_id') || 'active_user'
    } catch (e) {
      return 'active_user'
    }
  },

  clearDeviceState(userId) {
    try {
      if (userId) {
        localStorage.removeItem(`deklo_pin_${userId}`)
        localStorage.removeItem(`deklo_device_setup_${userId}`)
      }
      localStorage.removeItem('deklo_device_pin')
      localStorage.removeItem('deklo_last_user_id')
    } catch (e) {}
  },

  async logout(userId) {
    this.clearDeviceState(userId)
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}
