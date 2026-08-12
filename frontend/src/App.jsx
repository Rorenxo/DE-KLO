import React, { useState, useEffect } from 'react'
import AuthPage from './components/auth/AuthPage'
import PinScreen from './components/auth/PinScreen'
import DashboardLayout from './components/dashboard/DashboardLayout'
import MobileIntroVideo from './components/common/MobileIntroVideo'
import { authService } from './services/authService'
import { profileService } from './services/profileService'

const checkShouldShowMobileIntro = () => {
  if (typeof window === 'undefined') return false
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) return false
  const alreadyPlayed = sessionStorage.getItem('deklo_intro_played')
  if (alreadyPlayed) return false
  const isMobile = window.innerWidth <= 768 || window.matchMedia('(max-width: 768px)').matches
  return isMobile
}

export default function App() {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [isPinVerified, setIsPinVerified] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showMobileIntro, setShowMobileIntro] = useState(checkShouldShowMobileIntro)

  const handleIntroComplete = () => {
    try {
      sessionStorage.setItem('deklo_intro_played', 'true')
    } catch (e) {}
    setShowMobileIntro(false)
  }

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

  const renderContent = () => {
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

  return (
    <>
      {showMobileIntro && (
        <MobileIntroVideo onComplete={handleIntroComplete} />
      )}
      {renderContent()}
    </>
  )
}

