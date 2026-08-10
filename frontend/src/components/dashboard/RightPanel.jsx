import React, { useState } from 'react'
import {
  Wallet,
  TrendingUp,
  PiggyBank,
  ArrowDownRight,
  ChevronDown,
  Target,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import ScrollFadeIn from '../ui/ScrollFadeIn'
import { savingsService } from '../../services/savingsService'

export default function RightPanel({
  theme = 'dark',
  userId,
  overviewData = {
    balance: '₱0',
    income: '₱0',
    incomeGrowth: '0%',
    savings: '₱0',
    savingsGrowth: '0%',
    expenses: '₱0',
    expensesGrowth: '0%',
  },
  goals = [],
  onGoalCreated,
}) {
  const [period, setPeriod] = useState('This Month')
  const [showDropdown, setShowDropdown] = useState(false)

  // Goal Creation Modal State
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [goalName, setGoalName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [initialAmount, setInitialAmount] = useState('')
  const [goalError, setGoalError] = useState('')
  const [isSubmittingGoal, setIsSubmittingGoal] = useState(false)

  const isLight = theme === 'light'

  const handleCreateGoalSubmit = async (e) => {
    e.preventDefault()
    setGoalError('')

    if (!goalName.trim()) {
      setGoalError('Please enter a goal name.')
      return
    }

    const numTarget = parseFloat(targetAmount)
    if (isNaN(numTarget) || numTarget <= 0) {
      setGoalError('Target amount must be greater than 0.')
      return
    }

    const numCurrent = parseFloat(initialAmount) || 0

    if (!userId || userId === 'guest') {
      setGoalError('Please sign in to save goals to Supabase.')
      return
    }

    setIsSubmittingGoal(true)
    try {
      // Insert row into Supabase PostgreSQL savings_goals table
      await savingsService.createGoal({
        userId,
        name: goalName.trim(),
        target_amount: numTarget,
        current_amount: numCurrent,
      })

      setIsSubmittingGoal(false)
      setIsGoalModalOpen(false)
      setGoalName('')
      setTargetAmount('')
      setInitialAmount('')

      if (onGoalCreated) {
        onGoalCreated()
      }
    } catch (err) {
      setIsSubmittingGoal(false)
      setGoalError(`Supabase Error: ${err.message || 'Failed to create goal'}`)
    }
  }

  return (
    <aside className="hidden xl:flex flex-col space-y-6 w-105 select-none shrink-0 self-start">
      <ScrollFadeIn delay={100}>
        <div className={`p-3.5 rounded-2xl border space-y-3 shadow-lg transition-colors ${
          isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' : 'bg-[#24292e]/70 border-[#4a5156]/40 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-wide uppercase">
              Financial Overview
            </h3>

            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                aria-label="Select timeframe"
                className={`flex items-center gap-1 px-2.5 py-1 border rounded-xl text-[10px] sm:text-[11px] transition-all cursor-pointer ${
                  isLight ? 'bg-slate-100 border-slate-300 text-slate-700 hover:text-black' : 'bg-[#000000]/60 border-[#4a5156]/50 text-[#bdc7ce] hover:text-white'
                }`}
              >
                <span>{period}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showDropdown && (
                <div className={`absolute right-0 mt-1 w-32 border rounded-xl shadow-2xl z-30 overflow-hidden py-1 ${
                  isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#24292e] border-[#4a5156] text-white'
                }`}>
                  {['This Week', 'This Month'].map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setPeriod(p)
                        setShowDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                        period === p
                          ? isLight ? 'bg-slate-100 font-semibold text-slate-900' : 'bg-[#bdc7ce]/15 text-[#bdc7ce] font-semibold'
                          : isLight ? 'text-slate-600 hover:text-black' : 'text-[#808a92] hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className={`p-3 rounded-xl border space-y-1 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#000000]/50 border-[#4a5156]/30'
            }`}>
              <div className="flex items-center justify-between text-[#808a92]">
                <span className="text-[10px] sm:text-[11px] font-medium tracking-wide">Total Balance</span>
                <Wallet className="w-3.5 h-3.5 text-[#bdc7ce]" />
              </div>
              <div className="text-base font-bold font-mono">
                {overviewData.balance}
              </div>
            </div>

            <div className={`p-3 rounded-xl border space-y-1 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#000000]/50 border-[#4a5156]/30'
            }`}>
              <div className="flex items-center justify-between text-[#808a92]">
                <span className="text-[10px] sm:text-[11px] font-medium tracking-wide">Income</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div>
                <div className="text-base font-bold font-mono text-emerald-500">
                  {overviewData.income}
                </div>
                <span className="text-[10px] sm:text-[11px] text-emerald-500/90 font-medium">
                  {overviewData.incomeGrowth}
                </span>
              </div>
            </div>

            <div className={`p-3 rounded-xl border space-y-1 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#000000]/50 border-[#4a5156]/30'
            }`}>
              <div className="flex items-center justify-between text-[#808a92]">
                <span className={`text-[10px] sm:text-[11px] font-medium tracking-wide ${isLight ? 'text-slate-600' : 'text-[#808a92]'}`}>Savings</span>
                <PiggyBank className={`w-3.5 h-3.5 ${isLight ? 'text-slate-800' : 'text-[#bdc7ce]'}`} />
              </div>
              <div>
                <div className={`text-base font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {overviewData.savings}
                </div>
                <span className={`text-[10px] sm:text-[11px] font-medium ${isLight ? 'text-slate-600' : 'text-[#808a92]'}`}>
                  {overviewData.savingsGrowth}
                </span>
              </div>
            </div>

            <div className={`p-3 rounded-xl border space-y-1 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#000000]/50 border-[#4a5156]/30'
            }`}>
              <div className="flex items-center justify-between text-[#808a92]">
                <span className={`text-[10px] sm:text-[11px] font-medium tracking-wide ${isLight ? 'text-slate-600' : 'text-[#808a92]'}`}>Expenses</span>
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div>
                <div className="text-base font-bold font-mono text-rose-500">
                  {overviewData.expenses}
                </div>
                <span className="text-[10px] sm:text-[11px] text-rose-500/90 font-medium">
                  {overviewData.expensesGrowth}
                </span>
              </div>
            </div>
          </div>
        </div>
      </ScrollFadeIn>

      <ScrollFadeIn delay={200}>
        <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 shadow-lg transition-colors flex flex-col justify-between ${
          isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' : 'bg-[#24292e]/80 border-[#4a5156]/40 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className={`w-4 h-4 ${isLight ? 'text-slate-900' : 'text-[#bdc7ce]'}`} />
              <h4 className={`text-xs font-bold tracking-wide uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Savings Goals
              </h4>
            </div>
            <button className={`text-[10px] sm:text-[11px] font-semibold transition-colors cursor-pointer ${
              isLight ? 'text-slate-600 hover:text-black' : 'text-[#808a92] hover:text-[#bdc7ce]'
            }`}>
              View All
            </button>
          </div>

          {goals.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-4 px-3 space-y-2.5 min-h-[224px] my-auto">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                isLight ? 'bg-slate-100 text-slate-800 border border-slate-300' : 'bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30'
              }`}>
                <Target className="w-5.5 h-5.5" />
              </div>
              <div className="space-y-1">
                <h5 className={`text-xs font-bold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  No Savings Goals Set Yet
                </h5>
                <p className="text-[11px] text-[#808a92] leading-relaxed max-w-[220px] mx-auto">
                  Start building your dream future! Set your first savings goal today and track your progress.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-h-[224px] overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-[#4a5156]/50 scrollbar-track-transparent">
              {goals.map((g) => {
                const targetVal = Number(g.target_amount || g.target) || 1
                const currentVal = Number(g.current_amount || g.current) || 0
                const progressPct = Math.min(100, Math.round((currentVal / targetVal) * 100))

                return (
                  <div key={g.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold">{g.name}</span>
                      <span className="text-[#d4af37] font-mono font-bold">{progressPct}%</span>
                    </div>

                    <div className={`w-full h-2 rounded-full overflow-hidden ${
                      isLight ? 'bg-slate-200' : 'bg-black/60'
                    }`}>
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#d4af37] to-[#bdc7ce] transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] sm:text-[11px] text-[#808a92] font-mono">
                      <span>₱{currentVal.toLocaleString()}</span>
                      <span>₱{targetVal.toLocaleString()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <button
            onClick={() => setIsGoalModalOpen(true)}
            aria-label="Create new savings goal"
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 border border-dashed rounded-xl text-xs font-semibold transition-colors cursor-pointer active:scale-[0.985] ${
              isLight
                ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'border-[#4a5156]/60 text-[#bdc7ce] hover:text-white hover:border-white/40 hover:bg-white/5'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{goals.length === 0 ? 'Create Your First Goal' : 'Create New Goal'}</span>
          </button>
        </div>
      </ScrollFadeIn>

      {/* Goal Creation Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none animate-fade-in">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
            onClick={() => setIsGoalModalOpen(false)}
          />

          <div className={`relative w-full max-w-md rounded-3xl border p-5 sm:p-6 shadow-2xl z-10 transition-all ${
            isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50' : 'bg-[#1a1e22] border-[#4a5156]/60 text-white'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Target className="w-5 h-5 text-[#d4af37]" />
                <h3 className="text-base font-bold">Set Savings Goal</h3>
              </div>
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="p-1.5 text-[#808a92] hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoalSubmit} className="space-y-4 pt-4">
              {goalError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{goalError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-[#808a92]">
                  Goal Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Emergency Fund, New Laptop"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  autoFocus
                  className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-semibold outline-none border transition-all ${
                    isLight ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-[#000000]/70 border-[#4a5156]/60 text-white focus:border-[#bdc7ce]'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-[#808a92]">
                  Target Amount (₱)
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="50000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-mono font-bold outline-none border transition-all ${
                    isLight ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-[#000000]/70 border-[#4a5156]/60 text-white focus:border-[#bdc7ce]'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-[#808a92]">
                  Initial Saved Amount (Optional ₱)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(e.target.value)}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-mono font-bold outline-none border transition-all ${
                    isLight ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-[#000000]/70 border-[#4a5156]/60 text-white focus:border-[#bdc7ce]'
                  }`}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-[#4a5156]/60 text-xs font-semibold text-[#bdc7ce] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGoal}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#bdc7ce] text-black font-bold text-xs shadow-lg hover:opacity-90 transition-opacity"
                >
                  {isSubmittingGoal ? 'Saving to Supabase...' : 'Save Goal to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  )
}
