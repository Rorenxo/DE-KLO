import React, { useMemo } from 'react'
import {
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  PieChart as PieChartIcon,
  CheckCircle2,
  Wallet,
  Activity,
  Layers,
  Zap,
  TrendingDown,
} from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'
import ScrollFadeIn from '../ui/ScrollFadeIn'

export default function InsightsPage({
  theme = 'dark',
  transactions = [],
  onNavigateTab,
}) {
  const isLight = theme === 'light'

  const metrics = useMemo(() => {
    const defaultData = [
      { id: '1', type: 'deposit', amount: 5520, category: 'Income', transaction_date: '2026-08-01' },
      { id: '2', type: 'withdrawal', amount: 2690, category: 'Withdrawal', transaction_date: '2026-08-05' },
      { id: '3', type: 'expense', amount: 500, category: 'Scatter', transaction_date: '2026-08-08' },
      { id: '4', type: 'expense', amount: 500, category: 'Food', transaction_date: '2026-08-10' },
    ]

    const txList = transactions && transactions.length > 0 ? transactions : defaultData

    let totalIncome = 0
    let totalExpenses = 0
    const categoryMap = {}
    let largestExpenseObj = { category: 'None', amount: 0 }

    txList.forEach((tx) => {
      const amt = Number(tx.amount) || 0
      const isIncome = tx.type === 'deposit' || tx.type === 'income'
      const isExpense = tx.type === 'withdrawal' || tx.type === 'expense'

      if (isIncome) {
        totalIncome += amt
      } else if (isExpense) {
        totalExpenses += amt
        const cat = tx.category || (tx.type === 'withdrawal' ? 'Withdrawal' : 'Expense')
        categoryMap[cat] = (categoryMap[cat] || 0) + amt

        if (amt > largestExpenseObj.amount) {
          largestExpenseObj = { category: cat, amount: amt }
        }
      }
    })

    const netFlow = totalIncome - totalExpenses
    const savingsRate = totalIncome > 0 ? Math.max(0, ((totalIncome - totalExpenses) / totalIncome) * 100) : 0
    const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : (totalExpenses > 0 ? 100 : 0)

    const categoriesArray = Object.keys(categoryMap).map((cat) => ({
      category: cat,
      amount: categoryMap[cat],
      percentage: totalExpenses > 0 ? Math.round((categoryMap[cat] / totalExpenses) * 100) : 0,
    })).sort((a, b) => b.amount - a.amount)

    const largestCategory = categoriesArray[0] || { category: 'None', amount: 0, percentage: 0 }
    const otherCategoriesTotal = totalExpenses - largestCategory.amount

    let statusType = 'healthy'
    if (netFlow < 0) {
      statusType = 'critical'
    } else if (expenseRatio > 75 || savingsRate < 15) {
      statusType = 'warning'
    }

    const sortedTx = [...txList].sort((a, b) => new Date(a.transaction_date || a.created_at) - new Date(b.transaction_date || b.created_at))
    let runningNet = 0
    const trendPoints = sortedTx.map((tx, idx) => {
      const amt = Number(tx.amount) || 0
      if (tx.type === 'deposit' || tx.type === 'income') runningNet += amt
      else runningNet -= amt
      return {
        step: `T${idx + 1}`,
        value: runningNet,
      }
    })

    if (trendPoints.length === 0) {
      trendPoints.push({ step: 'T1', value: 0 })
    }

    const projectedMonthlyNet = netFlow
    const projectedAnnualNet = netFlow * 12
    const potentialMonthlySavings15 = totalExpenses * 0.15
    const topCategoryCut25 = largestCategory.amount * 0.25
    const monthlyRunway = totalExpenses > 0 ? (totalIncome - totalExpenses > 0 ? ((totalIncome - totalExpenses) / totalExpenses).toFixed(1) : 0) : 0
    const annualCompoundGrowth = netFlow > 0 ? Math.round(netFlow * 12 * 1.025) : 0
    const compoundInterestGained = Math.max(0, annualCompoundGrowth - projectedAnnualNet)

    const goalTarget = 50000
    const currentGoalProgress = 18500
    const goalRemaining = goalTarget - currentGoalProgress
    const monthsToGoal = netFlow > 0 ? Math.ceil(goalRemaining / Math.max(netFlow, 1)) : null

    return {
      totalIncome,
      totalExpenses,
      netFlow,
      savingsRate: Number(savingsRate.toFixed(1)),
      expenseRatio: Number(expenseRatio.toFixed(1)),
      totalTransactions: txList.length,
      largestExpense: largestExpenseObj,
      largestCategory,
      otherCategoriesTotal,
      categoriesArray,
      statusType,
      trendPoints,
      projectedMonthlyNet,
      projectedAnnualNet,
      potentialMonthlySavings15,
      topCategoryCut25,
      monthlyRunway,
      annualCompoundGrowth,
      compoundInterestGained,
      monthsToGoal,
      hasRealData: transactions.length > 0,
    }
  }, [transactions])

  const cardBg = isLight ? 'bg-[#F1F3F8] border-[#DEE2EA]' : 'bg-[#121418] border-[#242830]'
  const elevatedBg = isLight ? 'bg-[#F4F5FA] border-[#E8EAF0]' : 'bg-[#181b20] border-[#242830]'
  const textPrimary = isLight ? 'text-[#343A40]' : 'text-[#F1F3F5]'
  const textSecondary = isLight ? 'text-[#68707C]' : 'text-[#94A3B8]'
  const textMuted = isLight ? 'text-[#8D95A1]' : 'text-[#64748B]'

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12 animate-fade-in px-0 sm:px-2 select-none">
      <ScrollFadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-dashed border-slate-700/30">
          <div>
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${textPrimary}`}>
              Insights
            </h1>
            <p className={`text-xs sm:text-sm mt-0.5 ${textSecondary}`}>
              Unbiased, data-driven analysis of your real financial habits.
            </p>
          </div>
        </div>
      </ScrollFadeIn>

      <ScrollFadeIn>
        <div className={`p-5 sm:p-6 rounded-2xl border ${cardBg} shadow-sm space-y-4 w-full`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-400 shrink-0" />
              <span className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>
                Predictive Scenarios
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pt-1">
            <div className={`p-4 rounded-2xl border space-y-2 flex flex-col justify-between ${elevatedBg}`}>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${textMuted}`}>
                Current Pace Projection (30 Days)
              </span>
              <div className="flex items-center gap-1.5 my-1">
                {metrics.projectedMonthlyNet < 0 ? (
                  <span className="text-rose-500 font-extrabold text-lg sm:text-xl">
                    -₱{Math.abs(metrics.projectedMonthlyNet).toLocaleString()}
                  </span>
                ) : (
                  <span className="text-emerald-500 font-extrabold text-lg sm:text-xl">
                    +₱{metrics.projectedMonthlyNet.toLocaleString()}
                  </span>
                )}
              </div>
              <p className={`text-[11px] leading-relaxed ${textSecondary}`}>
                {metrics.projectedMonthlyNet < 0
                  ? 'At your current spending rate, your account balance will decrease by this amount next month.'
                  : 'At your current net saving pace, your total balance will expand by this amount next month.'}
              </p>
            </div>

            <div className={`p-4 rounded-2xl border space-y-2 flex flex-col justify-between ${elevatedBg}`}>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${textMuted}`}>
                15% Expense Trim Impact
              </span>
              <span className="text-purple-400 font-extrabold text-lg sm:text-xl my-1">
                +₱{Math.round(metrics.potentialMonthlySavings15).toLocaleString()} / mo
              </span>
              <p className={`text-[11px] leading-relaxed ${textSecondary}`}>
                Reducing non-essential expenses by just 15% will add this amount straight to your net savings every month.
              </p>
            </div>

            <div className={`p-4 rounded-2xl border space-y-2 flex flex-col justify-between ${elevatedBg}`}>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${textMuted}`}>
                12-Month Net Projection
              </span>
              <span className={`font-extrabold text-lg sm:text-xl my-1 ${metrics.projectedAnnualNet < 0 ? 'text-rose-500' : 'text-emerald-400'}`}>
                {metrics.projectedAnnualNet >= 0 ? '+' : ''}₱{metrics.projectedAnnualNet.toLocaleString()} / yr
              </span>
              <p className={`text-[11px] leading-relaxed ${textSecondary}`}>
                Estimated 1-year total cash accumulation based on your current monthly cash flow.
              </p>
            </div>

            <div className={`p-4 rounded-2xl border space-y-2 flex flex-col justify-between ${elevatedBg}`}>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${textMuted}`}>
                Top Category Cutback (25% Cut)
              </span>
              <span className="text-amber-400 font-extrabold text-lg sm:text-xl my-1">
                +₱{Math.round(metrics.topCategoryCut25).toLocaleString()} / mo
              </span>
              <p className={`text-[11px] leading-relaxed ${textSecondary}`}>
                Trimming 25% from your largest category ({metrics.largestCategory.category}) frees up an extra ₱{Math.round(metrics.topCategoryCut25).toLocaleString()} monthly.
              </p>
            </div>

            <div className={`p-4 rounded-2xl border space-y-2 flex flex-col justify-between ${elevatedBg}`}>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${textMuted}`}>
                Savings Runway Cushion
              </span>
              <span className={`font-extrabold text-lg sm:text-xl my-1 ${metrics.monthlyRunway > 0 ? 'text-blue-400' : 'text-amber-500'}`}>
                {metrics.monthlyRunway > 0 ? `~${metrics.monthlyRunway} Months Runway` : '0 Months Cushion'}
              </span>
              <p className={`text-[11px] leading-relaxed ${textSecondary}`}>
                Your monthly net surplus provides roughly {metrics.monthlyRunway} months of emergency spending cushion.
              </p>
            </div>

            <div className={`p-4 rounded-2xl border space-y-2 flex flex-col justify-between ${elevatedBg}`}>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${textMuted}`}>
                5% High-Yield Digital Growth
              </span>
              <span className="text-teal-400 font-extrabold text-lg sm:text-xl my-1">
                +₱{metrics.annualCompoundGrowth.toLocaleString()} / yr
              </span>
              <p className={`text-[11px] leading-relaxed ${textSecondary}`}>
                Stashing monthly net savings in a 5% p.a. digital account yields an extra +₱{metrics.compoundInterestGained.toLocaleString()} in interest after 1 year.
              </p>
            </div>

            {metrics.monthsToGoal && (
              <div className={`p-4 rounded-2xl border space-y-2 flex flex-col justify-between col-span-1 sm:col-span-2 md:col-span-3 xl:col-span-2 ${elevatedBg}`}>
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-semibold uppercase tracking-wider ${textMuted}`}>
                    Emergency Fund Goal Estimate
                  </span>
                  <span className="font-bold text-emerald-500 font-mono text-sm">
                    ~{metrics.monthsToGoal} {metrics.monthsToGoal === 1 ? 'Month' : 'Months'}
                  </span>
                </div>
                <p className={`text-xs ${textSecondary}`}>
                  Saving ₱{metrics.netFlow.toLocaleString()}/cycle gets you to your ₱50,000 Emergency Fund target in roughly {metrics.monthsToGoal} months.
                </p>
              </div>
            )}
          </div>
        </div>
      </ScrollFadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <ScrollFadeIn>
            <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${cardBg} shadow-sm`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>
                  Financial Status Evaluation
                </span>
              </div>

              <p className={`text-sm sm:text-base font-semibold leading-relaxed ${textPrimary}`}>
                {metrics.statusType === 'critical'
                  ? `"Warning: You are currently spending more than your total income. Immediate spending adjustments are needed to stop balance loss."`
                  : metrics.statusType === 'warning'
                    ? `"Caution: Your expenses consume ${metrics.expenseRatio}% of your earnings, leaving a narrow margin for savings."`
                    : `"Your income successfully covers your expenses with a positive savings margin."`}
              </p>

              <div className="mt-3 pt-3 border-t border-slate-700/20 flex items-center justify-between text-xs">
                <span className={textMuted}>Evaluation Basis: Active Transactions</span>
                <span
                  className={`font-semibold flex items-center gap-1 ${metrics.statusType === 'critical'
                    ? 'text-rose-500'
                    : metrics.statusType === 'warning'
                      ? 'text-amber-500'
                      : 'text-emerald-500'
                    }`}
                >
                  {metrics.statusType === 'critical' ? (
                    <>
                      <TrendingDown className="w-3.5 h-3.5" />
                      Deficit Risk
                    </>
                  ) : metrics.statusType === 'warning' ? (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      High Spending
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Healthy Standing
                    </>
                  )}
                </span>
              </div>
            </div>
          </ScrollFadeIn>

          <ScrollFadeIn>
            <div className={`relative overflow-hidden p-5 sm:p-6 rounded-2xl border ${cardBg} shadow-md`}>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs font-extrabold uppercase tracking-wider ${metrics.statusType === 'critical'
                    ? 'text-rose-500'
                    : metrics.statusType === 'warning'
                      ? 'text-amber-500'
                      : 'text-emerald-400'
                    }`}
                >
                  Primary Insight
                </span>
              </div>

              <h2 className={`text-lg sm:text-xl font-extrabold tracking-tight mb-2 ${textPrimary}`}>
                {metrics.statusType === 'critical'
                  ? 'UNHEALTHY SPENDING PATTERN DETECTED'
                  : metrics.statusType === 'warning'
                    ? 'SPENDING CONSUMING MOST INCOME'
                    : 'YOUR SAVINGS ARE ON TRACK'}
              </h2>

              <p className={`text-sm leading-relaxed mb-5 ${textSecondary}`}>
                {metrics.statusType === 'critical'
                  ? `You spent ₱${metrics.totalExpenses.toLocaleString()} while earning ₱${metrics.totalIncome.toLocaleString()}, resulting in a negative net flow of -₱${Math.abs(
                    metrics.netFlow
                  ).toLocaleString()}. This habit drains your cash reserves.`
                  : metrics.statusType === 'warning'
                    ? `You are spending ${metrics.expenseRatio}% of your earnings (₱${metrics.totalExpenses.toLocaleString()}). Keeping expenses this high limits your long-term wealth growth.`
                    : `You're currently saving ${metrics.savingsRate}% of your income. Your net flow is positive at +₱${metrics.netFlow.toLocaleString()}, keeping your savings trajectory healthy.`}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-700/20">
                <div className={`p-3 rounded-xl border ${elevatedBg}`}>
                  <span className={`text-[11px] font-medium block mb-0.5 ${textMuted}`}>
                    Net Cash Flow
                  </span>
                  <span
                    className={`text-lg sm:text-xl font-extrabold ${metrics.netFlow < 0
                      ? 'text-rose-500'
                      : metrics.netFlow > 0
                        ? 'text-emerald-500'
                        : textPrimary
                      }`}
                  >
                    {metrics.netFlow >= 0 ? '+' : ''}₱{metrics.netFlow.toLocaleString()}
                  </span>
                </div>

                <div className={`p-3 rounded-xl border ${elevatedBg}`}>
                  <span className={`text-[11px] font-medium block mb-0.5 ${textMuted}`}>
                    Savings Rate
                  </span>
                  <span
                    className={`text-lg sm:text-xl font-extrabold ${metrics.savingsRate < 15 ? 'text-amber-500' : textPrimary
                      }`}
                  >
                    {metrics.savingsRate}%
                  </span>
                </div>
              </div>
            </div>
          </ScrollFadeIn>

          <ScrollFadeIn>
            <div className={`p-5 rounded-2xl border ${cardBg} shadow-sm space-y-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wider block ${textMuted}`}>
                    Net Cash Flow Trend
                  </span>
                  <h3 className={`text-base font-bold flex items-center gap-1.5 mt-0.5 ${textPrimary}`}>
                    {metrics.netFlow < 0 ? (
                      <>
                        Decreasing <ArrowDownRight className="w-4 h-4 text-rose-500" />
                      </>
                    ) : (
                      <>
                        Improving <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                      </>
                    )}
                  </h3>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${metrics.netFlow < 0
                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    }`}
                >
                  {metrics.netFlow < 0 ? 'Deficit Warning' : 'Positive Margin'}
                </span>
              </div>

              <p className={`text-xs sm:text-sm ${textSecondary}`}>
                {metrics.netFlow < 0
                  ? '"Your cash accumulation graph is in a downward slope due to high spending."'
                  : '"Your net balance trend shows steady accumulation from positive deposits."'}
              </p>

              <div className="h-28 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.trendPoints} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="insightsTrendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor={metrics.netFlow < 0 ? '#EF4444' : '#10B981'}
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor={metrics.netFlow < 0 ? '#EF4444' : '#10B981'}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="step"
                      stroke={isLight ? '#94A3B8' : '#64748B'}
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke={isLight ? '#94A3B8' : '#64748B'}
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `₱${val}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isLight ? '#FFFFFF' : '#181b20',
                        borderColor: isLight ? '#DEE2EA' : '#242830',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: isLight ? '#343A40' : '#F1F3F5',
                      }}
                      formatter={(value) => [`₱${value}`, 'Net Balance']}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={metrics.netFlow < 0 ? '#EF4444' : '#10B981'}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#insightsTrendGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ScrollFadeIn>

          <ScrollFadeIn>
            <div className={`p-5 rounded-2xl border ${cardBg} shadow-sm space-y-4`}>
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-blue-400 shrink-0" />
                <span className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>
                  Spending Behavior Breakdown
                </span>
              </div>

              <p className={`text-xs sm:text-sm font-medium leading-relaxed ${textPrimary}`}>
                {metrics.largestCategory.category !== 'None'
                  ? `"Most of your expenses are concentrated in '${metrics.largestCategory.category}', accounting for ${metrics.largestCategory.percentage}% of total spending."`
                  : `"No expenses logged yet for spending pattern breakdown."`}
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`font-semibold ${textPrimary}`}>
                      Top Category: {metrics.largestCategory.category}
                    </span>
                    <span className="font-bold text-amber-500">
                      ₱{metrics.largestCategory.amount.toLocaleString()} ({metrics.largestCategory.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-700/30 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, metrics.largestCategory.percentage)}%` }}
                    />
                  </div>
                </div>

                {metrics.otherCategoriesTotal > 0 && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={`font-medium ${textSecondary}`}>
                        Other Expense Categories
                      </span>
                      <span className={`font-semibold ${textSecondary}`}>
                        ₱{metrics.otherCategoriesTotal.toLocaleString()} (
                        {100 - metrics.largestCategory.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-700/30 overflow-hidden">
                      <div
                        className="h-full bg-blue-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(0, 100 - metrics.largestCategory.percentage)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollFadeIn>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <ScrollFadeIn>
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>
                  Key Analytical Observations
                </h3>
                <span className={`text-[11px] font-medium ${textMuted}`}>5 Key Points</span>
              </div>

              <div className={`p-4 rounded-xl border ${cardBg} shadow-sm space-y-2 hover:border-slate-500/40 transition-colors`}>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${metrics.netFlow < 0 ? 'text-rose-500' : 'text-amber-500'
                      }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {metrics.netFlow < 0 ? 'DEFICIT CRITIQUE' : 'TOP SPENDING CATEGORY'}
                  </span>
                  <span
                    className={`text-sm font-bold ${metrics.netFlow < 0 ? 'text-rose-500' : 'text-amber-500'
                      }`}
                  >
                    ₱{metrics.largestCategory.amount.toLocaleString()}
                  </span>
                </div>
                <p className={`text-xs sm:text-sm ${textSecondary} leading-relaxed`}>
                  {metrics.netFlow < 0
                    ? `"You are spending beyond your means. Your largest expense area (${metrics.largestCategory.category}) takes up ₱${metrics.largestCategory.amount.toLocaleString()}."`
                    : `"Your spending in '${metrics.largestCategory.category}' is the primary factor driving down your potential savings."`}
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${cardBg} shadow-sm space-y-2 hover:border-slate-500/40 transition-colors`}>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${metrics.netFlow < 0 ? 'text-rose-500' : 'text-emerald-500'
                      }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    NET CASH FLOW
                  </span>
                  <span
                    className={`text-sm font-bold ${metrics.netFlow < 0 ? 'text-rose-500' : 'text-emerald-500'
                      }`}
                  >
                    {metrics.netFlow >= 0 ? '+' : ''}₱{metrics.netFlow.toLocaleString()}
                  </span>
                </div>
                <p className={`text-xs sm:text-sm ${textSecondary} leading-relaxed`}>
                  {metrics.netFlow < 0
                    ? `"You have a negative net cash flow of -₱${Math.abs(metrics.netFlow).toLocaleString()}. Income failed to cover total expenditures."`
                    : `"Your cash flow remains positive, giving you extra funds to deposit into long-term savings goals."`}
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${cardBg} shadow-sm space-y-2 hover:border-slate-500/40 transition-colors`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5" />
                    SAVINGS RATE
                  </span>
                  <span className={`text-sm font-bold ${textPrimary}`}>
                    {metrics.savingsRate}%
                  </span>
                </div>
                <p className={`text-xs sm:text-sm ${textSecondary} leading-relaxed`}>
                  {metrics.savingsRate < 15
                    ? `"Your savings rate of ${metrics.savingsRate}% is critically low. Aim for at least 20% to build financial security."`
                    : `"You are saving ${metrics.savingsRate}% of your total earnings, maintaining healthy asset accumulation."`}
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${cardBg} shadow-sm space-y-2 hover:border-slate-500/40 transition-colors`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-extrabold uppercase tracking-wider ${textMuted} flex items-center gap-1.5`}>
                    <Layers className="w-3.5 h-3.5" />
                    EXPENSE RATIO
                  </span>
                  <span
                    className={`text-sm font-bold ${metrics.expenseRatio > 75 ? 'text-amber-500' : textPrimary
                      }`}
                  >
                    {metrics.expenseRatio}%
                  </span>
                </div>
                <p className={`text-xs sm:text-sm ${textSecondary} leading-relaxed`}>
                  {metrics.expenseRatio > 75
                    ? `"Expenses take up ${metrics.expenseRatio}% of your income. High spending ratios increase vulnerability to financial stress."`
                    : `"Expenses consume ${metrics.expenseRatio}% of your earnings, keeping your budget reasonably balanced."`}
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${cardBg} shadow-sm space-y-2 hover:border-slate-500/40 transition-colors`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-extrabold uppercase tracking-wider ${textMuted} flex items-center gap-1.5`}>
                    <Activity className="w-3.5 h-3.5" />
                    TOTAL TRANSACTIONS
                  </span>
                  <span className={`text-sm font-bold ${textPrimary}`}>
                    {metrics.totalTransactions}
                  </span>
                </div>
                <p className={`text-xs sm:text-sm ${textSecondary} leading-relaxed`}>
                  "Your active financial activity consists of {metrics.totalTransactions} recorded transactions."
                </p>
              </div>
            </div>
          </ScrollFadeIn>

          <ScrollFadeIn>
            <div
              className={`p-5 rounded-2xl border ${metrics.statusType === 'critical'
                ? isLight
                  ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                  : 'bg-rose-950/20 border-rose-500/30 text-rose-100'
                : metrics.statusType === 'warning'
                  ? isLight
                    ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                    : 'bg-amber-950/20 border-amber-500/30 text-amber-100'
                  : isLight
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-100'
                } shadow-sm space-y-2`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${metrics.statusType === 'critical'
                    ? 'text-rose-500'
                    : metrics.statusType === 'warning'
                      ? 'text-amber-500'
                      : 'text-emerald-500'
                    }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  {metrics.statusType === 'critical'
                    ? 'CRITICAL DEFICIT ALERT'
                    : metrics.statusType === 'warning'
                      ? 'NEEDS ATTENTION'
                      : 'HEALTHY CHECK'}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${metrics.statusType === 'critical'
                    ? 'bg-rose-500/20 text-rose-500'
                    : metrics.statusType === 'warning'
                      ? 'bg-amber-500/20 text-amber-500'
                      : 'bg-emerald-500/20 text-emerald-500'
                    }`}
                >
                  Single Largest Expense
                </span>
              </div>

              <p className="text-xs sm:text-sm leading-relaxed font-medium">
                {metrics.largestExpense.category !== 'None'
                  ? `Your highest individual expense is in '${metrics.largestExpense.category}' amounting to ₱${metrics.largestExpense.amount.toLocaleString()}.`
                  : 'No individual expenses detected.'}
              </p>

              <div
                className={`pt-2 flex items-center justify-between text-xs border-t ${metrics.statusType === 'critical'
                  ? 'border-rose-500/20'
                  : metrics.statusType === 'warning'
                    ? 'border-amber-500/20'
                    : 'border-emerald-500/20'
                  }`}
              >
                <span className="opacity-80">Category: {metrics.largestExpense.category}</span>
                <span
                  className={`font-bold text-sm ${metrics.statusType === 'critical'
                    ? 'text-rose-500'
                    : metrics.statusType === 'warning'
                      ? 'text-amber-500'
                      : 'text-emerald-500'
                    }`}
                >
                  ₱{metrics.largestExpense.amount.toLocaleString()}
                </span>
              </div>
            </div>
          </ScrollFadeIn>

          <ScrollFadeIn>
            <div className={`p-5 rounded-2xl border ${cardBg} shadow-md space-y-3 relative overflow-hidden`}>

              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                  DE'KLO RECOMMENDS
                </span>
              </div>

              <p className={`text-sm font-semibold leading-relaxed ${textPrimary}`}>
                {metrics.statusType === 'critical'
                  ? `"Stop non-essential withdrawals immediately. Allocate 20% of all incoming deposits directly to savings to rebuild your reserve."`
                  : metrics.statusType === 'warning'
                    ? `"Set a weekly spending cap of ₱${Math.round(
                      metrics.totalIncome * 0.4
                    ).toLocaleString()} on '${metrics.largestCategory.category}' to bring your savings rate back above 20%."`
                    : `"Keep saving at least 20% of every income deposit before allocating for non-essential spending."`}
              </p>

              <p className={`text-xs ${textMuted}`}>
                Directly calculated from your active income, spending ratios, and financial trajectory.
              </p>
            </div>
          </ScrollFadeIn>
        </div>
      </div>
    </div>
  )
}
