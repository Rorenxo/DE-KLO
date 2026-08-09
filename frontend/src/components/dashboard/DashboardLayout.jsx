import React, { useState, useEffect } from 'react'
import Header from './Header'
import AtmCard from './AtmCard'
import ActionButtons from './ActionButtons'
import FinancialOverview from './FinancialOverview'
import MoneyFlowChart from './MoneyFlowChart'
import Sidebar from './Sidebar'
import RightPanel from './RightPanel'
import BottomNavigation from './BottomNavigation'

export default function DashboardLayout({ user, onLockApp }) {
  const [activeTab, setActiveTab] = useState('home')
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('deklo_theme') || 'dark'
    } catch (e) {
      return 'dark'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('deklo_theme', theme)
    } catch (e) {}

    const root = document.documentElement
    if (theme === 'light') {
      root.classList.add('light')
      root.classList.remove('dark')
    } else {
      root.classList.add('dark')
      root.classList.remove('light')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const userName = user?.user_metadata?.nickname || user?.email?.split('@')[0] || 'Lorenxo'

  const handleDeposit = () => {
    alert('Deposit feature initialized.')
  }

  const handleWithdraw = () => {
    alert('Withdraw feature initialized.')
  }

  return (
    <div className={`min-h-dvh lg:h-dvh lg:max-h-dvh w-full transition-colors duration-300 flex flex-col lg:flex-row select-none overflow-x-hidden lg:overflow-hidden ${
      theme === 'light' ? 'bg-[#f4f6f8] text-slate-900' : 'bg-[#000000] text-white'
    }`}>
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLeaveApp={onLockApp}
        theme={theme}
      />

      <div className="flex-1 flex flex-col min-w-0 lg:h-full lg:overflow-y-auto">
        <div className="px-4 sm:px-6 lg:px-6 pt-2 sm:pt-3">
          <Header
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        </div>

        <div className="flex-1 flex flex-col xl:flex-row p-4 sm:p-5 lg:p-5 gap-4 lg:gap-5 pb-24 lg:pb-5">
          <main className="flex-1 min-w-0 space-y-3 sm:space-y-4">
            {activeTab === 'home' && (
              <div className="space-y-3 sm:space-y-4 animate-fade-in">
                <div className="flex flex-col md:flex-row items-stretch gap-4 sm:gap-5">
                  <div className="w-full max-w-[460px] shrink-0">
                    <AtmCard userName={userName} />
                  </div>

                  <div className="w-full md:w-auto flex-1 flex flex-col justify-center max-w-[360px]">
                    <ActionButtons
                      onDeposit={handleDeposit}
                      onWithdraw={handleWithdraw}
                      theme={theme}
                    />
                  </div>
                </div>

                <div className="xl:hidden">
                  <FinancialOverview theme={theme} />
                </div>

                <MoneyFlowChart theme={theme} />
              </div>
            )}

            {activeTab !== 'home' && (
              <div className={`p-8 text-center rounded-2xl border animate-fade-in my-8 ${
                theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#24292e]/40 border-[#4a5156]/30'
              }`}>
                <h3 className="text-lg font-bold uppercase tracking-wider">
                  {activeTab} Space
                </h3>
                <p className="text-xs text-[#808a92] mt-2">
                  Dedicated {activeTab} experience under construction.
                </p>
              </div>
            )}
          </main>

          <RightPanel theme={theme} />
        </div>
      </div>

      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
      />
    </div>
  )
}
