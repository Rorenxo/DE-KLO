import React, { useState } from 'react'
import {
  Wallet,
  TrendingUp,
  PiggyBank,
  ArrowDownRight,
  ChevronDown,
  Target,
  ShieldCheck,
  Laptop,
  Plane,
  Plus,
} from 'lucide-react'

export default function RightPanel({ theme = 'dark' }) {
  const [period, setPeriod] = useState('This Month')
  const [showDropdown, setShowDropdown] = useState(false)

  const isLight = theme === 'light'

  const overviewData = {
    balance: '₱63,420',
    income: '₱28,750',
    incomeGrowth: '+18.6%',
    savings: '₱12,430',
    savingsGrowth: '+12.4%',
    expenses: '₱16,320',
    expensesGrowth: '-8.7%',
  }

  const goals = [
    { id: 1, name: 'Emergency Fund', current: '₱25,000', target: '₱50,000', progress: 50, icon: ShieldCheck },
    { id: 2, name: 'New Laptop', current: '₱18,420', target: '₱45,000', progress: 41, icon: Laptop },
    { id: 3, name: 'Vacation 2025', current: '₱12,300', target: '₱30,000', progress: 41, icon: Plane },
    { id: 4, name: 'Investment Pool', current: '₱8,500', target: '₱20,000', progress: 42, icon: ShieldCheck },
  ]

  return (
    <aside className="hidden xl:flex flex-col w-100 space-y-4 select-none shrink-0">
      <div className={`p-3 rounded-2xl border space-y-3 shadow-lg transition-colors ${isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' : 'bg-[#24292e]/70 border-[#4a5156]/40 text-white'
        }`}>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold tracking-wide uppercase">
            Financial Overview
          </h3>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              aria-label="Select timeframe"
              className={`flex items-center gap-1 px-2.5 py-1 border rounded-xl text-[10px] sm:text-[11px] transition-all cursor-pointer ${isLight ? 'bg-slate-100 border-slate-300 text-slate-700 hover:text-black' : 'bg-[#000000]/60 border-[#4a5156]/50 text-[#bdc7ce] hover:text-white'
                }`}
            >
              <span>{period}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showDropdown && (
              <div className={`absolute right-0 mt-1 w-32 border rounded-xl shadow-2xl z-30 overflow-hidden py-1 ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#24292e] border-[#4a5156] text-white'
                }`}>
                {['This Week', 'This Month'].map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPeriod(p)
                      setShowDropdown(false)
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${period === p
                      ? isLight ? 'bg-slate-100 font-semibold text-slate-900' : 'bg-[#bdc7ce]/15 text-[#bdc7ce] font-semibold'
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

        <div className="grid grid-cols-2 gap-2.5">
          <div className={`p-3 rounded-xl border space-y-1 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#000000]/50 border-[#4a5156]/30'
            }`}>
            <div className="flex items-center justify-between text-[#808a92]">
              <span className="text-[10px] sm:text-[11px] font-medium tracking-wide">Total Balance</span>
              <Wallet className="w-3.5 h-3.5 text-[#bdc7ce]" />
            </div>
            <div className="text-base font-bold font-mono">
              {overviewData.balance}
            </div>
          </div>

          <div className={`p-3 rounded-xl border space-y-1 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#000000]/50 border-[#4a5156]/30'
            }`}>
            <div className="flex items-center justify-between text-[#808a92]">
              <span className="text-[10px] sm:text-[11px] font-medium tracking-wide">Income</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div>
              <div className="text-base font-bold font-mono text-emerald-500">
                {overviewData.income}
              </div>
              <span className="text-[10px] sm:text-[11px] text-emerald-500/90 font-medium">
                {overviewData.incomeGrowth}
              </span>
            </div>
          </div>

          <div className={`p-3 rounded-xl border space-y-1 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#000000]/50 border-[#4a5156]/30'
            }`}>
            <div className="flex items-center justify-between text-[#808a92]">
              <span className="text-[10px] sm:text-[11px] font-medium tracking-wide">Savings</span>
              <PiggyBank className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div>
              <div className="text-base font-bold font-mono text-blue-500">
                {overviewData.savings}
              </div>
              <span className="text-[10px] sm:text-[11px] text-blue-500/90 font-medium">
                {overviewData.savingsGrowth}
              </span>
            </div>
          </div>

          <div className={`p-3 rounded-xl border space-y-1 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#000000]/50 border-[#4a5156]/30'
            }`}>
            <div className="flex items-center justify-between text-[#808a92]">
              <span className="text-[10px] sm:text-[11px] font-medium tracking-wide">Expenses</span>
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div>
              <div className="text-base font-bold font-mono text-rose-500">
                {overviewData.expenses}
              </div>
              <span className="text-[10px] sm:text-[11px] text-rose-500/90 font-medium">
                {overviewData.expensesGrowth}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Savings Goals Panel (Gold / White Monochrome Progress Styling) */}
      <div className={`p-4 rounded-2xl border space-y-3 shadow-lg relative overflow-hidden transition-colors ${isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' : 'bg-[#24292e]/70 border-[#4a5156]/40 text-white'
        }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#bdc7ce]" />
            <h4 className="text-xs font-bold tracking-wide uppercase">
              Savings Goals
            </h4>
          </div>
          <button className="text-[10px] sm:text-[11px] text-[#808a92] hover:text-[#000000] dark:hover:text-[#bdc7ce] font-semibold transition-colors">
            View All
          </button>
        </div>

        <div className="relative">
          <div className="max-h-[140px] overflow-y-auto space-y-3.5 pr-1 scrollbar-thin scrollbar-thumb-[#4a5156]/50 scrollbar-track-transparent">
            {goals.map((g) => {
              const Icon = g.icon
              return (
                <div key={g.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-[#bdc7ce]" />
                      <span className="font-semibold">{g.name}</span>
                    </div>
                    <span className="text-[#bdc7ce] font-mono text-[11px]">{g.progress}%</span>
                  </div>

                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-[#000000]'
                    }`}>
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#d4af37] to-[#bdc7ce]"
                      style={{ width: `${g.progress}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] sm:text-[11px] text-[#808a92] font-mono">
                    <span>{g.current}</span>
                    <span>{g.target}</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className={`pointer-events-none absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t opacity-90 ${isLight ? 'from-white to-transparent' : 'from-[#24292e] to-transparent'
            }`} />
        </div>

        <button
          aria-label="Create new savings goal"
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 border rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-[0.985] ${isLight
            ? 'bg-slate-900 text-white hover:bg-slate-800 border-slate-900'
            : 'bg-[#000000]/60 hover:bg-[#000000] text-[#bdc7ce] hover:text-white border-[#4a5156]/50'
            }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create New Goal</span>
        </button>
      </div>
    </aside>
  )
}
