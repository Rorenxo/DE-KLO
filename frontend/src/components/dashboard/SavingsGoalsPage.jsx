import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  Target,
  Plus,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'
import ScrollFadeIn from '../ui/ScrollFadeIn'
import { savingsService } from '../../services/savingsService'

export default function SavingsGoalsPage({
  theme = 'dark',
  userId,
  goals = [],
  onGoalChange,
}) {
  const isLight = theme === 'light'

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isAddMoneyModalOpen, setIsAddMoneyModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState(null)

  const [goalName, setGoalName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [initialAmount, setInitialAmount] = useState('')
  const [deadlineDate, setDeadlineDate] = useState('')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [addMoneyAmount, setAddMoneyAmount] = useState('')
  const [addMoneyError, setAddMoneyError] = useState('')

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editTarget, setEditTarget] = useState('')
  const [editDeadline, setEditDeadline] = useState('')

  const [goalToDelete, setGoalToDelete] = useState(null)

  const [filterStatus, setFilterStatus] = useState('active')

  const overviewMetrics = useMemo(() => {
    let totalSaved = 0
    let totalTarget = 0
    let completedCount = 0
    let activeCount = 0

    goals.forEach((g) => {
      const cur = Number(g.current_amount || g.current) || 0
      const tgt = Number(g.target_amount || g.target) || 0
      totalSaved += cur
      totalTarget += tgt

      if (tgt > 0 && cur >= tgt) {
        completedCount += 1
      } else {
        activeCount += 1
      }
    })

    const totalRemaining = Math.max(0, totalTarget - totalSaved)
    const overallProgressPct =
      totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0

    return {
      totalSaved,
      totalTarget,
      totalRemaining,
      goalsCount: goals.length,
      activeCount,
      completedCount,
      overallProgressPct,
    }
  }, [goals])

  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      const cur = Number(g.current_amount || g.current) || 0
      const tgt = Number(g.target_amount || g.target) || 0
      const isCompleted = tgt > 0 && cur >= tgt

      if (filterStatus === 'finished') return isCompleted
      return !isCompleted
    })
  }, [goals, filterStatus])

  const handleOpenCreateModal = () => {
    setGoalName('')
    setTargetAmount('')
    setInitialAmount('')
    setDeadlineDate('')
    setFormError('')
    setIsCreateModalOpen(true)
  }

  const handleCreateGoalSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!goalName.trim()) {
      setFormError('Please enter a goal name.')
      return
    }

    const numTarget = parseFloat(targetAmount)
    if (isNaN(numTarget) || numTarget <= 0) {
      setFormError('Target amount must be greater than 0.')
      return
    }

    const numCurrent = parseFloat(initialAmount) || 0
    if (numCurrent < 0) {
      setFormError('Initial saved amount cannot be negative.')
      return
    }

    if (!userId || userId === 'guest') {
      setFormError('Please sign in to save your goals.')
      return
    }

    setIsSubmitting(true)
    try {
      await savingsService.createGoal({
        userId,
        name: goalName.trim(),
        target_amount: numTarget,
        current_amount: numCurrent,
        deadline: deadlineDate ? new Date(deadlineDate).toISOString() : null,
      })

      setIsSubmitting(false)
      setIsCreateModalOpen(false)
      if (onGoalChange) onGoalChange()
    } catch (err) {
      setIsSubmitting(false)
      console.error('Goal creation failed:', err)
      setFormError(err.message || 'Failed to create goal.')
    }
  }

  const handleOpenAddMoneyModal = (goal, e) => {
    if (e) e.stopPropagation()
    setSelectedGoal(goal)
    setAddMoneyAmount('')
    setAddMoneyError('')
    setIsAddMoneyModalOpen(true)
  }

  const handleAddMoneySubmit = async (e) => {
    e.preventDefault()
    setAddMoneyError('')

    const numAmt = parseFloat(addMoneyAmount)
    if (isNaN(numAmt) || numAmt <= 0) {
      setAddMoneyError('Please enter a valid amount greater than 0.')
      return
    }

    if (!selectedGoal || !userId) return

    setIsSubmitting(true)
    try {
      const currentVal = Number(selectedGoal.current_amount || selectedGoal.current) || 0
      const newCurrent = currentVal + numAmt

      await savingsService.updateGoal(selectedGoal.id, userId, {
        current_amount: newCurrent,
      })

      setIsSubmitting(false)
      setIsAddMoneyModalOpen(false)
      setSelectedGoal(null)
      if (onGoalChange) onGoalChange()
    } catch (err) {
      setIsSubmitting(false)
      console.error('Add money to goal failed:', err)
      setAddMoneyError(err.message || 'Failed to update goal amount.')
    }
  }

  const handleOpenDetailModal = (goal) => {
    setSelectedGoal(goal)
    setIsEditing(false)
    setEditName(goal.name || '')
    setEditTarget(String(goal.target_amount || ''))
    setEditDeadline(
      goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : ''
    )
    setIsDetailModalOpen(true)
  }

  const handleUpdateGoalSubmit = async (e) => {
    e.preventDefault()
    if (!selectedGoal || !userId) return

    const numTgt = parseFloat(editTarget)
    if (isNaN(numTgt) || numTgt <= 0) {
      alert('Target amount must be greater than 0.')
      return
    }

    setIsSubmitting(true)
    try {
      await savingsService.updateGoal(selectedGoal.id, userId, {
        name: editName.trim(),
        target_amount: numTgt,
        deadline: editDeadline ? new Date(editDeadline).toISOString() : null,
      })

      setIsSubmitting(false)
      setIsEditing(false)
      setIsDetailModalOpen(false)
      setSelectedGoal(null)
      if (onGoalChange) onGoalChange()
    } catch (err) {
      setIsSubmitting(false)
      console.error('Goal update failed:', err)
      alert(err.message || 'Failed to update goal.')
    }
  }

  const handleDeleteGoalClick = (goal) => {
    setGoalToDelete(goal)
  }

  const confirmDeleteGoal = async (goalId) => {
    if (!goalId || !userId) return

    setIsSubmitting(true)
    try {
      await savingsService.deleteGoal(goalId, userId)
      setIsSubmitting(false)
      setGoalToDelete(null)
      setIsDetailModalOpen(false)
      setSelectedGoal(null)
      if (onGoalChange) onGoalChange()
    } catch (err) {
      setIsSubmitting(false)
      console.error('Goal deletion failed:', err)
      alert('Failed to delete goal.')
    }
  }

  return (
    <div className="w-full space-y-6 select-none animate-fade-in pb-8">
      <header className="pt-1">
        <h2
          className={`text-xl sm:text-2xl font-bold font-sans tracking-tight ${isLight ? 'text-[#343A40]' : 'text-[#F1F3F5]'
            }`}
        >
          Savings Goals
        </h2>
        <p
          className={`text-xs mt-0.5 ${isLight ? 'text-[#68707C] font-medium' : 'text-[#94A3B8]'
            }`}
        >
          Track your progress and reach your targets.
        </p>
      </header>

      <ScrollFadeIn delay={100}>
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border shadow-sm transition-colors ${isLight
            ? 'bg-[#F1F3F8] border-[#DEE2EA] text-[#343A40]'
            : 'bg-[#121418] border-[#242830] text-[#F1F3F5]'
            }`}
        >
          <div
            className={`flex items-center justify-between pb-2.5 border-b text-[11px] font-bold uppercase tracking-wider ${isLight ? 'border-[#DEE2EA] text-[#68707C]' : 'border-[#242830] text-[#94A3B8]'
              }`}
          >
            <span>Overview Metrics</span>
            <span className="font-mono text-[10px] sm:text-[11px] opacity-80">
              {overviewMetrics.overallProgressPct}% Total Achieved
            </span>
          </div>

          <div className="grid grid-cols-4 gap-0.5 pt-2.5 items-center">
            <div className="text-center sm:text-left space-y-0.5">
              <span
                className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider block ${isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'
                  }`}
              >
                Saved
              </span>
              <span
                className={`text-xs sm:text-sm md:text-base font-bold font-mono block truncate ${isLight ? 'text-[#343A40]' : 'text-[#F1F3F5]'
                  }`}
              >
                ₱
                {overviewMetrics.totalSaved.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div
              className={`text-center sm:text-left space-y-0.5 border-l sm:pl-3 ${isLight ? 'border-[#DEE2EA]' : 'border-[#242830]'
                }`}
            >
              <span
                className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider block ${isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'
                  }`}
              >
                Remaining
              </span>
              <span
                className={`text-xs sm:text-sm md:text-base font-bold font-mono block truncate ${isLight ? 'text-[#343A40]' : 'text-[#F1F3F5]'
                  }`}
              >
                ₱
                {overviewMetrics.totalRemaining.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div
              className={`text-center sm:text-left space-y-0.5 border-l pl-2 sm:pl-3 ${isLight ? 'border-[#DEE2EA]' : 'border-[#242830]'
                }`}
            >
              <span
                className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider block ${isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'
                  }`}
              >
                Goals
              </span>
              <span
                className={`text-xs sm:text-sm md:text-base font-bold font-mono block ${isLight ? 'text-[#343A40]' : 'text-[#F1F3F5]'
                  }`}
              >
                {overviewMetrics.goalsCount}
              </span>
            </div>

            <div
              className={`text-center sm:text-left space-y-0.5 border-l pl-2 sm:pl-3 ${isLight ? 'border-[#DEE2EA]' : 'border-[#242830]'
                }`}
            >
              <span
                className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider block ${isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'
                  }`}
              >
                Done
              </span>
              <span
                className={`text-xs sm:text-sm md:text-base font-bold font-mono block ${isLight ? 'text-[#343A40]' : 'text-[#F1F3F5]'
                  }`}
              >
                {overviewMetrics.completedCount}
              </span>
            </div>
          </div>
        </div>
      </ScrollFadeIn>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div
          className={`flex items-center p-1 rounded-2xl border ${isLight ? 'bg-[#F4F5FA] border-[#DEE2EA]' : 'bg-[#181b20] border-[#242830]'
            }`}
        >
          {[
            { id: 'active', label: 'Active' },
            { id: 'finished', label: 'Finished' },
          ].map((t) => {
            const isActive = filterStatus === t.id

            return (
              <button
                key={t.id}
                onClick={() => setFilterStatus(t.id)}
                className={`py-1.5 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${isActive
                  ? isLight
                    ? 'bg-[#343A40] text-[#F8F8FF] shadow-sm'
                    : 'bg-[#F1F3F5] text-[#000000] shadow-sm'
                  : isLight
                    ? 'text-[#68707C] hover:text-[#343A40]'
                    : 'text-[#94A3B8] hover:text-[#F1F3F5]'
                  }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        <button
          onClick={handleOpenCreateModal}
          aria-label="Create new savings goal"
          className={`flex items-center gap-2 py-2 px-4 rounded-2xl text-xs font-bold shadow-md transition-all active:scale-[0.985] cursor-pointer ${isLight
            ? 'bg-[#343A40] text-[#F8F8FF] hover:bg-[#212529]'
            : 'bg-[#F1F3F5] text-[#000000] hover:bg-white'
            }`}
        >
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {filteredGoals.length === 0 && (
        <div
          className={`p-8 sm:p-12 text-center rounded-3xl border space-y-4 my-4 animate-fade-in ${isLight
            ? 'bg-[#F1F3F8] border-[#DEE2EA] text-[#343A40]'
            : 'bg-[#121418] border-[#242830] text-[#F1F3F5]'
            }`}
        >
          <div
            className={`w-14 h-14 rounded-3xl mx-auto flex items-center justify-center border ${isLight
              ? 'bg-[#F4F5FA] border-[#DEE2EA] text-[#4B535E]'
              : 'bg-[#181b20] border-[#242830] text-[#D1D5DB]'
              }`}
          >
            <Target className="w-7 h-7" />
          </div>

          <div className="space-y-1.5 max-w-sm mx-auto">
            <h3
              className={`text-base sm:text-lg font-bold tracking-tight ${isLight ? 'text-[#343A40]' : 'text-[#F1F3F5]'
                }`}
            >
              {goals.length === 0
                ? 'Start your first savings goal'
                : filterStatus === 'active'
                  ? 'No active savings goals'
                  : 'No finished goals yet'}
            </h3>
            <p
              className={`text-xs leading-relaxed ${isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'
                }`}
            >
              {goals.length === 0
                ? 'Give your money a purpose and track your progress toward something you really want.'
                : filterStatus === 'active'
                  ? 'All set! You have no ongoing active goals currently in progress.'
                  : 'Keep saving! Goals you reach 100% will automatically appear here.'}
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleOpenCreateModal}
              className={`py-2.5 px-5 rounded-2xl font-bold text-xs shadow-md transition-all active:scale-[0.985] cursor-pointer inline-flex items-center gap-2 ${isLight
                ? 'bg-[#343A40] text-[#F8F8FF] hover:bg-[#212529]'
                : 'bg-[#F1F3F5] text-[#000000] hover:bg-white'
                }`}
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Goal</span>
            </button>
          </div>
        </div>
      )}

      {filteredGoals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {filteredGoals.map((goal) => {
            const targetVal = Number(goal.target_amount || goal.target) || 1
            const currentVal = Number(goal.current_amount || goal.current) || 0
            const remainingVal = Math.max(0, targetVal - currentVal)
            const progressPct = Math.min(100, Math.round((currentVal / targetVal) * 100))
            const isCompleted = targetVal > 0 && currentVal >= targetVal

            const isOverdue =
              !isCompleted &&
              goal.deadline &&
              new Date(goal.deadline).getTime() < Date.now()

            const formattedDeadline = goal.deadline
              ? new Date(goal.deadline).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
              : null

            return (
              <div
                key={goal.id}
                onClick={() => handleOpenDetailModal(goal)}
                className={`p-5 rounded-3xl border flex flex-col justify-between space-y-4 transition-all duration-200 cursor-pointer group hover:shadow-lg active:scale-[0.99] ${isCompleted
                  ? isLight
                    ? 'bg-[#F1F3F8] border-[#343A40] shadow-sm'
                    : 'bg-[#121418] border-[#F1F3F5]/60 shadow-sm'
                  : isLight
                    ? 'bg-[#F1F3F8] border-[#DEE2EA] hover:border-[#343A40]/30'
                    : 'bg-[#121418] border-[#242830] hover:border-[#F1F3F5]/30'
                  }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4
                        className={`text-base font-bold truncate leading-tight ${isLight ? 'text-[#343A40]' : 'text-[#F1F3F5]'
                          }`}
                      >
                        {goal.name}
                      </h4>
                      <span
                        className={`text-[11px] block mt-0.5 truncate ${isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'
                          }`}
                      >
                        {isCompleted
                          ? 'Goal 100% Achieved'
                          : isOverdue
                            ? 'Past target date'
                            : formattedDeadline
                              ? `Target: ${formattedDeadline}`
                              : 'No target date'}
                      </span>
                    </div>

                    <div className="shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${isCompleted
                          ? isLight
                            ? 'bg-[#343A40] text-[#F8F8FF] border-[#343A40]'
                            : 'bg-[#F1F3F5] text-[#000000] border-[#F1F3F5]'
                          : isOverdue
                            ? isLight
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                            : isLight
                              ? 'bg-[#F4F5FA] text-[#68707C] border-[#DEE2EA]'
                              : 'bg-[#181b20] text-[#94A3B8] border-[#242830]'
                          }`}
                      >
                        {isCompleted
                          ? '✓ Completed'
                          : isOverdue
                            ? 'Overdue'
                            : `${progressPct}%`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span
                        className={`text-lg font-bold font-mono ${isLight ? 'text-[#343A40]' : 'text-[#F1F3F5]'
                          }`}
                      >
                        ₱
                        {currentVal.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span
                        className={`text-xs ml-1 font-medium ${isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'
                          }`}
                      >
                        saved of ₱
                        {targetVal.toLocaleString('en-US', {
                          minimumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold font-mono ${isLight ? 'text-[#343A40]' : 'text-[#F1F3F5]'
                        }`}
                    >
                      {progressPct}%
                    </span>
                  </div>

                  <div
                    className={`w-full h-2.5 rounded-full overflow-hidden p-0.5 border ${isLight
                      ? 'bg-[#F4F5FA] border-[#DEE2EA]'
                      : 'bg-[#181b20] border-[#242830]'
                      }`}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${isLight ? 'bg-[#343A40]' : 'bg-[#F1F3F5]'
                        }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <span
                      className={`font-medium ${isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'
                        }`}
                    >
                      {isCompleted ? 'Goal fully funded' : 'Remaining'}
                    </span>
                    <span
                      className={`font-mono font-semibold ${isLight ? 'text-[#343A40]' : 'text-[#F1F3F5]'
                        }`}
                    >
                      {isCompleted
                        ? '₱0.00'
                        : `₱${remainingVal.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center gap-2">
                  {!isCompleted ? (
                    <>
                      <button
                        onClick={(e) => handleOpenAddMoneyModal(goal, e)}
                        className={`flex-1 py-2.5 px-4 rounded-2xl text-xs font-bold border transition-colors cursor-pointer active:scale-[0.985] flex items-center justify-center gap-1.5 ${
                          isLight
                            ? 'bg-[#343A40] text-[#F8F8FF] border-[#343A40] hover:bg-[#212529]'
                            : 'bg-[#F1F3F5] text-[#000000] border-[#F1F3F5] hover:bg-white'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Money</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenDetailModal(goal)
                        }}
                        className={`py-2.5 px-4 rounded-2xl text-xs font-semibold border transition-colors cursor-pointer ${
                          isLight
                            ? 'border-[#DEE2EA] text-[#68707C] hover:text-[#343A40] hover:bg-[#ECEEF4]'
                            : 'border-[#242830] text-[#94A3B8] hover:text-white hover:bg-[#1E222A]'
                        }`}
                      >
                        Details
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenDetailModal(goal)
                      }}
                      className={`w-full py-2.5 px-4 rounded-2xl text-xs font-semibold border transition-colors cursor-pointer text-center ${
                        isLight
                          ? 'border-[#DEE2EA] text-[#68707C] hover:text-[#343A40] hover:bg-[#ECEEF4]'
                          : 'border-[#242830] text-[#94A3B8] hover:text-white hover:bg-[#1E222A]'
                      }`}
                    >
                      Details
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {isCreateModalOpen && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 select-none animate-fade-in">
          <div
            className={`fixed inset-0 backdrop-blur-sm transition-opacity ${isLight ? 'bg-black/40' : 'bg-black/80'
              }`}
            onClick={() => setIsCreateModalOpen(false)}
          />

          <div
            className={`relative w-full max-w-md rounded-3xl border p-5 sm:p-6 shadow-2xl z-10 transition-all ${isLight
              ? 'bg-[#F1F3F8] border-[#DEE2EA] text-[#343A40]'
              : 'bg-[#121418] border-[#242830] text-[#F1F3F5]'
              }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-2xl border flex items-center justify-center ${isLight
                    ? 'bg-[#F4F5FA] border-[#DEE2EA] text-[#343A40]'
                    : 'bg-[#181b20] border-[#242830] text-[#F1F3F5]'
                    }`}
                >
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold tracking-tight">Create Savings Goal</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${isLight
                  ? 'text-[#68707C] hover:text-[#343A40] hover:bg-[#ECEEF4]'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#1E222A]'
                  }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoalSubmit} className="space-y-4 pt-4">
              {formError && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${isLight
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                    }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  className={`block text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'
                    }`}
                >
                  Goal Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. New Laptop, Emergency Fund, Vacation"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  autoFocus
                  className={`w-full py-2.5 px-4 rounded-2xl text-xs font-medium outline-none border transition-all ${isLight
                    ? 'bg-[#F4F5FA] border-[#DEE2EA] text-[#343A40] focus:border-[#343A40]'
                    : 'bg-[#181b20] border-[#242830] text-[#F1F3F5] focus:border-[#F1F3F5]'
                    }`}
                />
              </div>

              <div className="space-y-1.5">
                <label
                  className={`block text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'
                    }`}
                >
                  Target Amount (₱)
                </label>
                <div className="relative flex items-center">
                  <span
                    className={`absolute left-4 text-base font-bold font-mono ${isLight ? 'text-[#4B535E]' : 'text-[#D1D5DB]'
                      }`}
                  >
                    ₱
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    placeholder="50,000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className={`w-full py-2.5 pl-9 pr-4 rounded-2xl text-sm font-mono font-bold outline-none border transition-all ${isLight
                      ? 'bg-[#F4F5FA] border-[#DEE2EA] text-[#343A40] focus:border-[#343A40]'
                      : 'bg-[#181b20] border-[#242830] text-[#F1F3F5] focus:border-[#F1F3F5]'
                      }`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  className={`block text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'
                    }`}
                >
                  Initial Amount Saved (Optional)
                </label>
                <div className="relative flex items-center">
                  <span
                    className={`absolute left-4 text-base font-bold font-mono ${isLight ? 'text-[#4B535E]' : 'text-[#D1D5DB]'
                      }`}
                  >
                    ₱
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(e.target.value)}
                    className={`w-full py-2.5 pl-9 pr-4 rounded-2xl text-sm font-mono font-bold outline-none border transition-all ${isLight
                      ? 'bg-[#F4F5FA] border-[#DEE2EA] text-[#343A40] focus:border-[#343A40]'
                      : 'bg-[#181b20] border-[#242830] text-[#F1F3F5] focus:border-[#F1F3F5]'
                      }`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  className={`block text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'
                    }`}
                >
                  Target Date (Optional)
                </label>
                <input
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className={`w-full py-2.5 px-4 rounded-2xl text-xs font-medium outline-none border transition-all ${isLight
                    ? 'bg-[#F4F5FA] border-[#DEE2EA] text-[#343A40] focus:border-[#343A40]'
                    : 'bg-[#181b20] border-[#242830] text-[#F1F3F5] focus:border-[#F1F3F5]'
                    }`}
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className={`flex-1 py-2.5 px-4 rounded-2xl border text-xs font-semibold transition-colors cursor-pointer ${isLight
                    ? 'border-[#DEE2EA] text-[#68707C] hover:text-[#343A40]'
                    : 'border-[#242830] text-[#94A3B8] hover:text-white'
                    }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-2.5 px-4 rounded-2xl font-bold text-xs shadow-md transition-all active:scale-[0.985] cursor-pointer ${isLight
                    ? 'bg-[#343A40] text-[#F8F8FF] hover:bg-[#212529]'
                    : 'bg-[#F1F3F5] text-[#000000] hover:bg-white'
                    }`}
                >
                  {isSubmitting ? 'Saving...' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {isAddMoneyModalOpen && selectedGoal && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 select-none animate-fade-in">
          <div
            className={`fixed inset-0 backdrop-blur-sm transition-opacity ${isLight ? 'bg-black/40' : 'bg-black/80'
              }`}
            onClick={() => setIsAddMoneyModalOpen(false)}
          />

          <div
            className={`relative w-full max-w-md rounded-3xl border p-5 sm:p-6 shadow-2xl z-10 transition-all ${isLight
              ? 'bg-[#F1F3F8] border-[#DEE2EA] text-[#343A40]'
              : 'bg-[#121418] border-[#242830] text-[#F1F3F5]'
              }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-2xl border flex items-center justify-center ${isLight
                    ? 'bg-[#F4F5FA] border-[#DEE2EA] text-[#343A40]'
                    : 'bg-[#181b20] border-[#242830] text-[#F1F3F5]'
                    }`}
                >
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Add Money to Goal</h3>
                  <p
                    className={`text-xs ${isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'
                      }`}
                  >
                    {selectedGoal.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddMoneyModalOpen(false)}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${isLight
                  ? 'text-[#68707C] hover:text-[#343A40] hover:bg-[#ECEEF4]'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#1E222A]'
                  }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMoneySubmit} className="space-y-4 pt-4">
              {addMoneyError && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${isLight
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                    }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addMoneyError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  className={`block text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'
                    }`}
                >
                  Amount to Add (₱)
                </label>
                <div className="relative flex items-center">
                  <span
                    className={`absolute left-4 text-lg font-bold font-mono ${isLight ? 'text-[#4B535E]' : 'text-[#D1D5DB]'
                      }`}
                  >
                    ₱
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    placeholder="0.00"
                    value={addMoneyAmount}
                    onChange={(e) => setAddMoneyAmount(e.target.value)}
                    autoFocus
                    className={`w-full py-3 pl-10 pr-4 rounded-2xl text-xl font-mono font-bold outline-none border transition-all ${isLight
                      ? 'bg-[#F4F5FA] border-[#DEE2EA] text-[#343A40] focus:border-[#343A40]'
                      : 'bg-[#181b20] border-[#242830] text-[#F1F3F5] focus:border-[#F1F3F5]'
                      }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-1">
                {[500, 1000, 2000, 5000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAddMoneyAmount(String(preset))}
                    className={`py-1.5 px-2 rounded-xl text-xs font-mono font-semibold border transition-all cursor-pointer ${addMoneyAmount === String(preset)
                      ? isLight
                        ? 'bg-[#343A40] text-[#F8F8FF] border-[#343A40]'
                        : 'bg-[#F1F3F5] text-[#000000] border-[#F1F3F5]'
                      : isLight
                        ? 'bg-[#F4F5FA] border-[#DEE2EA] text-[#68707C] hover:bg-[#ECEEF4]'
                        : 'bg-[#181b20] border-[#242830] text-[#94A3B8] hover:bg-[#1E222A]'
                      }`}
                  >
                    +₱{preset.toLocaleString()}
                  </button>
                ))}
              </div>

              <div
                className={`p-3 rounded-2xl border space-y-1 text-xs ${isLight ? 'bg-[#F4F5FA] border-[#DEE2EA]' : 'bg-[#181b20] border-[#242830]'
                  }`}
              >
                <div className="flex justify-between">
                  <span className={isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'}>
                    Current Saved:
                  </span>
                  <span className="font-mono font-bold">
                    ₱
                    {Number(
                      selectedGoal.current_amount || selectedGoal.current || 0
                    ).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'}>
                    Target Goal:
                  </span>
                  <span className="font-mono font-bold">
                    ₱
                    {Number(
                      selectedGoal.target_amount || selectedGoal.target || 0
                    ).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddMoneyModalOpen(false)}
                  className={`flex-1 py-2.5 px-4 rounded-2xl border text-xs font-semibold transition-colors cursor-pointer ${isLight
                    ? 'border-[#DEE2EA] text-[#68707C] hover:text-[#343A40]'
                    : 'border-[#242830] text-[#94A3B8] hover:text-white'
                    }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-2.5 px-4 rounded-2xl font-bold text-xs shadow-md transition-all active:scale-[0.985] cursor-pointer ${isLight
                    ? 'bg-[#343A40] text-[#F8F8FF] hover:bg-[#212529]'
                    : 'bg-[#F1F3F5] text-[#000000] hover:bg-white'
                    }`}
                >
                  {isSubmitting ? 'Updating...' : 'Confirm Top-Up'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {isDetailModalOpen && selectedGoal && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 select-none animate-fade-in">
          <div
            className={`fixed inset-0 backdrop-blur-sm transition-opacity ${isLight ? 'bg-black/40' : 'bg-black/80'
              }`}
            onClick={() => setIsDetailModalOpen(false)}
          />

          <div
            className={`relative w-full max-w-md rounded-3xl border p-5 sm:p-6 shadow-2xl z-10 transition-all ${isLight
              ? 'bg-[#F1F3F8] border-[#DEE2EA] text-[#343A40]'
              : 'bg-[#121418] border-[#242830] text-[#F1F3F5]'
              }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-2xl border flex items-center justify-center ${isLight
                    ? 'bg-[#F4F5FA] border-[#DEE2EA] text-[#343A40]'
                    : 'bg-[#181b20] border-[#242830] text-[#F1F3F5]'
                    }`}
                >
                </div>
                <h3 className="text-base font-bold tracking-tight">Goal Details</h3>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`p-1.5 rounded-xl transition-colors cursor-pointer ${isEditing
                    ? isLight
                      ? 'bg-[#343A40] text-[#F8F8FF]'
                      : 'bg-[#F1F3F5] text-[#000000]'
                    : isLight
                      ? 'text-[#68707C] hover:text-[#343A40] hover:bg-[#ECEEF4]'
                      : 'text-[#94A3B8] hover:text-white hover:bg-[#1E222A]'
                    }`}
                  title="Edit Goal"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteGoalClick(selectedGoal)}
                  className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                  title="Delete Goal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className={`p-1.5 rounded-xl transition-colors cursor-pointer ${isLight
                    ? 'text-[#68707C] hover:text-[#343A40] hover:bg-[#ECEEF4]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#1E222A]'
                    }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {!isEditing ? (
              <div className="space-y-4 pt-4">
                <div className="space-y-1">
                  <h4
                    className={`text-lg font-bold ${isLight ? 'text-[#343A40]' : 'text-[#F1F3F5]'
                      }`}
                  >
                    {selectedGoal.name}
                  </h4>
                  <p
                    className={`text-xs ${isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'
                      }`}
                  >
                    Created:{' '}
                    {selectedGoal.created_at
                      ? new Date(selectedGoal.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                      : 'Recently'}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-2xl border space-y-3 ${isLight ? 'bg-[#F4F5FA] border-[#DEE2EA]' : 'bg-[#181b20] border-[#242830]'
                    }`}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className={isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'}>
                      Current Saved:
                    </span>
                    <span className="font-mono font-bold text-sm">
                      ₱
                      {Number(
                        selectedGoal.current_amount || selectedGoal.current || 0
                      ).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className={isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'}>
                      Target Amount:
                    </span>
                    <span className="font-mono font-bold text-sm">
                      ₱
                      {Number(
                        selectedGoal.target_amount || selectedGoal.target || 0
                      ).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className={isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'}>
                      Remaining:
                    </span>
                    <span className="font-mono font-bold text-sm">
                      ₱
                      {Math.max(
                        0,
                        (Number(selectedGoal.target_amount) || 0) -
                        (Number(selectedGoal.current_amount) || 0)
                      ).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className={isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'}>
                      Target Date:
                    </span>
                    <span className="font-semibold text-xs">
                      {selectedGoal.deadline
                        ? new Date(selectedGoal.deadline).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                        : 'No target date set'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setIsDetailModalOpen(false)
                      handleOpenAddMoneyModal(selectedGoal)
                    }}
                    className={`w-full py-3 px-4 rounded-2xl font-bold text-xs shadow-md transition-all active:scale-[0.985] cursor-pointer flex items-center justify-center gap-2 ${isLight
                      ? 'bg-[#343A40] text-[#F8F8FF] hover:bg-[#212529]'
                      : 'bg-[#F1F3F5] text-[#000000] hover:bg-white'
                      }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Money Toward Goal</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateGoalSubmit} className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <label
                    className={`block text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'
                      }`}
                  >
                    Goal Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={`w-full py-2.5 px-4 rounded-2xl text-xs font-medium outline-none border transition-all ${isLight
                      ? 'bg-[#F4F5FA] border-[#DEE2EA] text-[#343A40]'
                      : 'bg-[#181b20] border-[#242830] text-[#F1F3F5]'
                      }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    className={`block text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'
                      }`}
                  >
                    Target Amount (₱)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={editTarget}
                    onChange={(e) => setEditTarget(e.target.value)}
                    className={`w-full py-2.5 px-4 rounded-2xl text-sm font-mono font-bold outline-none border transition-all ${isLight
                      ? 'bg-[#F4F5FA] border-[#DEE2EA] text-[#343A40]'
                      : 'bg-[#181b20] border-[#242830] text-[#F1F3F5]'
                      }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    className={`block text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'
                      }`}
                  >
                    Target Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className={`w-full py-2.5 px-4 rounded-2xl text-xs font-medium outline-none border transition-all ${isLight
                      ? 'bg-[#F4F5FA] border-[#DEE2EA] text-[#343A40]'
                      : 'bg-[#181b20] border-[#242830] text-[#F1F3F5]'
                      }`}
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className={`flex-1 py-2.5 px-4 rounded-2xl border text-xs font-semibold transition-colors cursor-pointer ${isLight
                      ? 'border-[#DEE2EA] text-[#68707C]'
                      : 'border-[#242830] text-[#94A3B8]'
                      }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 py-2.5 px-4 rounded-2xl font-bold text-xs shadow-md transition-all active:scale-[0.985] cursor-pointer ${isLight
                      ? 'bg-[#343A40] text-[#F8F8FF]'
                      : 'bg-[#F1F3F5] text-[#000000]'
                      }`}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}

      {goalToDelete && createPortal(
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 select-none animate-fade-in">
          <div
            className={`fixed inset-0 backdrop-blur-sm transition-opacity ${
              isLight ? 'bg-black/40' : 'bg-black/80'
            }`}
            onClick={() => setGoalToDelete(null)}
          />

          <div
            className={`relative w-full max-w-sm rounded-3xl border p-5 sm:p-6 shadow-2xl z-10 transition-all text-center space-y-4 ${
              isLight
                ? 'bg-[#F1F3F8] border-[#DEE2EA] text-[#343A40]'
                : 'bg-[#121418] border-[#242830] text-[#F1F3F5]'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-rose-500/15 text-rose-500 border border-rose-500/30">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold tracking-tight">Delete Savings Goal?</h3>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'}`}>
                Are you sure you want to delete <span className="font-semibold text-current">"{goalToDelete.name}"</span>? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setGoalToDelete(null)}
                className={`flex-1 py-2.5 px-4 rounded-2xl border text-xs font-semibold transition-colors cursor-pointer ${
                  isLight
                    ? 'border-[#DEE2EA] text-[#68707C] hover:text-[#343A40]'
                    : 'border-[#242830] text-[#94A3B8] hover:text-white'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => confirmDeleteGoal(goalToDelete.id)}
                className="flex-1 py-2.5 px-4 rounded-2xl font-bold text-xs shadow-md bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer active:scale-[0.985]"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Goal'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
