import React, { useState, useMemo } from 'react'
import { Wallet, TrendingUp, PiggyBank, ArrowDownRight, ChevronDown } from 'lucide-react'

export default function FinancialOverview({
  theme = 'dark',
  transactions = [],
  savingsAmount = 0,
  overviewData = null,
}) {
  const [period, setPeriod] = useState('This Month')
  const [showDropdown, setShowDropdown] = useState(false)

  const isLight = theme === 'light'

  const computedMetrics = useMemo(() => {
    let inc = 0
    let exp = 0
    const now = new Date()

    transactions.forEach((tx) => {
      const txDate = new Date(tx.transaction_date || tx.created_at)
      if (isNaN(txDate.getTime())) return

      let inPeriod = true
      if (period === 'This Week') {
        const startOfWeek = new Date(now)
        const day = now.getDay()
        const diff = now.getDate() - day + (day === 0 ? -6 : 1)
        startOfWeek.setDate(diff)
        startOfWeek.setHours(0, 0, 0, 0)
        inPeriod = txDate >= startOfWeek
      } else if (period === 'This Month') {
        inPeriod = txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear()
      }

      if (inPeriod) {
        const amt = Number(tx.amount) || 0
        if (tx.type === 'deposit' || tx.type === 'income') inc += amt
        if (tx.type === 'withdrawal' || tx.type === 'expense') exp += amt
      }
    })

    const totalBalance = transactions.reduce((acc, t) => {
      const amt = Number(t.amount) || 0
      return (t.type === 'deposit' || t.type === 'income') ? acc + amt : acc - amt
    }, 0)

    return {
      balance: `₱${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      income: `₱${inc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      savings: `₱${savingsAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      expenses: `₱${exp.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    }
  }, [transactions, savingsAmount, period])

  const displayData = {
    balance: computedMetrics.balance || overviewData?.balance || '₱0.00',
    income: computedMetrics.income || overviewData?.income || '₱0.00',
    savings: computedMetrics.savings || overviewData?.savings || '₱0.00',
    expenses: computedMetrics.expenses || overviewData?.expenses || '₱0.00',
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <h3 className={`text-xs font-bold tracking-wide uppercase ${isLight ? 'text-[#343A40]' : 'text-[#F1F3F5]'
          }`}>
          Financial Overview
        </h3>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={`flex items-center gap-1.5 px-3 py-1 border rounded-xl text-xs font-medium transition-colors cursor-pointer ${isLight
                ? 'bg-[#F1F3F8] border-[#DEE2EA] text-[#343A40] hover:bg-[#ECEEF4]'
                : 'bg-[#121418] border-[#242830] text-[#F1F3F5] hover:bg-[#1E222A]'
              }`}
          >
            <span>{period}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showDropdown && (
            <div className={`absolute right-0 mt-1 w-32 border rounded-xl shadow-2xl z-30 overflow-hidden py-1 ${isLight ? 'bg-[#F1F3F8] border-[#DEE2EA] text-[#343A40]' : 'bg-[#121418] border-[#242830] text-[#F1F3F5]'
              }`}>
              {['This Week', 'This Month'].map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPeriod(p)
                    setShowDropdown(false)
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${period === p
                      ? isLight ? 'bg-[#343A40] text-[#F8F8FF] font-bold' : 'bg-[#F1F3F5] text-[#000000] font-bold'
                      : isLight ? 'text-[#68707C] hover:bg-[#ECEEF4]' : 'text-[#94A3B8] hover:bg-[#1E222A]'
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Total Balance */}
        <div className={`p-4 rounded-2xl border space-y-2 relative overflow-hidden ${isLight ? 'bg-[#F1F3F8] border-[#DEE2EA]' : 'bg-[#121418] border-[#242830]'
          }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold tracking-wide ${isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'}`}>
              Total Balance
            </span>
            <Wallet className={`w-4 h-4 ${isLight ? 'text-[#4B535E]' : 'text-[#D1D5DB]'}`} />
          </div>
          <div className={`text-lg sm:text-xl font-bold font-mono ${isLight ? 'text-[#343A40]' : 'text-[#F1F3F5]'
            }`}>
            {displayData.balance}
          </div>
        </div>

        {/* Income */}
        <div className={`p-4 rounded-2xl border space-y-2 relative overflow-hidden ${isLight ? 'bg-[#F1F3F8] border-[#DEE2EA]' : 'bg-[#121418] border-[#242830]'
          }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold tracking-wide ${isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'}`}>
              Income
            </span>
            <TrendingUp className={`w-4 h-4 ${isLight ? 'text-[#4B535E]' : 'text-[#D1D5DB]'}`} />
          </div>
          <div>
            <div className={`text-lg sm:text-xl font-bold font-mono ${isLight ? 'text-[#343A40]' : 'text-[#F1F3F5]'
              }`}>
              {displayData.income}
            </div>
          </div>
        </div>

        {/* Savings */}
        <div className={`p-4 rounded-2xl border space-y-2 relative overflow-hidden ${isLight ? 'bg-[#F1F3F8] border-[#DEE2EA]' : 'bg-[#121418] border-[#242830]'
          }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold tracking-wide ${isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'}`}>
              Savings
            </span>
            <PiggyBank className={`w-4 h-4 ${isLight ? 'text-[#4B535E]' : 'text-[#D1D5DB]'}`} />
          </div>
          <div>
            <div className={`text-lg sm:text-xl font-bold font-mono ${isLight ? 'text-[#343A40]' : 'text-[#F1F3F5]'
              }`}>
              {displayData.savings}
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div className={`p-4 rounded-2xl border space-y-2 relative overflow-hidden ${isLight ? 'bg-[#F1F3F8] border-[#DEE2EA]' : 'bg-[#121418] border-[#242830]'
          }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold tracking-wide ${isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'}`}>
              Expenses
            </span>
            <ArrowDownRight className={`w-4 h-4 ${isLight ? 'text-[#4B535E]' : 'text-[#D1D5DB]'}`} />
          </div>
          <div>
            <div className={`text-lg sm:text-xl font-bold font-mono ${isLight ? 'text-[#343A40]' : 'text-[#F1F3F5]'
              }`}>
              {displayData.expenses}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
