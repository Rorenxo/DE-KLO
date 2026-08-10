import React, { useState } from 'react'
import AuthHeader from './AuthHeader'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import ForgotPasswordForm from './ForgotPasswordForm'
import { authService } from '../../services/authService'
import globeImg from '../../assets/globe.png'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const handleLoginSubmit = async (credentials) => {
    setIsLoading(true)
    setApiError(null)
    setSuccessMessage(null)
    try {
      await authService.login(credentials)
    } catch (err) {
      setApiError(err.message || 'Authentication error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegisterSubmit = async (data) => {
    setIsLoading(true)
    setApiError(null)
    setSuccessMessage(null)
    try {
      const result = await authService.register(data)
      if (result?.user && !result?.session) {
        setSuccessMessage('Account created successfully! Please check your email to confirm your account.')
      } else {
        setSuccessMessage('Account created successfully! You can now log in.')
      }
    } catch (err) {
      setApiError(err.message || 'Registration error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setApiError(null)
    setSuccessMessage(null)
    try {
      await authService.signInWithGoogle()
    } catch (err) {
      setApiError(err.message || 'Google Sign In error')
      setIsLoading(false)
    }
  }

  const handleSwitchMode = (targetMode) => {
    setApiError(null)
    setSuccessMessage(null)
    setMode(targetMode)
  }

  return (
    <div className={`relative w-full flex items-center justify-center p-4 sm:p-6 select-none ${mode === 'register' ? 'min-h-screen overflow-y-auto py-10' : 'h-screen overflow-hidden'}`}>
      <div className="fixed inset-0 z-0 bg-layer-image pointer-events-none" />
      <div className="fixed inset-0 z-[1] bg-layer-overlay pointer-events-none" />

      <div className="fixed inset-0 z-[2] flex items-center justify-center pointer-events-none overflow-hidden">
        <img
          src={globeImg}
          alt="De'klo Earth Visual"
          className="w-[420px] h-[420px] sm:w-[540px] sm:h-[540px] md:w-[680px] md:h-[680px] earth-globe-visual object-contain"
        />
      </div>

      <div className="relative z-10 w-full max-w-[360px] sm:max-w-[390px] mx-auto my-auto flex flex-col items-center justify-center text-center space-y-4 sm:space-y-5">
        <AuthHeader />

        <div className="w-full flex flex-col justify-center">
          {mode === 'login' && (
            <LoginForm
              onSwitchToRegister={() => handleSwitchMode('register')}
              onForgotPassword={() => handleSwitchMode('forgot_password')}
              onSubmit={handleLoginSubmit}
              onGoogleSignIn={handleGoogleSignIn}
              isLoading={isLoading}
              apiError={apiError}
            />
          )}

          {mode === 'register' && (
            <RegisterForm
              onSwitchToLogin={() => handleSwitchMode('login')}
              onSubmit={handleRegisterSubmit}
              isLoading={isLoading}
              apiError={apiError}
              successMessage={successMessage}
            />
          )}

          {mode === 'forgot_password' && (
            <ForgotPasswordForm
              onBackToLogin={() => handleSwitchMode('login')}
            />
          )}
        </div>

        <div className="pt-2 flex items-center justify-center gap-2 text-[10px] text-[#808a92] tracking-widest uppercase font-medium">
          <span>Lorenxo & Kaye © 2026</span>
        </div>
      </div>
    </div>
  )
}
