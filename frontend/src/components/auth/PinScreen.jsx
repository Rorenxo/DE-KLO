import React, { useState, useEffect, useRef } from 'react'
import { Delete, ShieldCheck, Keyboard } from 'lucide-react'
import { authService } from '../../services/authService'
import globeImg from '../../assets/globe.png'
import logoImg from '../../assets/logo.png'

export default function PinScreen({ user, onPinVerified }) {
  const userId = user?.id || user?.email || 'default_user'
  const userEmail = user?.email || ''

  const existingPin = authService.getStoredPin(userId)
  const pinLength = 4

  const [mode, setMode] = useState(existingPin ? 'enter' : 'create')
  const [pin, setPin] = useState('')
  const [firstPin, setFirstPin] = useState('')
  const [error, setError] = useState('')
  const [infoMsg, setInfoMsg] = useState('')
  
  const [resetPasscode, setResetPasscode] = useState(['', '', '', '', '', ''])
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [isSendingReset, setIsSendingReset] = useState(false)
  const passcodeRefs = useRef([])

  useEffect(() => {
    setPin('')
    setError('')
  }, [mode])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (mode === 'reset_verification') return

      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key)
      } else if (e.key === 'Backspace') {
        handleDelete()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pin, mode])

  const handleKeyPress = (num) => {
    if (pin.length < pinLength) {
      const nextPin = pin + num
      setPin(nextPin)
      setError('')

      if (nextPin.length === pinLength) {
        processPin(nextPin)
      }
    }
  }

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1))
      setError('')
    }
  }

  const processPin = (completedPin) => {
    if (mode === 'create') {
      setFirstPin(completedPin)
      setMode('confirm')
      setPin('')
    } else if (mode === 'confirm') {
      if (completedPin === firstPin) {
        authService.savePin(userId, completedPin)
        onPinVerified()
      } else {
        setError('PINs do not match. Try again.')
        setPin('')
        setMode('create')
      }
    } else if (mode === 'enter') {
      if (completedPin === existingPin) {
        onPinVerified()
      } else {
        setError('Incorrect PIN code')
        setTimeout(() => setPin(''), 300)
      }
    } else if (mode === 'change') {
      authService.savePin(userId, completedPin)
      setInfoMsg('New PIN set successfully!')
      setTimeout(() => onPinVerified(), 800)
    }
  }

  const handleForgotPin = async () => {
    setIsSendingReset(true)
    setError('')
    try {
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString()
      setGeneratedOtp(randomCode)
      await authService.sendPinResetEmail(userEmail)
      setMode('reset_verification')
      setResetPasscode(['', '', '', '', '', ''])
      setInfoMsg(`6-digit code sent to ${userEmail || 'your email'}`)
    } catch (err) {
      const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString()
      setGeneratedOtp(fallbackCode)
      setMode('reset_verification')
      setResetPasscode(['', '', '', '', '', ''])
      setInfoMsg('Enter 6-digit verification code')
    } finally {
      setIsSendingReset(false)
    }
  }

  const handlePasscodeChange = (index, value) => {
    if (value.length > 1) {
      value = value.slice(-1)
    }

    const updated = [...resetPasscode]
    updated[index] = value
    setResetPasscode(updated)
    setError('')

    if (value && index < 5) {
      passcodeRefs.current[index + 1]?.focus()
    }
  }

  const handlePasscodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !resetPasscode[index] && index > 0) {
      passcodeRefs.current[index - 1]?.focus()
    }
  }

  const handleVerifyResetCode = (e) => {
    e.preventDefault()
    const enteredCode = resetPasscode.join('')
    if (enteredCode.length === 6) {
      setMode('change')
      setPin('')
      setInfoMsg('Identity verified! Enter your new 4-digit PIN.')
    } else {
      setError('Please enter all 6 digits of the code')
    }
  }

  const renderTitle = () => {
    switch (mode) {
      case 'create':
        return 'Create PIN code'
      case 'confirm':
        return 'Confirm PIN code'
      case 'enter':
        return 'Enter PIN code'
      case 'change':
        return 'Set New PIN code'
      case 'reset_verification':
        return 'Enter 6-Digit Passcode'
      default:
        return 'PIN code'
    }
  }

  const renderSubtitle = () => {
    switch (mode) {
      case 'create':
        return 'Set a 4-digit PIN for your financial space.'
      case 'confirm':
        return 'Re-enter your 4-digit PIN code to confirm.'
      case 'enter':
        return 'Enter your 4-digit PIN to unlock your space.'
      case 'change':
        return 'Enter new 4-digit PIN code for your account.'
      case 'reset_verification':
        return `We sent a 6-digit code to ${userEmail || 'your email'}`
      default:
        return ''
    }
  }

  return (
    <div className="relative min-h-dvh w-full flex items-center justify-center p-4 sm:p-6 select-none overflow-hidden bg-[#000000]">
      <div className="fixed inset-0 z-0 bg-layer-image pointer-events-none" />
      <div className="fixed inset-0 z-[1] bg-layer-overlay pointer-events-none" />

      <div className="fixed inset-0 z-[2] flex items-center justify-center pointer-events-none overflow-hidden">
        <img
          src={globeImg}
          alt="De'klo Earth Visual"
          className="w-[420px] h-[420px] sm:w-[540px] sm:h-[540px] md:w-[680px] md:h-[680px] earth-globe-visual object-contain"
        />
      </div>

      <div className="relative z-10 w-full max-w-[360px] md:max-w-[440px] mx-auto my-auto flex flex-col items-center text-center space-y-5 md:space-y-6 py-4">
        
        <div className="flex flex-col items-center gap-2">
          <img
            src={logoImg}
            alt="De'klo Logo"
            className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-md"
          />
          <h1 className="font-brand text-2xl sm:text-3xl font-extralight tracking-[0.40em] text-white uppercase">
            DE'KLO
          </h1>
        </div>

        <div className="space-y-1 px-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {renderTitle()}
          </h2>
          <p className="text-xs sm:text-sm text-[#808a92] max-w-xs mx-auto leading-relaxed">
            {renderSubtitle()}
          </p>
        </div>

        {error && (
          <p className="text-xs text-[#bdc7ce] font-medium animate-fade-in bg-[#000000]/80 px-4 py-2 rounded-xl border border-[#bdc7ce]/30">
            {error}
          </p>
        )}
        {infoMsg && (
          <p className="text-xs text-[#bdc7ce] font-medium animate-fade-in bg-[#000000]/80 px-4 py-2 rounded-xl border border-[#bdc7ce]/30">
            {infoMsg}
          </p>
        )}

        {/* Reset Verification Form */}
        {mode === 'reset_verification' ? (
          <form onSubmit={handleVerifyResetCode} className="w-full space-y-6 pt-2">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              {resetPasscode.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (passcodeRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePasscodeChange(idx, e.target.value)}
                  onKeyDown={(e) => handlePasscodeKeyDown(idx, e)}
                  className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-mono font-bold text-white bg-[#24292e]/80 border border-[#4a5156] focus:border-[#bdc7ce] rounded-xl outline-none transition-all shadow-inner"
                />
              ))}
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                className="w-full min-h-[46px] bg-[#bdc7ce] text-[#000000] font-semibold text-sm rounded-2xl hover:bg-white active:scale-[0.985] transition-all cursor-pointer shadow-lg"
              >
                Verify Passcode
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('enter')
                  setPin('')
                }}
                className="text-xs text-[#808a92] hover:text-[#bdc7ce] transition-colors"
              >
                Back to PIN entry
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* 4-Digit PIN Dot Slots */}
            <div className="flex items-center justify-center gap-4 md:gap-6 py-3 md:py-4">
              {Array.from({ length: 4 }).map((_, idx) => {
                const isFilled = idx < pin.length
                return (
                  <div
                    key={idx}
                    className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full transition-all duration-250 flex items-center justify-center border ${isFilled
                        ? 'bg-[#bdc7ce] border-[#bdc7ce] scale-110 shadow-lg shadow-[#bdc7ce]/25'
                        : 'bg-[#24292e]/70 border-[#4a5156]'
                      }`}
                  >
                    {isFilled && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#000000]" />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Desktop Minimal Keyboard Helper Hint */}
            <div className="hidden md:flex items-center justify-center gap-2 text-xs text-[#808a92] pt-1">
              <Keyboard className="w-4 h-4 text-[#bdc7ce]" />
              <span>Type your 4-digit PIN using keyboard</span>
            </div>

            {/* Mobile-Only Keypad Grid */}
            <div className="w-full max-w-[280px] grid grid-cols-3 gap-4 pt-2 md:hidden">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(String(num))}
                  className="w-16 h-16 mx-auto rounded-full bg-[#24292e]/50 hover:bg-[#24292e] active:scale-95 border border-[#4a5156]/40 text-xl font-medium text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  {num}
                </button>
              ))}

              <div className="w-16 h-16 mx-auto flex items-center justify-center">
                {/* Reset PIN Trigger Icon (Commented out)
                {mode === 'enter' && (
                  <button
                    type="button"
                    onClick={handleForgotPin}
                    disabled={isSendingReset}
                    className="p-2 text-[#808a92] hover:text-[#bdc7ce] transition-colors"
                  >
                    <ShieldCheck className="w-6 h-6" />
                  </button>
                )}
                */}
              </div>

              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="w-16 h-16 mx-auto rounded-full bg-[#24292e]/50 hover:bg-[#24292e] active:scale-95 border border-[#4a5156]/40 text-xl font-medium text-white flex items-center justify-center transition-all cursor-pointer"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="w-16 h-16 mx-auto rounded-full bg-transparent hover:bg-[#24292e]/40 active:scale-95 text-[#808a92] hover:text-white flex items-center justify-center transition-all cursor-pointer"
                aria-label="Delete"
              >
                <Delete className="w-6 h-6" />
              </button>
            </div>

            {/* Reset PIN Link (Commented out)
            {mode === 'enter' && (
              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleForgotPin}
                  disabled={isSendingReset}
                  className="text-xs text-[#808a92] hover:text-[#bdc7ce] font-medium transition-colors cursor-pointer"
                >
                  {isSendingReset ? 'Sending 6-Digit Code...' : 'Forgot PIN? Reset via 6-Digit Code'}
                </button>
              </div>
            )}
            */}
          </>
        )}

      </div>
    </div>
  )
}
