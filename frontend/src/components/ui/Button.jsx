import React from 'react'
import { Loader2 } from 'lucide-react'

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  isLoading = false,
  disabled = false,
  onClick,
  className = '',
  icon: Icon,
}) {
  const isPrimary = variant === 'primary'

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`
        w-full relative flex items-center justify-center gap-2 font-semibold text-sm rounded-2xl transition-all duration-200 select-none
        min-h-[48px] py-3 px-6 active:scale-[0.985] cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${
          isPrimary
            ? 'bg-[#bdc7ce] text-[#000000] hover:bg-white hover:shadow-lg hover:shadow-[#bdc7ce]/15'
            : 'bg-[#24292e]/60 text-[#bdc7ce] border border-[#4a5156] hover:border-[#808a92] hover:text-white'
        }
        ${className}
      `}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-current" />
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4" />}
          <span>{children}</span>
        </>
      )}
    </button>
  )
}
