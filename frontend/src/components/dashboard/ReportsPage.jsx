import React, { useState, useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from 'lucide-react'
import ScrollFadeIn from '../ui/ScrollFadeIn'
import BalanceTrendChart from './BalanceTrendChart'

const CATEGORY_COLORS = [
  '#FF453A',
  '#FF9F0A',
  '#FFD60A',
  '#0A84FF',
  '#BF5AF2',
  '#64D2FF',
  '#32D74B',
  '#AC8E68',
]

export default function ReportsPage({
  theme = 'dark',
  transactions = [],
  onNavigateTab,
}) {
  const isLight = theme === 'light'

  const [periodFilter, setPeriodFilter] = useState('this_month')
  const [breakdownMode, setBreakdownMode] = useState('amount')

  const filteredTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return []

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    return transactions.filter((tx) => {
      const txDate = new Date(tx.transaction_date || tx.created_at)
      if (isNaN(txDate.getTime())) return false

      if (periodFilter === 'this_week') {
        const day = startOfDay.getDay()
        const diffToMon = startOfDay.getDate() - day + (day === 0 ? -6 : 1)
        const monday = new Date(startOfDay.setDate(diffToMon))
        return txDate >= monday
      }

      if (periodFilter === 'this_month') {
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        return txDate >= firstDayOfMonth
      }

      if (periodFilter === '30_days') {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return txDate >= thirtyDaysAgo
      }

      if (periodFilter === 'this_year') {
        const firstDayOfYear = new Date(now.getFullYear(), 0, 1)
        return txDate >= firstDayOfYear
      }

      return true
    })
  }, [transactions, periodFilter])

  const metrics = useMemo(() => {
    let totalBalance = 0
    transactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0
      if (tx.type === 'deposit' || tx.type === 'income') totalBalance += amt
      if (tx.type === 'withdrawal' || tx.type === 'expense') totalBalance -= amt
    })

    let periodIncome = 0
    let periodExpenses = 0

    filteredTransactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0
      if (tx.type === 'deposit' || tx.type === 'income') periodIncome += amt
      if (tx.type === 'withdrawal' || tx.type === 'expense') periodExpenses += amt
    })

    const netFlow = periodIncome - periodExpenses

    return {
      totalBalance,
      periodIncome,
      periodExpenses,
      netFlow,
    }
  }, [transactions, filteredTransactions])


  const categoryData = useMemo(() => {
    const catMap = {}
    let totalCatExpense = 0

    filteredTransactions.forEach((tx) => {
      if (tx.type === 'withdrawal' || tx.type === 'expense') {
        const amt = Number(tx.amount) || 0
        const cat = tx.category?.trim() || 'Others'
        catMap[cat] = (catMap[cat] || 0) + amt
        totalCatExpense += amt
      }
    })

    const sortedCats = Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    if (sortedCats.length === 0) return { list: [], total: 0 }

    let finalCatList = sortedCats
    if (sortedCats.length > 6) {
      const top5 = sortedCats.slice(0, 5)
      const rest = sortedCats.slice(5)
      const othersVal = rest.reduce((acc, c) => acc + c.value, 0)
      finalCatList = [...top5, { name: 'Others', value: othersVal }]
    }

    const listWithPct = finalCatList.map((item, index) => {
      const pct = totalCatExpense > 0 ? (item.value / totalCatExpense) * 100 : 0
      return {
        ...item,
        percentage: pct.toFixed(1),
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      }
    })

    return { list: listWithPct, total: totalCatExpense }
  }, [filteredTransactions])

  const incomeVsExpenseData = useMemo(() => {
    return [
      { name: 'Income', amount: metrics.periodIncome, fill: '#00C853' },
      { name: 'Expenses', amount: metrics.periodExpenses, fill: '#FF3B30' },
    ]
  }, [metrics])

  const summaryMetrics = useMemo(() => {
    if (filteredTransactions.length === 0) {
      return {
        bestSpendingDay: 'None',
        highestIncome: 'None',
        totalTx: 0,
        avgDailyExpense: 0,
        savingsRate: 0,
      }
    }

    const dailyExpenses = {}
    let maxIncomeObj = { dateStr: 'None', amount: 0 }

    filteredTransactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0
      const txDate = new Date(tx.transaction_date || tx.created_at)
      const dateKey = txDate.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
      })

      if (tx.type === 'withdrawal' || tx.type === 'expense') {
        dailyExpenses[dateKey] = (dailyExpenses[dateKey] || 0) + amt
      }

      if (tx.type === 'deposit' || tx.type === 'income') {
        if (amt > maxIncomeObj.amount) {
          maxIncomeObj = { dateStr: dateKey, amount: amt }
        }
      }
    })

    let bestDayStr = 'None'
    let lowestExpense = Infinity
    Object.entries(dailyExpenses).forEach(([dateStr, amt]) => {
      if (amt > 0 && amt < lowestExpense) {
        lowestExpense = amt
        bestDayStr = `${dateStr} · ₱${amt.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      }
    })
    if (lowestExpense === Infinity) bestDayStr = 'No expense recorded'

    const highestIncomeStr =
      maxIncomeObj.amount > 0
        ? `${maxIncomeObj.dateStr} · ₱${maxIncomeObj.amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        : 'No income recorded'

    let periodDays = 30
    if (periodFilter === 'this_week') periodDays = 7
    if (periodFilter === 'this_month') periodDays = new Date().getDate()
    if (periodFilter === 'this_year') periodDays = Math.max(1, Math.ceil((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24)))

    const avgDailyExpense = metrics.periodExpenses / Math.max(1, periodDays)

    const savingsRate =
      metrics.periodIncome > 0
        ? Math.max(
            0,
            ((metrics.periodIncome - metrics.periodExpenses) / metrics.periodIncome) * 100
          )
        : 0

    return {
      bestSpendingDay: bestDayStr,
      highestIncome: highestIncomeStr,
      totalTx: filteredTransactions.length,
      avgDailyExpense,
      savingsRate: savingsRate.toFixed(1),
    }
  }, [filteredTransactions, metrics, periodFilter])

  const recentTransactionsList = useMemo(() => {
    return [...filteredTransactions]
      .sort((a, b) => {
        const dA = new Date(a.transaction_date || a.created_at).getTime()
        const dB = new Date(b.transaction_date || b.created_at).getTime()
        return dB - dA
      })
      .slice(0, 5)
  }, [filteredTransactions])



  return (
    <div className="w-full space-y-5 select-none pb-12 animate-fade-in">
      <div className="pt-1">
        <h2
          className={`text-xl sm:text-2xl font-bold tracking-tight ${
            isLight ? 'text-[#343A40]' : 'text-[#F1F3F5]'
          }`}
        >
          Reports
        </h2>
        <p
          className={`text-xs mt-0.5 ${
            isLight ? 'text-[#68707C] font-medium' : 'text-[#94A3B8]'
          }`}
        >
          Your financial overview and insights.
        </p>
      </div>

      <ScrollFadeIn delay={100}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Total Balance */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
              isLight
                ? 'bg-[#F1F3F8] border-[#DEE2EA] text-[#343A40]'
                : 'bg-[#121418] border-[#242830] text-[#F1F3F5]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'
                }`}
              >
                Total Balance
              </span>
              <Wallet className="w-4 h-4 opacity-50" />
            </div>
            <div className="mt-2">
              <span className="text-base sm:text-lg md:text-xl font-bold font-mono tracking-tight block truncate">
                ₱
                {metrics.totalBalance.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* Card 2: Income */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
              isLight
                ? 'bg-[#F1F3F8] border-[#DEE2EA] text-[#343A40]'
                : 'bg-[#121418] border-[#242830] text-[#F1F3F5]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'
                }`}
              >
                Income
              </span>
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-[#00C853]">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-base sm:text-lg md:text-xl font-bold font-mono tracking-tight block truncate text-[#00C853]">
                +₱
                {metrics.periodIncome.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* Card 3: Expenses */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
              isLight
                ? 'bg-[#F1F3F8] border-[#DEE2EA] text-[#343A40]'
                : 'bg-[#121418] border-[#242830] text-[#F1F3F5]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'
                }`}
              >
                Expenses
              </span>
              <div className="w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center text-[#FF3B30]">
                <ArrowDownRight className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-base sm:text-lg md:text-xl font-bold font-mono tracking-tight block truncate text-[#FF3B30]">
                -₱
                {metrics.periodExpenses.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* Card 4: Net Flow */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
              isLight
                ? 'bg-[#F1F3F8] border-[#DEE2EA] text-[#343A40]'
                : 'bg-[#121418] border-[#242830] text-[#F1F3F5]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'
                }`}
              >
                Net Flow
              </span>
              <TrendingUp className="w-4 h-4 text-[#00C853]" />
            </div>
            <div className="mt-2">
              <span
                className={`text-base sm:text-lg md:text-xl font-bold font-mono tracking-tight block truncate ${
                  metrics.netFlow >= 0 ? 'text-[#00C853]' : 'text-[#FF3B30]'
                }`}
              >
                {metrics.netFlow >= 0 ? '+' : '-'}₱
                {Math.abs(metrics.netFlow).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      </ScrollFadeIn>

      <ScrollFadeIn delay={150}>
        <BalanceTrendChart theme={theme} transactions={transactions} />
      </ScrollFadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* COLUMN 1: EXPENSE BREAKDOWN */}
        <ScrollFadeIn delay={200}>
          <div
            className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all h-full flex flex-col justify-between ${
              isLight
                ? 'bg-[#F1F3F8] border-[#DEE2EA] text-[#343A40]'
                : 'bg-[#121418] border-[#242830] text-[#F1F3F5]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold tracking-tight">Expense Breakdown</h3>
                  <Info className="w-3.5 h-3.5 opacity-50" />
                </div>
                {/* Amount / % Switcher */}
                <div
                  className={`flex items-center p-0.5 rounded-xl border ${
                    isLight ? 'bg-[#F4F5FA] border-[#DEE2EA]' : 'bg-[#181b20] border-[#242830]'
                  }`}
                >
                  <button
                    onClick={() => setBreakdownMode('amount')}
                    className={`py-0.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      breakdownMode === 'amount'
                        ? isLight
                          ? 'bg-[#343A40] text-[#F8F8FF]'
                          : 'bg-[#F1F3F5] text-[#000000]'
                        : isLight
                        ? 'text-[#68707C]'
                        : 'text-[#94A3B8]'
                    }`}
                  >
                    Amount
                  </button>
                  <button
                    onClick={() => setBreakdownMode('percent')}
                    className={`py-0.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      breakdownMode === 'percent'
                        ? isLight
                          ? 'bg-[#343A40] text-[#F8F8FF]'
                          : 'bg-[#F1F3F5] text-[#000000]'
                        : isLight
                        ? 'text-[#68707C]'
                        : 'text-[#94A3B8]'
                    }`}
                  >
                    %
                  </button>
                </div>
              </div>

              {/* Donut Chart & Category List Legend */}
              {categoryData.list.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                  {/* Recharts Donut */}
                  <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData.list}
                          cx="50%"
                          cy="50%"
                          innerRadius={44}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {categoryData.list.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Donut Center Display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      <span className="text-xs font-bold font-mono block max-w-[80px] truncate">
                        ₱
                        {Math.round(categoryData.total).toLocaleString()}
                      </span>
                      <span
                        className={`text-[8px] font-medium block uppercase tracking-wider ${
                          isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'
                        }`}
                      >
                        Total Expenses
                      </span>
                    </div>
                  </div>

                  {/* Category Legend List */}
                  <div className="flex-1 w-full space-y-1.5 text-xs">
                    {categoryData.list.map((cat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between font-medium"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="truncate text-xs">{cat.name}</span>
                        </div>
                        <span className="font-mono font-semibold text-xs shrink-0">
                          {breakdownMode === 'amount'
                            ? `₱${cat.value.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`
                            : `${cat.percentage}%`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-44 flex items-center justify-center text-xs opacity-50 text-center">
                  No expense records for this period.
                </div>
              )}
            </div>
          </div>
        </ScrollFadeIn>

        {/* COLUMN 2: INCOME VS EXPENSES COMPARISON */}
        <ScrollFadeIn delay={250}>
          <div
            className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all h-full flex flex-col justify-between ${
              isLight
                ? 'bg-[#F1F3F8] border-[#DEE2EA] text-[#343A40]'
                : 'bg-[#121418] border-[#242830] text-[#F1F3F5]'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5 pb-3">
                <h3 className="text-sm font-bold tracking-tight">Income vs Expenses</h3>
                <Info className="w-3.5 h-3.5 opacity-50" />
              </div>

              {/* Bar Comparison Chart */}
              <div className="h-48 pt-2 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={incomeVsExpenseData}
                    margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="name"
                      stroke={isLight ? '#68707C' : '#94A3B8'}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke={isLight ? '#68707C' : '#94A3B8'}
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `₱${val / 1000}K`}
                    />
                    <Tooltip
                      formatter={(val) => [
                        `₱${Number(val).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}`,
                        'Amount',
                      ]}
                      contentStyle={{
                        backgroundColor: '#181b20',
                        borderColor: '#242830',
                        borderRadius: '12px',
                        color: '#F1F3F5',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                      }}
                    />
                    <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={40}>
                      {incomeVsExpenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </ScrollFadeIn>

        {/* COLUMN 3: SUMMARY */}
        <ScrollFadeIn delay={300}>
          <div
            className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all h-full flex flex-col justify-between ${
              isLight
                ? 'bg-[#F1F3F8] border-[#DEE2EA] text-[#343A40]'
                : 'bg-[#121418] border-[#242830] text-[#F1F3F5]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-3">
                <h3 className="text-sm font-bold tracking-tight">Summary</h3>
              </div>

              {/* Derived Statistics List */}
              <div className="space-y-3 pt-1 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
                  <span className={isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'}>
                    Best Spending Day
                  </span>
                  <span className="font-semibold font-mono text-right truncate max-w-[170px]">
                    {summaryMetrics.bestSpendingDay}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
                  <span className={isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'}>
                    Highest Income
                  </span>
                  <span className="font-semibold font-mono text-emerald-400 text-right truncate max-w-[170px]">
                    {summaryMetrics.highestIncome}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
                  <span className={isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'}>
                    Total Transactions
                  </span>
                  <span className="font-bold font-mono text-sm">
                    {summaryMetrics.totalTx}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
                  <span className={isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'}>
                    Avg Daily Expense
                  </span>
                  <span className="font-semibold font-mono">
                    ₱
                    {summaryMetrics.avgDailyExpense.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <span className={isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'}>
                    Savings Rate
                  </span>
                  <span className="font-bold font-mono text-sm text-[#00C853]">
                    {summaryMetrics.savingsRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ScrollFadeIn>
      </div>

      <ScrollFadeIn delay={350}>
        <div
          className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all ${
            isLight
              ? 'bg-[#F1F3F8] border-[#DEE2EA] text-[#343A40]'
              : 'bg-[#121418] border-[#242830] text-[#F1F3F5]'
          }`}
        >
          <div className="flex items-center justify-between pb-3">
            <h3 className="text-sm font-bold tracking-tight">Recent Transactions</h3>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('history')}
                className={`text-xs font-bold transition-colors cursor-pointer ${
                  isLight
                    ? 'text-[#68707C] hover:text-[#343A40]'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                View All
              </button>
            )}
          </div>

          {recentTransactionsList.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto pt-1">
                <table className="w-full text-left text-xs font-medium border-collapse">
                  <thead>
                    <tr
                      className={`border-b text-[10px] uppercase font-bold tracking-wider ${
                        isLight
                          ? 'border-[#DEE2EA] text-[#68707C]'
                          : 'border-[#242830] text-[#94A3B8]'
                      }`}
                    >
                      <th className="pb-2.5">Description</th>
                      <th className="pb-2.5">Type</th>
                      <th className="pb-2.5">Category</th>
                      <th className="pb-2.5">Date</th>
                      <th className="pb-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {recentTransactionsList.map((tx) => {
                      const isIncome = tx.type === 'deposit' || tx.type === 'income'
                      const amt = Number(tx.amount) || 0
                      const txDate = new Date(tx.transaction_date || tx.created_at)

                      return (
                        <tr key={tx.id || Math.random()}>
                          <td className="py-3 font-semibold truncate max-w-[180px]">
                            {tx.description || tx.category || 'Transaction'}
                          </td>
                          <td className="py-3 capitalize opacity-80">
                            {tx.type}
                          </td>
                          <td className="py-3 opacity-80">
                            {tx.category || 'General'}
                          </td>
                          <td className="py-3 opacity-80 font-mono text-[11px]">
                            {isNaN(txDate.getTime())
                              ? 'Recent'
                              : txDate.toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: '2-digit',
                                  year: 'numeric',
                                })}
                          </td>
                          <td
                            className={`py-3 text-right font-mono font-bold ${
                              isIncome ? 'text-[#00C853]' : 'text-[#FF3B30]'
                            }`}
                          >
                            {isIncome ? '+' : '-'}₱
                            {amt.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Scannable Row View */}
              <div className="sm:hidden space-y-2.5 pt-1">
                {recentTransactionsList.map((tx) => {
                  const isIncome = tx.type === 'deposit' || tx.type === 'income'
                  const amt = Number(tx.amount) || 0
                  const txDate = new Date(tx.transaction_date || tx.created_at)

                  return (
                    <div
                      key={tx.id || Math.random()}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                        isLight
                          ? 'bg-[#F4F5FA] border-[#DEE2EA]'
                          : 'bg-[#181b20] border-[#242830]'
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <span className="font-bold text-xs block truncate">
                          {tx.description || tx.category || 'Transaction'}
                        </span>
                        <span
                          className={`text-[10px] block truncate ${
                            isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'
                          }`}
                        >
                          {tx.type} · {tx.category || 'General'} ·{' '}
                          {isNaN(txDate.getTime())
                            ? 'Recent'
                            : txDate.toLocaleDateString('en-US', {
                                month: 'short',
                                day: '2-digit',
                              })}
                        </span>
                      </div>
                      <span
                        className={`font-mono font-bold text-xs shrink-0 ${
                          isIncome ? 'text-[#00C853]' : 'text-[#FF3B30]'
                        }`}
                      >
                        {isIncome ? '+' : '-'}₱
                        {amt.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="p-6 text-center text-xs opacity-50">
              No recent transactions found.
            </div>
          )}
        </div>
      </ScrollFadeIn>

    </div>
  )
}