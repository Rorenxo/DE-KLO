import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowDownLeft, ArrowUpRight, X, CheckCircle2, AlertCircle } from 'lucide-react'

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
  const [isSaving, setIsSaving] = useState(false)

  const isLight = theme === 'light'
  const isDeposit = type === 'deposit'

  const presets = isDeposit ? [500, 1000, 5000, 10000] : [500, 1000, 2000, 5000]

  if (!isOpen) return null

  const handleSubmit = async (e) => {
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

    setIsSaving(true)
    try {
      const saveResult = await onConfirm(numAmount, note || (isDeposit ? 'Deposit' : 'Withdrawal'))
      setIsSuccess(saveResult || 'online')
      setTimeout(() => onClose(), 3000)
    } catch (err) {
      console.error('Transaction save failed:', err)
      setError(err?.message || 'Unable to save this transaction locally. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePresetClick = (val) => {
    setAmount(String(val))
    setError('')
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 select-none animate-fade-in">
      <div
        className={`fixed inset-0 backdrop-blur-sm transition-opacity ${
          isLight ? 'bg-black/40' : 'bg-black/80'
        }`}
        onClick={onClose}
      />

      <div
        className={`relative w-full max-w-md rounded-3xl border p-5 sm:p-6 shadow-2xl z-10 transition-all duration-200 ${isLight
            ? 'bg-[#F1F3F8] border-[#DEE2EA] text-[#343A40]'
            : 'bg-[#121418] border-[#242830] text-[#F1F3F5]'
          }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isLight ? 'bg-[#F4F5FA] border border-[#DEE2EA] text-[#4B535E]' : 'bg-[#181b20] border border-[#242830] text-[#D1D5DB]'
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
              <p className={`text-xs ${isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'}`}>
                {isDeposit
                  ? 'Add funds to your account balance'
                  : 'Withdraw funds from your balance'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${isLight ? 'text-[#68707C] hover:text-[#343A40] hover:bg-[#ECEEF4]' : 'text-[#94A3B8] hover:text-white hover:bg-[#1E222A]'
              }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-3 animate-fade-in">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isLight ? 'bg-[#F4F5FA] border border-[#DEE2EA] text-[#343A40]' : 'bg-[#181b20] border border-[#242830] text-[#F1F3F5]'
              }`}>
              <CheckCircle2 className="w-8 h-8 animate-bounce" />
            </div>
            <h4 className={`text-lg font-bold ${isLight ? 'text-[#343A40]' : 'text-[#F1F3F5]'}`}>
              {isDeposit ? 'Deposit Confirmed!' : 'Withdrawal Confirmed!'}
            </h4>
            <p className={`text-xs ${isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'}`}>
              ₱{parseFloat(amount).toLocaleString()} has been {isDeposit ? 'added to' : 'deducted from'} your balance.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 pt-4">
            {error && (
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${isLight ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                }`}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className={`block text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'}`}>
                Amount (₱)
              </label>
              <div className="relative flex items-center">
                <span className={`absolute left-4 text-lg font-bold font-mono ${isLight ? 'text-[#4B535E]' : 'text-[#D1D5DB]'}`}>
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
                  className={`w-full py-3 pl-10 pr-4 rounded-2xl text-xl font-mono font-bold outline-none border transition-all ${isLight
                      ? 'bg-[#F4F5FA] border-[#DEE2EA] text-[#343A40] focus:border-[#343A40]'
                      : 'bg-[#181b20] border-[#242830] text-[#F1F3F5] focus:border-[#F1F3F5]'
                    }`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className={`block text-[11px] font-medium ${isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'}`}>
                Quick Select
              </span>
              <div className="grid grid-cols-4 gap-2">
                {presets.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handlePresetClick(val)}
                    className={`py-2 px-1 rounded-xl text-xs font-mono font-semibold border transition-all cursor-pointer ${amount === String(val)
                        ? isLight
                          ? 'bg-[#343A40] text-[#F8F8FF] border-[#343A40]'
                          : 'bg-[#F1F3F5] text-[#000000] border-[#F1F3F5]'
                        : isLight
                          ? 'bg-[#F4F5FA] border-[#DEE2EA] text-[#4B535E] hover:bg-[#ECEEF4]'
                          : 'bg-[#181b20] border-[#242830] text-[#D1D5DB] hover:bg-[#1E222A]'
                      }`}
                  >
                    +₱{val.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className={`block text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'}`}>
                Note / Category (Optional)
              </label>
              <input
                type="text"
                placeholder={isDeposit ? 'e.g. Salary, Allowance' : 'e.g. Shopping, Bills'}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={`w-full py-2.5 px-4 rounded-2xl text-xs font-medium outline-none border transition-all ${isLight
                    ? 'bg-[#F4F5FA] border-[#DEE2EA] text-[#343A40] focus:border-[#343A40]'
                    : 'bg-[#181b20] border-[#242830] text-[#F1F3F5] focus:border-[#F1F3F5]'
                  }`}
              />
            </div>

            <div className={`flex items-center justify-between text-xs pt-1 ${isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'}`}>
              <span>Current Balance:</span>
              <span className={`font-mono font-bold ${isLight ? 'text-[#343A40]' : 'text-[#F1F3F5]'}`}>
                ₱{currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 py-3 px-4 rounded-2xl border text-xs font-semibold transition-colors cursor-pointer ${isLight
                    ? 'border-[#DEE2EA] text-[#68707C] hover:text-[#343A40] hover:bg-[#ECEEF4]'
                    : 'border-[#242830] text-[#94A3B8] hover:text-white hover:bg-[#1E222A]'
                  }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs shadow-md transition-all active:scale-[0.985] cursor-pointer ${isLight
                    ? 'bg-[#343A40] hover:bg-[#212529] text-[#F8F8FF]'
                    : 'bg-[#F1F3F5] hover:bg-white text-[#000000]'
                  }`}
              >
                {isSaving ? 'Saving...' : isDeposit ? 'Confirm Deposit' : 'Confirm Withdraw'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  )
}
