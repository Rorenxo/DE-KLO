import React, { useState } from 'react'
import { Eye, EyeOff, Check, Copy } from 'lucide-react'
import logoImg from '../../assets/logo.png'

export default function AtmCard({
  userName = 'User',
  balanceAmount = '₱0.00',
  accountIdFull = 'DK-0000-0000-0000',
  accountIdMasked = '•••• •••• •••• 0000',
  createdDate = '01/26',
}) {
  const [showBalance, setShowBalance] = useState(true)
  const [copied, setCopied] = useState(false)

  const handleCopyId = () => {
    navigator.clipboard.writeText(accountIdFull)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative w-full max-w-[460px] aspect-[1.8/1] rounded-[22px] p-4 sm:p-5 text-white shadow-2xl shadow-black/95 overflow-hidden flex flex-col justify-between select-none border border-[#4a5156]/50 transition-all duration-200 active:scale-[0.99] hover:shadow-black bg-gradient-to-br from-[#1a1e22] via-[#0d0f12] to-[#000000]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#bdc7ce]/15 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-[#bdc7ce]/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 flex items-center justify-between">
        <img
          src={logoImg}
          alt="De'klo Logo"
          className="h-7 w-auto object-contain"
        />

        <span className="font-brand text-lg sm:text-xl font-extralight tracking-[0.40em] uppercase text-white">
          DE'KLO
        </span>
      </div>

      <div className="relative z-10 space-y-0.5 my-auto pt-0.5">
        <span className="block text-[10px] sm:text-[11px] uppercase tracking-wider text-[#808a92] font-medium">
          Current Balance
        </span>

        <div className="flex items-center gap-3 pt-0.5">
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
            {showBalance ? balanceAmount : '••••••••'}
          </div>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="text-[#808a92] hover:text-[#bdc7ce] transition-colors p-1 rounded-lg active:scale-95 cursor-pointer"
            aria-label={showBalance ? 'Hide balance' : 'Show balance'}
            title={showBalance ? 'Hide Balance' : 'Show Balance'}
          >
            {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="relative z-10 flex items-end justify-between pt-0.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono tracking-wider text-[#bdc7ce]">
            {accountIdMasked}
          </span>
          <button
            onClick={handleCopyId}
            className="text-[#808a92] hover:text-[#bdc7ce] transition-colors p-0.5 rounded-md active:scale-95 cursor-pointer"
            aria-label="Copy Account ID"
            title="Copy Account ID"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>

        <div className="text-right">
          <span className="block text-[10px] uppercase tracking-wider text-[#808a92]">
            Ctd Date
          </span>
          <span className="text-xs font-mono text-white">
            {createdDate}
          </span>
        </div>
      </div>
    </div>
  )
}
