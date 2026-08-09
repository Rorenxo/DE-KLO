import React from 'react'
import logoImg from '../../assets/logo.png'

export default function AuthHeader() {
  return (
    <div className="relative w-full flex flex-col items-center justify-center text-center space-y-2 pt-2 pb-1">
      <img
        src={logoImg}
        alt="De'klo Logo"
        className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-md"
      />

      <h1 className="font-brand text-3xl sm:text-4xl font-extrabold tracking-[0.28em] text-white uppercase drop-shadow-sm">
        De'klo
      </h1>

      <div className="flex items-center justify-center gap-2">
        <span className="h-[1px] w-4 bg-[#4a5156]"></span>
        <p className="text-[10px] uppercase tracking-[0.22em] text-[#bdc7ce] font-medium">
          Finance Space
        </p>
        <span className="h-[1px] w-4 bg-[#4a5156]"></span>
      </div>
    </div>
  )
}
