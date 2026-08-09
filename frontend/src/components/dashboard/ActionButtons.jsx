import React from 'react'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'

export default function ActionButtons({ onDeposit, onWithdraw, theme = 'dark' }) {
  const isLight = theme === 'light'

  return (
    <div className="flex flex-col gap-2.5 sm:gap-3 w-full max-w-[460px]">
      <button
        onClick={onDeposit}
        aria-label="Deposit money"
        className={`w-full flex items-center justify-start gap-3 py-3 px-4 border rounded-2xl transition-all duration-200 cursor-pointer group shadow-lg active:scale-[0.985] ${
          isLight
            ? 'bg-white hover:bg-slate-50 border-slate-200 shadow-slate-200/50'
            : 'bg-[#24292e]/80 hover:bg-[#24292e] border-[#4a5156]/50 shadow-black/40'
        }`}
      >
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
          isLight ? 'bg-slate-900 text-white' : 'bg-[#bdc7ce]/15 text-[#bdc7ce] group-hover:bg-[#bdc7ce] group-hover:text-[#000000]'
        }`}>
          <ArrowDownLeft className="w-4 h-4" />
        </div>
        <div className="text-left">
          <span className={`block text-xs sm:text-sm font-semibold leading-tight ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            Deposit
          </span>
          <span className="block text-[10px] sm:text-[11px] text-[#808a92] leading-tight">
            Add money to your account
          </span>
        </div>
      </button>

      <button
        onClick={onWithdraw}
        aria-label="Withdraw money"
        className={`w-full flex items-center justify-start gap-3 py-3 px-4 border rounded-2xl transition-all duration-200 cursor-pointer group shadow-lg active:scale-[0.985] ${
          isLight
            ? 'bg-white hover:bg-slate-50 border-slate-200 shadow-slate-200/50'
            : 'bg-[#24292e]/80 hover:bg-[#24292e] border-[#4a5156]/50 shadow-black/40'
        }`}
      >
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
          isLight ? 'bg-slate-200 text-slate-700' : 'bg-[#808a92]/15 text-[#808a92] group-hover:bg-[#808a92] group-hover:text-[#000000]'
        }`}>
          <ArrowUpRight className="w-4 h-4" />
        </div>
        <div className="text-left">
          <span className={`block text-xs sm:text-sm font-semibold leading-tight ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            Withdraw
          </span>
          <span className="block text-[10px] sm:text-[11px] text-[#808a92] leading-tight">
            Send money from your account
          </span>
        </div>
      </button>
    </div>
  )
}
