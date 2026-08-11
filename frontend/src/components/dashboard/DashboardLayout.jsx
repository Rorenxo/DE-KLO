import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import AtmCard from './AtmCard'
import ActionButtons from './ActionButtons'
import FinancialOverview from './FinancialOverview'
import MoneyFlowChart from './MoneyFlowChart'
import RightPanel from './RightPanel'
import BottomNavigation from './BottomNavigation'
import TransactionModal from './TransactionModal'
import TransactionHistoryPage from './TransactionHistoryPage'
import { authService } from '../../services/authService'
import { transactionService } from '../../services/transactionService'
import { profileService } from '../../services/profileService'
import { savingsService } from '../../services/savingsService'

function computeChartDatasets(txList = []) {
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weekOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const weekMap = {}
  weekOrder.forEach((day) => {
    weekMap[day] = { label: day, income: 0, expense: 0 }
  })

  const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthMap = {}
  monthsOrder.forEach((m) => {
    monthMap[m] = { label: m, income: 0, expense: 0 }
  })

  const currentYear = new Date().getFullYear()
  const yearsOrder = Array.from({ length: 5 }, (_, i) => String(currentYear + i))
  const yearMap = {}
  yearsOrder.forEach((y) => {
    yearMap[y] = { label: y, income: 0, expense: 0 }
  })

  txList.forEach((tx) => {
    const amt = Number(tx.amount) || 0
    const txDate = new Date(tx.transaction_date || tx.created_at)
    if (isNaN(txDate.getTime())) return

    const dayName = weekDays[txDate.getDay()]
    const monthName = monthsOrder[txDate.getMonth()]
    const yearStr = String(txDate.getFullYear())

    const isIncome = tx.type === 'deposit' || tx.type === 'income'

    if (weekMap[dayName]) {
      if (isIncome) weekMap[dayName].income += amt
      else weekMap[dayName].expense += amt
    }

    if (monthMap[monthName]) {
      if (isIncome) monthMap[monthName].income += amt
      else monthMap[monthName].expense += amt
    }

    if (yearMap[yearStr]) {
      if (isIncome) yearMap[yearStr].income += amt
      else yearMap[yearStr].expense += amt
    }
  })

  return {
    'Per Week': weekOrder.map((day) => weekMap[day]),
    'Per Month': monthsOrder.map((m) => monthMap[m]),
    'Per Year': yearsOrder.map((y) => yearMap[y]),
  }
}

export default function DashboardLayout({ user, onLockApp, onLogout }) {
  const [activeTab, setActiveTab] = useState('home')
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('deklo_theme') || 'dark'
    } catch {
      return 'dark'
    }
  })

  const [userProfile, setUserProfile] = useState(null)
  const userId = user?.id || 'guest'
  const cardInfo = authService.getUserCardInfo(user)

  // Online transactions state
  const [transactions, setTransactions] = useState([])
  const [isTxLoading, setIsTxLoading] = useState(false)
  const [pendingSyncCount, setPendingSyncCount] = useState(0)
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [hasSyncError, setHasSyncError] = useState(false)
  const [goalsList, setGoalsList] = useState([])

  // Dynamic Financial Metrics
  const [balance, setBalance] = useState(0)
  const [income, setIncome] = useState(0)
  const [expenses, setExpenses] = useState(0)
  const [savings, setSavings] = useState(0)

  // Transaction Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState('deposit')

  // Dynamic Cash Flow Chart Datasets State
  const [chartData, setChartData] = useState(() => computeChartDatasets([]))

  // 1. Load online profile, transactions, and goals on mount.
  useEffect(() => {
    if (!userId || userId === 'guest') return

    if (user && user.id) {
      profileService.ensureProfile(user).then((prof) => {
        if (prof) setUserProfile(prof)
      }).catch((err) => console.error('Profile load error:', err))
    }

    const refreshTransactions = async () => {
      setIsTxLoading(true)
      const txList = await transactionService.getTransactions(userId)
      setTransactions(txList || [])
      const metrics = transactionService.calculateMetrics(txList || [])
      setBalance(metrics.balance)
      setIncome(metrics.totalIncome)
      setExpenses(metrics.totalExpenses)

      const dynamicChart = computeChartDatasets(txList || [])
      setChartData(dynamicChart)

      setIsTxLoading(false)
    }

    refreshTransactions().catch((err) => {
      console.error('Transactions load error:', err)
      setIsTxLoading(false)
    })

    const refreshGoals = async () => {
      const gList = await savingsService.getGoals(userId)
      setGoalsList(gList || [])
      const totalGoalCurrent = (gList || []).reduce((acc, g) => acc + (Number(g.current_amount) || 0), 0)
      setSavings(totalGoalCurrent)
    }
    refreshGoals().catch((err) => console.error('Goals load error:', err))
  }, [userId, user])

  useEffect(() => {
    try {
      localStorage.setItem('deklo_theme', theme)
    } catch (err) {
      console.warn('Theme preference unavailable:', err)
    }

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

  const fallbackCardInfo = authService.getUserCardInfo(user)
  const cardNumber = userProfile?.card_number || fallbackCardInfo.cardNumber
  const cardMasked = userProfile?.card_number
    ? `•••• •••• •••• ${userProfile.card_number.slice(-4)}`
    : fallbackCardInfo.cardMasked

  const ctdDate = userProfile?.ctd_date || fallbackCardInfo.ctdDate
  const userName = userProfile?.nickname || user?.user_metadata?.nickname || user?.email?.split('@')[0] || 'Lorenxo'

  const handleOpenDeposit = () => {
    setModalType('deposit')
    setIsModalOpen(true)
  }

  const handleOpenWithdraw = () => {
    setModalType('withdraw')
    setIsModalOpen(true)
  }

  const handleConfirmTransaction = async (amount, note) => {
    const txType = modalType === 'deposit' ? 'deposit' : 'withdrawal'

    try {
      const createdRecord = await transactionService.createTransaction({
        userId,
        type: txType,
        amount,
        category: note || (txType === 'deposit' ? 'Deposit' : 'Withdrawal'),
        description: note || '',
      })

      if (createdRecord) {
        const updatedList = await transactionService.getTransactions(userId)
        setTransactions(updatedList)

        const metrics = transactionService.calculateMetrics(updatedList)
        setBalance(metrics.balance)
        setIncome(metrics.totalIncome)
        setExpenses(metrics.totalExpenses)

        const dynamicChart = computeChartDatasets(updatedList)
        setChartData(dynamicChart)

        authService.updateUserData(userId, {
          balance: metrics.balance,
          income: metrics.totalIncome,
          expenses: metrics.totalExpenses,
          savings,
        })
      }
    } catch (err) {
      console.error('Transaction creation failed:', err)
      throw err
    }
    return 'online'
  }

  const overviewData = {
    balance: `₱${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    income: `₱${income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    incomeGrowth: '0%',
    savings: `₱${savings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    savingsGrowth: '0%',
    expenses: `₱${expenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    expensesGrowth: '0%',
  }

  const formattedCardBalance = `₱${balance.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

  return (
    <div
      className={`min-h-dvh lg:h-dvh lg:max-h-dvh w-full transition-colors duration-300 flex flex-col lg:flex-row select-none overflow-x-hidden lg:overflow-hidden ${theme === 'light' ? 'bg-[#F8F8FF] text-[#343A40]' : 'bg-[#000000] text-[#F1F3F5]'
        }`}
    >
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
            user={user}
            userProfile={userProfile}
            cardInfo={cardInfo}
            onLogout={onLogout}
            onProfileUpdated={(updatedProf) => setUserProfile(updatedProf)}
            pendingSyncCount={pendingSyncCount}
            isOnline={isOnline}
            isSyncing={isSyncing}
            hasSyncError={hasSyncError}
          />
        </div>

        <div className="flex-1 flex flex-col xl:flex-row p-4 sm:p-6 md:p-8 lg:p-6 gap-6 sm:gap-8 lg:gap-6 pb-20 md:pb-24 lg:pb-6 items-start">
          <main className="flex-1 min-w-0 space-y-6 sm:space-y-8 lg:space-y-6">
            {activeTab === 'home' && (
              <div className="space-y-6 sm:space-y-8 lg:space-y-6 animate-fade-in">
                <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-6 sm:gap-8 lg:gap-6">
                  <div className="w-full max-w-[500px] sm:max-w-[540px] md:max-w-[560px] lg:max-w-[460px] mx-auto lg:mx-0 shrink-0">
                    <AtmCard
                      userName={userName}
                      balanceAmount={formattedCardBalance}
                      accountIdFull={cardNumber}
                      accountIdMasked={cardMasked}
                      createdDate={ctdDate}
                    />
                  </div>

                  <div className="w-full max-w-[500px] sm:max-w-[640px] md:max-w-[720px] lg:max-w-none mx-auto lg:mx-0 flex-1 flex flex-col justify-center">
                    <ActionButtons
                      onDeposit={handleOpenDeposit}
                      onWithdraw={handleOpenWithdraw}
                      theme={theme}
                    />
                  </div>
                </div>

                <div className="xl:hidden pt-1">
                  <FinancialOverview
                    theme={theme}
                    transactions={transactions}
                    savingsAmount={savings}
                  />
                </div>

                <div className="pt-1">
                  <MoneyFlowChart theme={theme} customDatasets={chartData} />
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <TransactionHistoryPage
                theme={theme}
                transactions={transactions}
                loading={isTxLoading}
                onRefresh={async () => {
                  setIsTxLoading(true)
                  const updated = await transactionService.getTransactions(userId)
                  setTransactions(updated)
                  const metrics = transactionService.calculateMetrics(updated)
                  setBalance(metrics.balance)
                  setIncome(metrics.totalIncome)
                  setExpenses(metrics.totalExpenses)

                  const dynamicChart = computeChartDatasets(updated)
                  setChartData(dynamicChart)

                  setIsTxLoading(false)
                }}
                onAddTransaction={handleOpenDeposit}
                onDeleteTransaction={async (txId) => {
                  await transactionService.deleteTransaction(txId, userId)
                  const updated = await transactionService.getTransactions(userId)
                  setTransactions(updated)
                  const metrics = transactionService.calculateMetrics(updated)
                  setBalance(metrics.balance)
                  setIncome(metrics.totalIncome)
                  setExpenses(metrics.totalExpenses)

                  const dynamicChart = computeChartDatasets(updated)
                  setChartData(dynamicChart)
                }}
              />
            )}

            {activeTab !== 'home' && activeTab !== 'history' && (
              <div
                className={`p-8 text-center rounded-2xl border animate-fade-in my-8 ${theme === 'light'
                  ? 'bg-white border-slate-200 shadow-sm'
                  : 'bg-[#24292e]/40 border-[#4a5156]/30'
                  }`}
              >
                <h3 className="text-lg font-bold uppercase tracking-wider">
                  {activeTab} Space
                </h3>
                <p className="text-xs text-[#808a92] mt-2">
                  Dedicated {activeTab} experience under construction.
                </p>
              </div>
            )}
          </main>

          <RightPanel
            theme={theme}
            userId={userId}
            transactions={transactions}
            savingsAmount={savings}
            goals={goalsList}
            onGoalCreated={async () => {
              const updatedGoals = await savingsService.getGoals(userId)
              setGoalsList(updatedGoals)
              const totalCurrent = (updatedGoals || []).reduce((acc, g) => acc + (Number(g.current_amount) || 0), 0)
              setSavings(totalCurrent)
            }}
          />
        </div>
      </div>

      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
      />

      {isModalOpen && (
        <TransactionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          type={modalType}
          currentBalance={balance}
          onConfirm={handleConfirmTransaction}
          theme={theme}
        />
      )}
    </div>
  )
}
