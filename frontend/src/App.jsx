import React, { useState, useEffect } from 'react'
import AuthPage from './components/auth/AuthPage'
import PinScreen from './components/auth/PinScreen'
import DashboardLayout from './components/dashboard/DashboardLayout'
import { authService } from './services/authService'
import { profileService } from './services/profileService'

export default function App() {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [isPinVerified, setIsPinVerified] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
      setSession(sess)
      setUser(sess?.user || null)
      if (sess?.user) {
        profileService.ensureProfile(sess.user).catch(() => {})
      } else {
        setIsPinVerified(false)
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
  }

  if (loading) {
    return (
      <div className="h-dvh w-full bg-[#000000] flex items-center justify-center text-[#bdc7ce] text-xs uppercase tracking-widest select-none">
        Loading Space...
      </div>
    )
  }

  if (user) {
    if (!isPinVerified) {
      return (
        <PinScreen
          user={user}
          onPinVerified={() => setIsPinVerified(true)}
        />
      )
    }

    return (
      <DashboardLayout
        user={user}
        onLockApp={() => setIsPinVerified(false)}
        onLogout={handleLogout}
      />
    )
  }

  return <AuthPage />
}
