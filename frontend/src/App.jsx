import React, { useState, useEffect } from 'react'
import AuthPage from './components/auth/AuthPage'
import PinScreen from './components/auth/PinScreen'
import TestSuccessPage from './components/auth/TestSuccessPage'
import { authService } from './services/authService'
import { profileService } from './services/profileService'

export default function App() {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [isPinVerified, setIsPinVerified] = useState(false)
  const [hasDeviceAccount, setHasDeviceAccount] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const hasAcc = authService.hasDeviceAccount()
    setHasDeviceAccount(hasAcc)

    authService.getSession().then((sess) => {
      setSession(sess)
      setUser(sess?.user || null)
      if (sess?.user) {
        profileService.ensureProfile(sess.user).catch(() => {})
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    const { data: { subscription } } = authService.onAuthStateChange((_event, sess) => {
      if (sess?.user) {
        setSession(sess)
        setUser(sess.user)
        setHasDeviceAccount(true)
        profileService.ensureProfile(sess.user).catch(() => {})
      } else {
        setSession(null)
        setUser(null)
        setHasDeviceAccount(false)
        setLoading(false)
        return
      }
      setLoading(false)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    try {
      await authService.logout(user?.id)
    } catch (e) {}
    setSession(null)
    setUser(null)
    setIsPinVerified(false)
    setHasDeviceAccount(false)
  }

  if (loading) {
    return (
      <div className="h-dvh w-full bg-[#000000] flex items-center justify-center text-[#bdc7ce] text-xs uppercase tracking-widest select-none">
        Loading Space...
      </div>
    )
  }

  const activeUser = user || (hasDeviceAccount ? { id: authService.getLastUserId() || 'device_user', email: 'Device User' } : null)

  if (activeUser) {
    if (!isPinVerified) {
      return (
        <PinScreen
          user={activeUser}
          onPinVerified={() => setIsPinVerified(true)}
        />
      )
    }

    return (
      <TestSuccessPage
        user={activeUser}
        onLockApp={() => setIsPinVerified(false)}
        onLogout={handleLogout}
      />
    )
  }

  return <AuthPage />
}
