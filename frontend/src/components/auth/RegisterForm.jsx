import React, { useState } from 'react'
import { Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import Input from '../ui/Input'
import Button from '../ui/Button'

export default function RegisterForm({
  onSwitchToLogin,
  onSubmit,
  isLoading = false,
  apiError = null,
  successMessage = null,
}) {
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState(null)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setLocalError(null)

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters')
      return
    }

    if (onSubmit) {
      onSubmit({ nickname, email, password, confirmPassword })
    }
  }

  const activeError = localError || apiError

  return (
    <div className="w-full space-y-4 sm:space-y-5 animate-fade-in">
      <div className="space-y-1 text-center pt-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Create Account
        </h2>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-[#000000]/90 border border-white/40 text-xs sm:text-sm text-white text-center flex items-center justify-center gap-2.5 shadow-xl backdrop-blur-md animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <span className="font-medium tracking-wide">{successMessage}</span>
        </div>
      )}

      {activeError && !successMessage && (
        <div className="p-3.5 rounded-2xl bg-[#000000]/90 border border-[#bdc7ce]/40 text-xs sm:text-sm text-[#bdc7ce] text-center flex items-center justify-center gap-2.5 shadow-xl backdrop-blur-md animate-fade-in">
          <AlertCircle className="w-5 h-5 text-[#bdc7ce] shrink-0" />
          <span className="font-medium tracking-wide">{activeError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
        <Input
          id="reg-nickname"
          name="nickname"
          label="Nickname"
          type="text"
          value={nickname}
          onChange={(e) => {
            setNickname(e.target.value)
            if (localError) setLocalError(null)
          }}
          disabled={isLoading}
        />

        <Input
          id="reg-email"
          name="email"
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (localError) setLocalError(null)
          }}
          autoComplete="email"
          disabled={isLoading}
        />

        <Input
          id="reg-password"
          name="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            if (localError) setLocalError(null)
          }}
          autoComplete="new-password"
          disabled={isLoading}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 focus:outline-none text-[#808a92] hover:text-[#bdc7ce] transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          }
        />

        <Input
          id="reg-confirm-password"
          name="confirmPassword"
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value)
            if (localError) setLocalError(null)
          }}
          autoComplete="new-password"
          disabled={isLoading}
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="p-1 focus:outline-none text-[#808a92] hover:text-[#bdc7ce] transition-colors"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          }
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={!nickname || !email || !password || !confirmPassword || isLoading}
          >
            Sign Up
          </Button>
        </div>
      </form>

      <div className="pt-1 text-center text-xs text-[#808a92]">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-[#bdc7ce] font-semibold hover:underline ml-1 focus:outline-none cursor-pointer"
        >
          Login
        </button>
      </div>
    </div>
  )
}
