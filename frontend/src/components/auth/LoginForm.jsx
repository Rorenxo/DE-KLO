import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import Input from '../ui/Input'
import Button from '../ui/Button'

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path
        fill="#bdc7ce"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#808a92"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#4a5156"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#ffffff"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}

export default function LoginForm({
  onSwitchToRegister,
  onForgotPassword,
  onSubmit,
  onGoogleSignIn,
  isLoading = false,
  apiError = null,
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onSubmit) {
      onSubmit({ email, password })
    }
  }

  return (
    <div className="w-full space-y-5 sm:space-y-6 animate-fade-in">

      {apiError && (
        <div className="p-3 rounded-2xl bg-[#000000]/80 border border-[#bdc7ce]/40 text-xs text-[#bdc7ce] text-center">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          id="login-email"
          name="email"
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          disabled={isLoading}
        />

        <Input
          id="login-password"
          name="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
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

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-xs text-[#808a92] hover:text-[#bdc7ce] transition-colors font-medium focus:outline-none cursor-pointer"
          >
            Forgot Password?
          </button>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={!email || !password || isLoading}
          >
            Login
          </Button>
        </div>
      </form>

      <div className="relative flex items-center justify-center my-4">
        <div className="w-full h-[1px] bg-[#4a5156]/40"></div>
        <span className="absolute bg-[#000000] px-3 text-[10px] uppercase tracking-widest text-[#808a92]">
          or
        </span>
      </div>

      <button
        type="button"
        onClick={onGoogleSignIn}
        disabled={isLoading}
        className="w-full min-h-[46px] py-3 px-4 bg-[#24292e]/60 hover:bg-[#24292e] border border-[#4a5156] hover:border-[#808a92] text-white font-medium text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer disabled:opacity-50"
      >
        <GoogleIcon />
        <span>Continue with Google</span>
      </button>

      <div className="pt-2 text-center text-xs text-[#808a92]">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-[#bdc7ce] font-semibold hover:underline ml-1 focus:outline-none cursor-pointer"
        >
          Sign Up
        </button>
      </div>
    </div>
  )
}
