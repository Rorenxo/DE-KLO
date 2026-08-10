import React, { useState, useEffect } from 'react'
import { ArrowDownLeft, ArrowUpRight, X, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react'

export default function TransactionModal({
  isOpen,
  onClose,
  type = 'deposit',
  currentBalance = 0,
  onConfirm,
  theme = 'dark',
}) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const isLight = theme === 'light'
  const isDeposit = type === 'deposit'

  const presets = isDeposit ? [500, 1000, 5000, 10000] : [500, 1000, 2000, 5000]

  useEffect(() => {
    if (isOpen) {
      setAmount('')
      setNote('')
      setError('')
      setIsSuccess(false)
    }
  }, [isOpen, type])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0.')
      return
    }

    if (!isDeposit && numAmount > currentBalance) {
      setError(`Insufficient balance. Current balance is ₱${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`)
      return
    }

    setIsSuccess(true)
    setTimeout(() => {
      onConfirm(numAmount, note || (isDeposit ? 'Deposit' : 'Withdrawal'))
      onClose()
    }, 600)
  }

  const handlePresetClick = (val) => {
    setAmount(String(val))
    setError('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none animate-fade-in">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div
        className={`relative w-full max-w-md rounded-3xl border p-5 sm:p-6 shadow-2xl z-10 transition-all duration-200 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50'
            : 'bg-[#1a1e22] border-[#4a5156]/60 text-white shadow-black/90'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isDeposit
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {isDeposit ? (
                <ArrowDownLeft className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                {isDeposit ? 'Deposit Money' : 'Withdraw Money'}
              </h3>
              <p className="text-xs text-[#808a92]">
                {isDeposit
                  ? 'Add funds to your account balance'
                  : 'Withdraw funds from your balance'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#808a92] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-3 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 animate-bounce" />
            </div>
            <h4 className="text-lg font-bold text-white">
              {isDeposit ? 'Deposit Successful!' : 'Withdrawal Successful!'}
            </h4>
            <p className="text-xs text-[#808a92]">
              ₱{parseFloat(amount).toLocaleString()} has been {isDeposit ? 'added to' : 'deducted from'} your balance.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 pt-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#808a92]">
                Amount (₱)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-lg font-bold font-mono text-[#bdc7ce]">
                  ₱
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault()
                    }
                  }}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === '' || parseFloat(val) >= 0) {
                      setAmount(val)
                      setError('')
                    }
                  }}
                  autoFocus
                  className={`w-full py-3 pl-10 pr-4 rounded-2xl text-xl font-mono font-bold outline-none border transition-all ${
                    isLight
                      ? 'bg-slate-100 border-slate-300 text-slate-900 focus:border-slate-900'
                      : 'bg-[#000000]/70 border-[#4a5156]/60 text-white focus:border-[#bdc7ce]'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-[11px] text-[#808a92] font-medium">
                Quick Select
              </span>
              <div className="grid grid-cols-4 gap-2">
                {presets.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handlePresetClick(val)}
                    className={`py-2 px-1 rounded-xl text-xs font-mono font-semibold border transition-all cursor-pointer ${
                      amount === String(val)
                        ? isLight
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-[#bdc7ce] text-[#000000] border-[#bdc7ce]'
                        : isLight
                        ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                        : 'bg-[#000000]/40 border-[#4a5156]/50 text-[#bdc7ce] hover:text-white hover:border-white/30'
                    }`}
                  >
                    +₱{val.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#808a92]">
                Note / Category (Optional)
              </label>
              <input
                type="text"
                placeholder={isDeposit ? 'e.g. Salary, Allowance' : 'e.g. Shopping, Bills'}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={`w-full py-2.5 px-4 rounded-2xl text-xs font-medium outline-none border transition-all ${
                  isLight
                    ? 'bg-slate-100 border-slate-300 text-slate-900 focus:border-slate-900'
                    : 'bg-[#000000]/70 border-[#4a5156]/60 text-white focus:border-[#bdc7ce]'
                }`}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-[#808a92] pt-1">
              <span>Current Balance:</span>
              <span className="font-mono font-bold text-white">
                ₱{currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-2xl border border-[#4a5156]/60 text-xs font-semibold text-[#bdc7ce] hover:text-white hover:border-white/40 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs shadow-lg transition-all active:scale-[0.985] cursor-pointer ${
                  isDeposit
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20'
                    : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                }`}
              >
                {isDeposit ? 'Confirm Deposit' : 'Confirm Withdraw'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
