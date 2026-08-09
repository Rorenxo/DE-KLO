import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function MoneyFlowChart({ theme = 'dark' }) {
  const [period, setPeriod] = useState('This Month')
  const [showDropdown, setShowDropdown] = useState(false)

  const isLight = theme === 'light'

  const bars = [
    { day: 'May 1', income: 65, expense: 30 },
    { day: 'May 5', income: 40, expense: 50 },
    { day: 'May 10', income: 80, expense: 35 },
    { day: 'May 15', income: 55, expense: 45 },
    { day: 'May 20', income: 95, expense: 40 },
    { day: 'May 25', income: 35, expense: 60 },
    { day: 'May 30', income: 75, expense: 25 },
  ]

  return (
    <div className={`w-full p-3.5 sm:p-4 rounded-2xl border space-y-16.5 shadow-lg transition-colors ${isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' : 'bg-[#24292e]/70 border-[#4a5156]/40 text-white'
      }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-xs sm:text-sm font-bold tracking-wide uppercase">
            Money Flow
          </h3>

          <div className="flex items-center gap-2.5 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Inc
            </span>
            <span className="flex items-center gap-1 text-rose-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Exp
            </span>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={`flex items-center gap-1.5 px-2.5 py-1 border rounded-xl text-[11px] transition-colors cursor-pointer ${isLight ? 'bg-slate-100 border-slate-300 text-slate-700 hover:text-black' : 'bg-[#000000]/60 border-[#4a5156]/50 text-[#bdc7ce] hover:text-white'
              }`}
          >
            <span>{period}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showDropdown && (
            <div className={`absolute right-0 mt-1 w-32 border rounded-xl shadow-2xl z-30 overflow-hidden py-1 ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#24292e] border-[#4a5156] text-white'
              }`}>
              {['This Week', 'This Month', 'Custom'].map((p) => (
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

      <div className={`h-28 sm:h-32 w-full pt-2 flex items-end justify-between gap-3 border-b pb-2 px-1 ${isLight ? 'border-slate-200' : 'border-[#4a5156]/30'
        }`}>
        {bars.map((b, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end">
            <div className="w-full flex items-end justify-center gap-1 h-full">
              <div
                className="w-2 sm:w-2.5 bg-emerald-500/85 rounded-t-sm transition-all duration-300 group-hover:bg-emerald-500"
                style={{ height: `${b.income}%` }}
                title={`Income: ₱${b.income * 350}`}
              />
              <div
                className="w-2 sm:w-2.5 bg-rose-500/85 rounded-t-sm transition-all duration-300 group-hover:bg-rose-500"
                style={{ height: `${b.expense}%` }}
                title={`Expenses: ₱${b.expense * 250}`}
              />
            </div>
            <span className="text-[9px] sm:text-[10px] text-[#808a92] font-mono">{b.day}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
