import React, { useState, useEffect } from 'react'
import { Bell, User, Sun, Moon } from 'lucide-react'

export default function Header({ onNotificationClick, theme, onToggleTheme }) {
  const [dateTimeStr, setDateTimeStr] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const datePart = now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
      const timePart = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
      setDateTimeStr(`${datePart} | ${timePart}`)
    }

    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="w-full flex items-center justify-between py-3 border-b border-[#4a5156]/30 select-none">
      <div className="flex items-center gap-2 text-xs font-Manrope font-medium text-[#808a92] dark:text-[#bdc7ce] tracking-wide">
        <span>{dateTimeStr}</span>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="w-9 h-9 rounded-full bg-[#24292e]/10 dark:bg-[#24292e]/80 border border-[#4a5156]/30 dark:border-[#4a5156]/50 flex items-center justify-center text-[#4a5156] dark:text-[#bdc7ce] hover:text-[#000000] dark:hover:text-white transition-all cursor-pointer active:scale-95 shadow-sm"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        <button
          onClick={onNotificationClick}
          className="w-9 h-9 rounded-full bg-[#24292e]/10 dark:bg-[#24292e]/80 border border-[#4a5156]/30 dark:border-[#4a5156]/50 flex items-center justify-center text-[#808a92] hover:text-[#000000] dark:hover:text-[#bdc7ce] transition-colors cursor-pointer relative shadow-sm"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#bdc7ce]" />
        </button>

        <div className="w-9 h-9 rounded-full bg-[#24292e]/10 dark:bg-[#24292e] border border-[#4a5156]/30 dark:border-[#4a5156]/60 flex items-center justify-center text-[#4a5156] dark:text-[#bdc7ce] font-semibold shadow-md overflow-hidden">
          <User className="w-4 h-4" />
        </div>
      </div>
    </header>
  )
}
