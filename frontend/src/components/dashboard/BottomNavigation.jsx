import React, { useState } from 'react'
import { Home, Clock, Target, TrendingUp, MoreHorizontal, Repeat, Lightbulb, Settings } from 'lucide-react'

export default function BottomNavigation({ activeTab = 'home', onTabChange, theme = 'dark' }) {
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const isLight = theme === 'light'

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
  ]

  const moreItems = [
    { id: 'recurring', label: 'Recurring', icon: Repeat },
    { id: 'insights', label: 'Insights', icon: Lightbulb },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="fixed bottom-4 md:bottom-6 left-4 right-4 z-50 lg:hidden max-w-md sm:max-w-lg md:max-w-xl mx-auto">
      {showMoreMenu && (
        <div className={`mb-2 p-3 md:p-4 backdrop-blur-xl border rounded-3xl shadow-2xl space-y-1 md:space-y-1.5 animate-fade-in ${
          isLight
            ? 'bg-white/95 border-slate-200 shadow-slate-300/50'
            : 'bg-[#24292e]/95 border-[#4a5156]/60 shadow-black/90'
        }`}>
          {moreItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id)
                  setShowMoreMenu(false)
                }}
                aria-label={item.label}
                className={`w-full flex items-center gap-3 px-4 py-2.5 md:py-3 rounded-2xl text-xs md:text-sm font-semibold active:scale-[0.985] transition-all cursor-pointer ${
                  activeTab === item.id
                    ? isLight ? 'bg-slate-900 text-white' : 'bg-[#bdc7ce] text-[#000000]'
                    : isLight ? 'text-slate-600 hover:text-black hover:bg-slate-100' : 'text-[#808a92] hover:text-white hover:bg-[#4a5156]/30'
                }`}
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      )}

      <div className={`w-full backdrop-blur-xl border rounded-[26px] md:rounded-[32px] p-2 md:p-3 flex items-center justify-around shadow-2xl ${
        isLight
          ? 'bg-white/90 border-slate-200 shadow-slate-300/50'
          : 'bg-[#24292e]/90 border-[#4a5156]/60 shadow-black/90'
      }`}>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id)
                setShowMoreMenu(false)
              }}
              aria-label={item.label}
              className={`flex flex-col items-center justify-center py-1 md:py-1.5 px-3 md:px-4 rounded-2xl active:scale-95 transition-all cursor-pointer ${
                isActive
                  ? isLight ? 'text-slate-900' : 'text-white'
                  : isLight ? 'text-slate-500 hover:text-black' : 'text-[#808a92] hover:text-[#bdc7ce]'
              }`}
            >
              <div
                className={`p-1.5 md:p-2.5 rounded-xl md:rounded-2xl transition-all ${
                  isActive
                    ? isLight ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20' : 'bg-[#bdc7ce] text-[#000000] shadow-md shadow-[#bdc7ce]/20'
                    : ''
                }`}
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <span className="text-[10px] sm:text-[11px] md:text-xs font-semibold mt-1 leading-none">
                {item.label}
              </span>
            </button>
          )
        })}

        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          aria-label="More navigation options"
          className={`flex flex-col items-center justify-center py-1 md:py-1.5 px-3 md:px-4 rounded-2xl active:scale-95 transition-all cursor-pointer ${
            showMoreMenu || moreItems.some((i) => i.id === activeTab)
              ? isLight ? 'text-slate-900' : 'text-white'
              : isLight ? 'text-slate-500 hover:text-black' : 'text-[#808a92] hover:text-[#bdc7ce]'
          }`}
        >
          <div
            className={`p-1.5 md:p-2.5 rounded-xl md:rounded-2xl transition-all ${
              showMoreMenu || moreItems.some((i) => i.id === activeTab)
                ? isLight ? 'bg-slate-900 text-white' : 'bg-[#bdc7ce] text-[#000000]'
                : ''
            }`}
          >
            <MoreHorizontal className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <span className="text-[10px] sm:text-[11px] md:text-xs font-semibold mt-1 leading-none">
            More
          </span>
        </button>
      </div>
    </div>
  )
}
