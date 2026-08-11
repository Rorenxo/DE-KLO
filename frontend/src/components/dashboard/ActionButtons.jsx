import React from 'react'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'

export default function ActionButtons({ onDeposit, onWithdraw, theme = 'dark' }) {
  const isLight = theme === 'light'

  return (
    <div className="grid grid-cols-2 lg:grid-cols-1 lg:flex lg:flex-col items-stretch gap-2.5 sm:gap-3 lg:gap-4 w-full h-full">
      <button
        onClick={onDeposit}
        aria-label="Deposit money"
        className={`w-full h-full flex flex-col sm:flex-row items-center justify-center lg:justify-start text-center sm:text-left lg:text-left gap-2 sm:gap-3.5 py-3 px-3 sm:px-5 md:py-5 md:px-8 border rounded-2xl transition-all duration-200 cursor-pointer group shadow-sm active:scale-[0.985] min-h-[60px] md:min-h-[72px] ${
          isLight
            ? 'bg-[#F1F3F8] hover:bg-[#ECEEF4] border-[#DEE2EA]'
            : 'bg-[#121418] hover:bg-[#1E222A] border-[#242830]'
        }`}
      >
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
          isLight ? 'bg-[#343A40] text-[#F8F8FF]' : 'bg-[#F1F3F5] text-[#000000]'
        }`}>
          <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="flex flex-col items-center sm:items-start lg:items-start min-w-0">
          <span className={`block text-xs sm:text-sm lg:text-base font-bold leading-tight ${
            isLight ? 'text-[#343A40]' : 'text-[#F1F3F5]'
          }`}>
            Deposit
          </span>
          <span className={`block text-[10px] sm:text-[11px] leading-tight mt-0.5 whitespace-nowrap ${
            isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'
          }`}>
            Add to savings
          </span>
        </div>
      </button>

      <button
        onClick={onWithdraw}
        aria-label="Withdraw money"
        className={`w-full h-full flex flex-col sm:flex-row items-center justify-center lg:justify-start text-center sm:text-left lg:text-left gap-2 sm:gap-3.5 py-3 px-3 sm:px-5 md:py-4 md:px-6 border rounded-2xl transition-all duration-200 cursor-pointer group shadow-sm active:scale-[0.985] min-h-[60px] md:min-h-[72px] ${
          isLight
            ? 'bg-[#F1F3F8] hover:bg-[#ECEEF4] border-[#DEE2EA]'
            : 'bg-[#121418] hover:bg-[#1E222A] border-[#242830]'
        }`}
      >
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
          isLight ? 'bg-[#F4F5FA] border border-[#DEE2EA] text-[#4B535E]' : 'bg-[#181b20] border border-[#242830] text-[#D1D5DB]'
        }`}>
          <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="flex flex-col items-center sm:items-start lg:items-start min-w-0">
          <span className={`block text-xs sm:text-sm lg:text-base font-bold leading-tight ${
            isLight ? 'text-[#343A40]' : 'text-[#F1F3F5]'
          }`}>
            Withdraw
          </span>
          <span className={`block text-[10px] sm:text-[11px] leading-tight mt-0.5 whitespace-nowrap ${
            isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'
          }`}>
            Take from savings
          </span>
        </div>
      </button>
    </div>
  )
}
