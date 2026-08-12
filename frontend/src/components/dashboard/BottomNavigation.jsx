import React, { useEffect, useRef, useState } from 'react'
import {
  Home,
  Clock,
  Target,
  CreditCard,
  MoreHorizontal,
  TrendingUp,
  Lightbulb,
} from 'lucide-react'

export default function BottomNavigation({
  activeTab = 'home',
  onTabChange,
  theme = 'dark',
}) {
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const moreRef = useRef(null)
  const isLight = theme === 'light'

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  ]

  const moreItems = [
    { id: 'reports', label: 'Reports', icon: TrendingUp },
    { id: 'insights', label: 'Insights', icon: Lightbulb },
  ]

  const isMoreActive = moreItems.some((item) => item.id === activeTab)
  const isMoreSelected = showMoreMenu || isMoreActive

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setShowMoreMenu(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowMoreMenu(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const handleTabChange = (id) => {
    onTabChange(id)
    setShowMoreMenu(false)
  }

  const handleMoreClick = () => {
    setShowMoreMenu((previous) => !previous)
  }

  return (
    <>
      <div className="fixed z-50 bottom-3 sm:bottom-4 left-3 right-3 flex justify-center pointer-events-none md:hidden">
        <div ref={moreRef} className="relative w-full max-w-[600px] pointer-events-auto">
          {showMoreMenu && (
            <div
              className={`absolute bottom-full right-0 mb-2 z-[60] w-fit max-w-[calc(100vw-24px)] p-1.5 backdrop-blur-xl border rounded-2xl shadow-2xl animate-fade-in ${isLight
                  ? 'bg-white/95 border-slate-200 shadow-slate-300/50'
                  : 'bg-[#24292e]/95 border-[#4a5156]/60 shadow-black/90'
                }`}
            >
              {moreItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id

                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    aria-label={item.label}
                    className={`w-max flex items-center gap-2 px-2.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 active:scale-[0.97] ${isActive
                        ? isLight
                          ? 'bg-slate-900 text-white'
                          : 'bg-[#bdc7ce] text-black'
                        : isLight
                          ? 'text-slate-600 hover:text-black hover:bg-slate-100'
                          : 'text-[#9aa3aa] hover:text-white hover:bg-[#4a5156]/30'
                      }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          )}

          <nav
            className={`w-full backdrop-blur-xl border rounded-[20px] p-1.5 sm:p-2 flex items-center shadow-3xl ${isLight
                ? 'bg-white/90 border-slate-200 shadow-slate-300/90'
                : 'bg-[#24292e]/90 border-[#4a5156]/60 shadow-black'
              }`}
          >
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = !showMoreMenu && activeTab === item.id

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 sm:py-1.5 px-0.5 sm:px-1 rounded-2xl active:scale-95 transition-all duration-150 cursor-pointer ${isActive
                      ? isLight
                        ? 'text-slate-900'
                        : 'text-white'
                      : isLight
                        ? 'text-slate-500 hover:text-black'
                        : 'text-[#808a92] hover:text-[#bdc7ce]'
                    }`}
                >
                  <div
                    className={`p-1.5 sm:p-2 rounded-xl transition-all duration-150 ${isActive
                        ? isLight
                          ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                          : 'bg-[#bdc7ce] text-black shadow-md shadow-[#bdc7ce]/20'
                        : ''
                      }`}
                  >
                    <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  </div>

                  <span className="max-w-full truncate text-[9px] sm:text-[10px] font-semibold mt-1 leading-none">
                    {item.label}
                  </span>
                </button>
              )
            })}

            <button
              onClick={handleMoreClick}
              aria-label="More navigation options"
              aria-expanded={showMoreMenu}
              className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 sm:py-1.5 px-0.5 sm:px-1 rounded-2xl active:scale-95 transition-all duration-150 cursor-pointer ${isMoreSelected
                  ? isLight
                    ? 'text-slate-900'
                    : 'text-white'
                  : isLight
                    ? 'text-slate-500 hover:text-black'
                    : 'text-[#808a92] hover:text-[#bdc7ce]'
                }`}
            >
              <div
                className={`p-1.5 sm:p-2 rounded-xl transition-all duration-150 ${isMoreSelected
                    ? isLight
                      ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                      : 'bg-[#bdc7ce] text-black shadow-md shadow-[#bdc7ce]/20'
                    : ''
                  }`}
              >
                <MoreHorizontal className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              </div>

              <span className="max-w-full truncate text-[9px] sm:text-[10px] font-semibold mt-1 leading-none">
                More
              </span>
            </button>
          </nav>
        </div>
      </div>

      <div className="h-[76px] sm:h-[84px] md:hidden" aria-hidden="true" />
    </>
  )
}