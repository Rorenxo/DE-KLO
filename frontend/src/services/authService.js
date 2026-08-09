import { supabase } from './supabaseClient'

function sanitizeInput(str) {
  if (typeof str !== 'string') return ''
  return str.trim().replace(/[<>]/g, '')
}

export const authService = {
  // Connects to Supabase Google OAuth provider endpoint
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

  // Connects to Supabase email/password sign-in endpoint
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

  // Connects to Supabase user registration endpoint
  async register({ nickname, email, password }) {
    const cleanNickname = sanitizeInput(nickname)
    const cleanEmail = sanitizeInput(email)

    if (!cleanEmail || !password || !cleanNickname) {
      throw new Error('Invalid registration data format')
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { nickname: cleanNickname },
      },
    })
    if (error) throw error
    return data
  },

  // Sends 6-digit OTP passcode to email for password reset
  async sendPasswordResetOtp(email) {
    const cleanEmail = sanitizeInput(email)
    const { data, error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
    })
    if (error) throw error
    return data
  },

  // Verifies 6-digit OTP passcode for password reset
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

  // Updates authenticated user password
  async updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (error) throw error
    return data
  },

  // Sends PIN reset verification request to email
  async sendPinResetEmail(email) {
    const cleanEmail = sanitizeInput(email)
    const { data, error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
    })
    if (error) throw error
    return data
  },

  // Local trusted-device PIN storage for offline PWA authentication
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

  // Connects to Supabase sign out endpoint and clears local device session
  async logout(userId) {
    this.clearDeviceState(userId)
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Fetches current persistent auth session from Supabase (works offline via local storage)
  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  // Verifies current authenticated user token with Supabase backend server
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  // Listens to Supabase auth state changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}
