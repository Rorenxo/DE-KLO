import React, { useState } from 'react'
import { Wallet, TrendingUp, PiggyBank, ArrowDownRight, ChevronDown } from 'lucide-react'

export default function FinancialOverview({
  theme = 'dark',
  overviewData = {
    balance: '₱0',
    income: '₱0',
    incomeGrowth: '0%',
    savings: '₱0',
    savingsGrowth: '0%',
    expenses: '₱0',
    expensesGrowth: '0%',
  },
}) {
  const [period, setPeriod] = useState('This Month')
  const [showDropdown, setShowDropdown] = useState(false)

  const isLight = theme === 'light'

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <h3 className={`text-xs font-bold tracking-wide uppercase ${
          isLight ? 'text-slate-900' : 'text-white'
        }`}>
          Financial Overview
        </h3>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={`flex items-center gap-1.5 px-3 py-1 border rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              isLight ? 'bg-white border-slate-300 text-slate-800 hover:text-black' : 'bg-[#24292e]/80 border-[#4a5156]/50 text-[#bdc7ce]'
            }`}
          >
            <span>{period}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showDropdown && (
            <div className={`absolute right-0 mt-1 w-32 border rounded-xl shadow-2xl z-30 overflow-hidden py-1 ${
              isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300' : 'bg-[#24292e] border-[#4a5156] text-white'
            }`}>
              {['This Week', 'This Month'].map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPeriod(p)
                    setShowDropdown(false)
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                    period === p
                      ? isLight ? 'bg-slate-100 font-bold text-slate-900' : 'bg-[#bdc7ce]/15 text-[#bdc7ce] font-semibold'
                      : isLight ? 'text-slate-600 hover:text-black' : 'text-[#808a92] hover:text-white'
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
        <div className={`p-4 rounded-2xl border space-y-2 relative overflow-hidden ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#24292e]/70 border-[#4a5156]/40'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold tracking-wide ${isLight ? 'text-slate-600' : 'text-[#808a92]'}`}>
              Total Balance
            </span>
            <Wallet className={`w-4 h-4 ${isLight ? 'text-slate-800' : 'text-[#bdc7ce]'}`} />
          </div>
          <div className={`text-lg sm:text-xl font-bold font-mono ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            {overviewData.balance}
          </div>
        </div>

        {/* Income */}
        <div className={`p-4 rounded-2xl border space-y-2 relative overflow-hidden ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#24292e]/70 border-[#4a5156]/40'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold tracking-wide ${isLight ? 'text-slate-600' : 'text-[#808a92]'}`}>
              Income
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold font-mono text-emerald-500">
              {overviewData.income}
            </div>
            <span className="text-[10px] text-emerald-500/90 font-medium">
              {overviewData.incomeGrowth} vs last month
            </span>
          </div>
        </div>

        {/* Savings */}
        <div className={`p-4 rounded-2xl border space-y-2 relative overflow-hidden ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#24292e]/70 border-[#4a5156]/40'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold tracking-wide ${isLight ? 'text-slate-600' : 'text-[#808a92]'}`}>
              Savings
            </span>
            <PiggyBank className={`w-4 h-4 ${isLight ? 'text-slate-800' : 'text-[#bdc7ce]'}`} />
          </div>
          <div>
            <div className={`text-lg sm:text-xl font-bold font-mono ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              {overviewData.savings}
            </div>
            <span className={`text-[10px] font-medium ${isLight ? 'text-slate-600' : 'text-[#808a92]'}`}>
              {overviewData.savingsGrowth} vs last month
            </span>
          </div>
        </div>

        {/* Expenses */}
        <div className={`p-4 rounded-2xl border space-y-2 relative overflow-hidden ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#24292e]/70 border-[#4a5156]/40'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold tracking-wide ${isLight ? 'text-slate-600' : 'text-[#808a92]'}`}>
              Expenses
            </span>
            <ArrowDownRight className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold font-mono text-rose-500">
              {overviewData.expenses}
            </div>
            <span className="text-[10px] text-rose-500/90 font-medium">
              {overviewData.expensesGrowth} vs last month
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
