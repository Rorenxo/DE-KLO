import React from 'react'
import {
  Home,
  Clock,
  Target,
  CreditCard,
  BarChart3,
  Lightbulb,
  LogOut,
} from 'lucide-react'
import logoImg from '../../assets/logo.png'

export default function Sidebar({ activeTab = 'home', onTabChange, onLeaveApp, theme = 'dark' }) {
  const isLight = theme === 'light'

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'goals', label: 'Savings Goals', icon: Target },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'insights', label: 'Insights', icon: Lightbulb },
  ]

  return (
    <aside className={`hidden xl:flex flex-col items-center justify-between w-20 h-dvh sticky top-0 border-r py-6 select-none shrink-0 z-30 transition-colors ${isLight ? 'bg-[#F1F3F8] border-[#DEE2EA]' : 'bg-[#121418] border-[#242830]'
      }`}>
      <div className="flex flex-col items-center gap-8 w-full">
        <div className={`w-10 h-10 rounded-2xl border p-1.5 flex items-center justify-center shadow-md ${isLight ? 'bg-[#343A40] border-[#343A40]' : 'bg-[#000000] border-[#242830]'
          }`}>
          <img
            src={logoImg}
            alt="De'klo Logo"
            className="w-full h-full object-contain"
          />
        </div>

        <nav className="flex flex-col items-center gap-4 w-full px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <div key={item.id} className="relative group flex items-center justify-center w-full">
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 ${isActive
                      ? isLight
                        ? 'bg-[#343A40] text-[#F8F8FF] shadow-md scale-105'
                        : 'bg-[#F1F3F5] text-[#000000] shadow-md scale-105'
                      : isLight
                        ? 'text-[#68707C] hover:text-[#343A40] hover:bg-[#ECEEF4]'
                        : 'text-[#94A3B8] hover:text-[#F1F3F5] hover:bg-[#1E222A]'
                    }`}
                  aria-label={item.label}
                >
                  <Icon className="w-5 h-5" />
                </button>

                <div className={`absolute left-full ml-3 px-2.5 py-1 border text-xs font-medium rounded-xl whitespace-nowrap shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pointer-events-none ${isLight ? 'bg-[#343A40] border-[#343A40] text-[#F8F8FF]' : 'bg-[#181b20] border-[#242830] text-[#F1F3F5]'
                  }`}>
                  {item.label}
                  <div className={`absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 border-l border-b rotate-45 ${isLight ? 'bg-[#343A40] border-[#343A40]' : 'bg-[#181b20] border-[#242830]'
                    }`} />
                </div>
              </div>
            )
          })}
        </nav>
      </div>

      <div className="relative group flex items-center justify-center w-full px-2">
        <button
          onClick={onLeaveApp}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 ${isLight
              ? 'text-[#68707C] hover:text-rose-600 hover:bg-rose-50'
              : 'text-[#B8C0C8] hover:text-rose-400 hover:bg-[#30363C]'
            }`}
          aria-label="Leave App (Lock PIN)"
        >
          <LogOut className="w-5 h-5" />
        </button>

        <div className={`absolute left-full ml-3 px-2.5 py-1 border text-xs font-medium rounded-xl whitespace-nowrap shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pointer-events-none ${isLight ? 'bg-[#343A40] border-[#343A40] text-rose-300' : 'bg-[#2E343A] border-[#3A4148] text-rose-300'
          }`}>
          Leave App (Lock PIN)
          <div className={`absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 border-l border-b rotate-45 ${isLight ? 'bg-[#343A40] border-[#343A40]' : 'bg-[#2E343A] border-[#3A4148]'
            }`} />
        </div>
      </div>
    </aside>
  )
}
