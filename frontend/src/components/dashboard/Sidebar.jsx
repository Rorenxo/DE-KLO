import React from 'react'
import {
  Home,
  Clock,
  Target,
  Repeat,
  BarChart3,
  Lightbulb,
  Settings,
  LogOut,
} from 'lucide-react'
import logoImg from '../../assets/logo.png'

export default function Sidebar({ activeTab = 'home', onTabChange, onLeaveApp, theme = 'dark' }) {
  const isLight = theme === 'light'

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'goals', label: 'Savings Goals', icon: Target },
    { id: 'recurring', label: 'Recurring', icon: Repeat },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'insights', label: 'Insights', icon: Lightbulb },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <aside className={`hidden xl:flex flex-col items-center justify-between w-20 h-dvh sticky top-0 border-r py-6 select-none shrink-0 z-30 transition-colors ${
      isLight ? 'bg-white border-slate-200' : 'bg-[#0d0f12] border-[#4a5156]/30'
    }`}>
      <div className="flex flex-col items-center gap-8 w-full">
        <div className={`w-10 h-10 rounded-2xl border p-1.5 flex items-center justify-center shadow-lg ${
          isLight ? 'bg-slate-900 border-slate-800 shadow-slate-200' : 'bg-[#000000] border-[#4a5156]/50 shadow-black/60'
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
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 ${
                    isActive
                      ? isLight
                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105'
                        : 'bg-[#bdc7ce] text-[#000000] shadow-lg shadow-[#bdc7ce]/20 scale-105'
                      : isLight
                        ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                        : 'text-[#808a92] hover:text-white hover:bg-[#24292e]/80'
                  }`}
                  aria-label={item.label}
                >
                  <Icon className="w-5 h-5" />
                </button>

                <div className={`absolute left-full ml-3 px-2.5 py-1 border text-xs font-medium rounded-xl whitespace-nowrap shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pointer-events-none ${
                  isLight ? 'bg-slate-900 border-slate-800 text-white' : 'bg-[#24292e] border-[#4a5156]/60 text-white'
                }`}>
                  {item.label}
                  <div className={`absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 border-l border-b rotate-45 ${
                    isLight ? 'bg-slate-900 border-slate-800' : 'bg-[#24292e] border-[#4a5156]/60'
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
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 ${
            isLight
              ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
              : 'text-[#808a92] hover:text-rose-400 hover:bg-[#24292e]/80'
          }`}
          aria-label="Leave App (Lock PIN)"
        >
          <LogOut className="w-5 h-5" />
        </button>

        <div className={`absolute left-full ml-3 px-2.5 py-1 border text-xs font-medium rounded-xl whitespace-nowrap shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pointer-events-none ${
          isLight ? 'bg-slate-900 border-slate-800 text-rose-300' : 'bg-[#24292e] border-[#4a5156]/60 text-rose-300'
        }`}>
          Leave App (Lock PIN)
          <div className={`absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 border-l border-b rotate-45 ${
            isLight ? 'bg-slate-900 border-slate-800' : 'bg-[#24292e] border-[#4a5156]/60'
          }`} />
        </div>
      </div>
    </aside>
  )
}
