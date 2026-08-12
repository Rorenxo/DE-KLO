import React, { useState, useRef } from 'react'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { authService } from '../../services/authService'

export default function ForgotPasswordForm({ onBackToLogin }) {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const otpInputsRef = useRef([])

  const handleSendCode = async (e) => {
    e.preventDefault()
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    setError('')
    try {
      await authService.sendPasswordResetOtp(email)
      setStep(2)
      setSuccessMsg(`6-digit passcode sent to ${email}`)
    } catch (err) {
      setError(err.message || 'Failed to send passcode')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    setError('')

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('')
      setOtp(digits)
      otpInputsRef.current[5]?.focus()
    }
  }

  const handleVerifyCode = async (e) => {
    e.preventDefault()
    const fullOtp = otp.join('')
    if (fullOtp.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    setIsLoading(true)
    setError('')
    try {
      await authService.verifyPasswordResetOtp(email, fullOtp)
      setStep(3)
      setSuccessMsg('Passcode verified! Create your new password.')
    } catch (err) {
      setError(err.message || 'Invalid or expired passcode')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    setError('')
    try {
      await authService.updatePassword(newPassword)
      setSuccessMsg('Password updated successfully! Returning to login...')
      setTimeout(() => onBackToLogin(), 1200)
    } catch (err) {
      setError(err.message || 'Failed to update password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-[#808a92] hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </button>
        <span className="text-[10px] uppercase tracking-widest text-[#808a92] font-semibold">
          Step {step} of 3
        </span>
      </div>

      <div className="space-y-1 text-left">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {step === 1 && 'Forgot Password'}
          {step === 2 && 'Enter Passcode'}
          {step === 3 && 'New Password'}
        </h2>
        <p className="text-xs text-[#808a92]">
          {step === 1 && 'Enter your email to receive a 6-digit passcode.'}
          {step === 2 && `Enter the 6-digit passcode sent to ${email}`}
          {step === 3 && 'Set a new password for your De\'klo account.'}
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-[#000000]/80 border border-[#bdc7ce]/40 text-xs text-[#bdc7ce] text-center">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-2xl bg-[#000000]/80 border border-[#808a92]/40 text-xs text-[#bdc7ce] text-center">
          {successMsg}
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleSendCode} className="space-y-4 pt-1">
          <Input
            id="forgot-email"
            name="email"
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              disabled={!email || isLoading}
            >
              Send 6-Digit Passcode
            </Button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyCode} className="space-y-5 pt-2">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (otpInputsRef.current[idx] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                onPaste={handleOtpPaste}
                disabled={isLoading}
                className="w-10 h-12 sm:w-12 sm:h-14 bg-[#24292e]/60 border border-[#4a5156] focus:border-[#bdc7ce] text-white text-center text-lg sm:text-xl font-bold rounded-2xl outline-none transition-all focus:ring-1 focus:ring-[#bdc7ce]/30 select-none"
              />
            ))}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              disabled={otp.join('').length !== 6 || isLoading}
            >
              Verify Passcode
            </Button>
          </div>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={handleSendCode}
              disabled={isLoading}
              className="text-xs text-[#808a92] hover:text-[#bdc7ce] transition-colors"
            >
              Resend Passcode
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleUpdatePassword} className="space-y-4 pt-1">
          <Input
            id="reset-new-password"
            name="newPassword"
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isLoading}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-[#808a92] hover:text-[#bdc7ce]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          <Input
            id="reset-confirm-password"
            name="confirmPassword"
            label="Confirm New Password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              disabled={!newPassword || !confirmPassword || isLoading}
            >
              Update Password
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
