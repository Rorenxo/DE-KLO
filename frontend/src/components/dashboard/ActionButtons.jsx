import React from 'react'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'

export default function ActionButtons({ onDeposit, onWithdraw, theme = 'dark' }) {
  const isLight = theme === 'light'

  return (
    <div className="grid grid-cols-2 lg:grid-cols-1 lg:flex lg:flex-col items-stretch gap-2.5 sm:gap-3 lg:gap-4 w-full h-full">
      <button
        onClick={onDeposit}
        aria-label="Deposit money"
        className={`w-full h-full flex flex-col sm:flex-row items-center justify-center lg:justify-start text-center sm:text-left lg:text-left gap-2 sm:gap-3.5 py-3 px-3 sm:px-5 md:py-5 md:px-8 border rounded-2xl transition-all duration-200 cursor-pointer group shadow-lg active:scale-[0.985] min-h-[60px] md:min-h-[72px] ${isLight
            ? 'bg-white hover:bg-slate-50 border-slate-200 shadow-slate-200/50'
            : 'bg-[#24292e]/80 hover:bg-[#24292e] border-[#4a5156]/50 shadow-black/40'
          }`}
      >
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-colors shrink-0 ${isLight ? 'bg-slate-900 text-white' : 'bg-[#bdc7ce]/15 text-[#bdc7ce] group-hover:bg-[#bdc7ce] group-hover:text-[#000000]'
          }`}>
          <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="flex flex-col items-center sm:items-start lg:items-start min-w-0">
          <span className={`block text-xs sm:text-sm lg:text-base font-bold leading-tight ${isLight ? 'text-slate-900' : 'text-white'
            }`}>
            Deposit
          </span>
          <span className="block text-[10px] sm:text-[11px] text-[#808a92] leading-tight mt-0.5 whitespace-nowrap">
            Add money
          </span>
        </div>
      </button>

      <button
        onClick={onWithdraw}
        aria-label="Withdraw money"
        className={`w-full h-full flex flex-col sm:flex-row items-center justify-center lg:justify-start text-center sm:text-left lg:text-left gap-2 sm:gap-3.5 py-3 px-3 sm:px-5 md:py-4 md:px-6 border rounded-2xl transition-all duration-200 cursor-pointer group shadow-lg active:scale-[0.985] min-h-[60px] md:min-h-[72px] ${isLight
            ? 'bg-white hover:bg-slate-50 border-slate-200 shadow-slate-200/50'
            : 'bg-[#24292e]/80 hover:bg-[#24292e] border-[#4a5156]/50 shadow-black/40'
          }`}
      >
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-colors shrink-0 ${isLight ? 'bg-slate-200 text-slate-700' : 'bg-[#808a92]/15 text-[#808a92] group-hover:bg-[#808a92] group-hover:text-[#000000]'
          }`}>
          <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="flex flex-col items-center sm:items-start lg:items-start min-w-0">
          <span className={`block text-xs sm:text-sm lg:text-base font-bold leading-tight ${isLight ? 'text-slate-900' : 'text-white'
            }`}>
            Withdraw
          </span>
          <span className="block text-[10px] sm:text-[11px] text-[#808a92] leading-tight mt-0.5 whitespace-nowrap">
            Send money
          </span>
        </div>
      </button>
    </div>
  )
}
