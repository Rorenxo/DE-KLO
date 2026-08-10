import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  Search,
  SlidersHorizontal,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  X,
  Plus,
  Trash2,
  AlertCircle,
  RefreshCw,
  Tag,
  Hash,
  Clock,
  ChevronDown,
  Filter,
} from 'lucide-react'
import ScrollFadeIn from '../ui/ScrollFadeIn'

export default function TransactionHistoryPage({
  theme = 'dark',
  transactions = [],
  loading = false,
  error = null,
  onRefresh,
  onAddTransaction,
  onDeleteTransaction,
}) {
  const isLight = theme === 'light'

  // Filter & Search State
  const [filterType, setFilterType] = useState('all') // 'all' | 'deposit' | 'withdrawal'
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [dateRange, setDateRange] = useState('all') // 'all' | '7days' | 'month'

  // Selected Transaction for Detail Modal
  const [selectedTx, setSelectedTx] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filterRef = useRef(null)

  // Close filter popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 1. Calculate Compact Financial Summary Metrics
  const summaryMetrics = useMemo(() => {
    let totalIncome = 0
    let totalExpenses = 0

    transactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0
      if (tx.type === 'deposit' || tx.type === 'income') {
        totalIncome += amt
      } else if (tx.type === 'withdrawal' || tx.type === 'expense') {
        totalExpenses += amt
      }
    })

    const net = totalIncome - totalExpenses

    return {
      totalIncome,
      totalExpenses,
      net,
    }
  }, [transactions])

  // Extract unique categories for filter dropdown
  const categoriesList = useMemo(() => {
    const set = new Set()
    transactions.forEach((tx) => {
      if (tx.category) set.add(tx.category)
    })
    return Array.from(set)
  }, [transactions])

  // 2. Filter & Search Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type Filter
      if (filterType === 'deposit' && !(tx.type === 'deposit' || tx.type === 'income')) {
        return false
      }
      if (filterType === 'withdrawal' && !(tx.type === 'withdrawal' || tx.type === 'expense')) {
        return false
      }

      // Category Filter
      if (selectedCategory !== 'all' && tx.category !== selectedCategory) {
        return false
      }

      // Date Range Filter
      if (dateRange !== 'all') {
        const txDate = new Date(tx.transaction_date || tx.created_at)
        const now = new Date()
        if (dateRange === '7days') {
          const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7))
          if (txDate < sevenDaysAgo) return false
        } else if (dateRange === 'month') {
          if (
            txDate.getMonth() !== new Date().getMonth() ||
            txDate.getFullYear() !== new Date().getFullYear()
          ) {
            return false
          }
        }
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchCategory = tx.category?.toLowerCase().includes(q)
        const matchDesc = tx.description?.toLowerCase().includes(q)
        const matchType = tx.type?.toLowerCase().includes(q)
        const matchAmount = String(tx.amount).includes(q)
        if (!matchCategory && !matchDesc && !matchType && !matchAmount) {
          return false
        }
      }

      return true
    })
  }, [transactions, filterType, selectedCategory, dateRange, searchQuery])

  // 3. Group Transactions by Date
  const groupedTransactions = useMemo(() => {
    const groups = {}

    filteredTransactions.forEach((tx) => {
      const d = new Date(tx.transaction_date || tx.created_at || Date.now())
      const today = new Date()
      const yesterday = new Date()
      yesterday.setDate(today.getDate() - 1)

      let groupKey = ''
      if (d.toDateString() === today.toDateString()) {
        groupKey = 'TODAY'
      } else if (d.toDateString() === yesterday.toDateString()) {
        groupKey = 'YESTERDAY'
      } else {
        groupKey = d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }).toUpperCase()
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(tx)
    })

    return groups
  }, [filteredTransactions])

  const handleDeleteConfirmed = async () => {
    if (!selectedTx || !onDeleteTransaction) return
    setIsDeleting(true)
    try {
      await onDeleteTransaction(selectedTx.id)
      setIsDeleting(false)
      setSelectedTx(null)
    } catch (e) {
      setIsDeleting(false)
    }
  }

  const resetFilters = () => {
    setSelectedCategory('all')
    setDateRange('all')
    setSearchQuery('')
    setIsFilterOpen(false)
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6 select-none animate-fade-in">
      {/* 1. Page Header */}
      <header className="flex items-center justify-between pt-1 pb-1">
        <div>
          <h2 className={`text-xl sm:text-2xl font-bold font-Kudryashev tracking-tight ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            Transactions
          </h2>
          <p className={`text-xs mt-0.5 ${
            isLight ? 'text-slate-600 font-medium' : 'text-[#808a92]'
          }`}>
            Track where your money goes.
          </p>
        </div>

        {/* Mobile Search & Filter Triggers (< 640px) */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            aria-label="Search transactions"
            className={`w-9 h-9 rounded-2xl border flex items-center justify-center transition-all cursor-pointer ${
              isMobileSearchOpen || searchQuery
                ? isLight ? 'bg-slate-900 text-white border-slate-900' : 'bg-[#bdc7ce] text-black border-[#bdc7ce]'
                : isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#24292e]/80 border-[#4a5156]/50 text-[#bdc7ce]'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            aria-label="Filter transactions"
            className={`w-9 h-9 rounded-2xl border flex items-center justify-center transition-all cursor-pointer relative ${
              selectedCategory !== 'all' || dateRange !== 'all'
                ? isLight ? 'bg-slate-900 text-white border-slate-900' : 'bg-[#bdc7ce] text-black border-[#bdc7ce]'
                : isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#24292e]/80 border-[#4a5156]/50 text-[#bdc7ce]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {(selectedCategory !== 'all' || dateRange !== 'all') && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Expandable Search Input */}
      {isMobileSearchOpen && (
        <div className="sm:hidden animate-fade-in">
          <div className={`relative flex items-center rounded-2xl border p-1 ${
            isLight ? 'bg-white border-slate-300' : 'bg-[#24292e] border-[#4a5156]/60'
          }`}>
            <Search className="w-4 h-4 text-[#808a92] ml-3 shrink-0" />
            <input
              type="text"
              placeholder="Search description, category, amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className={`w-full py-2 px-3 text-xs outline-none bg-transparent ${
                isLight ? 'text-slate-900 placeholder:text-slate-400' : 'text-white placeholder:text-[#808a92]'
              }`}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-1 mr-1 text-[#808a92] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Compact Financial Summary Bar */}
      <ScrollFadeIn delay={100}>
        <div className={`p-3.5 sm:p-4 rounded-2xl border shadow-lg transition-colors ${
          isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' : 'bg-[#24292e]/70 border-[#4a5156]/40 text-white'
        }`}>
          <div className={`flex items-center justify-between pb-2 border-b text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
            isLight ? 'border-slate-200 text-slate-700' : 'border-white/10 text-[#808a92]'
          }`}>
            <span>Activity Overview</span>
            <span className={`font-mono ${isLight ? 'text-slate-900 font-bold' : 'text-[#bdc7ce]'}`}>{transactions.length} Total</span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 text-center sm:text-left">
            {/* Income */}
            <div className="space-y-0.5">
              <span className={`text-[10px] sm:text-[11px] font-semibold block ${isLight ? 'text-slate-600' : 'text-[#808a92]'}`}>
                Income
              </span>
              <span className="text-xs sm:text-sm md:text-base font-bold font-mono text-emerald-500 block truncate">
                +₱{summaryMetrics.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Expenses */}
            <div className={`space-y-0.5 border-x px-2 sm:px-3 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <span className={`text-[10px] sm:text-[11px] font-semibold block ${isLight ? 'text-slate-600' : 'text-[#808a92]'}`}>
                Expenses
              </span>
              <span className="text-xs sm:text-sm md:text-base font-bold font-mono text-rose-500 block truncate">
                -₱{summaryMetrics.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Net Flow */}
            <div className="space-y-0.5 pl-1">
              <span className={`text-[10px] sm:text-[11px] font-semibold block ${isLight ? 'text-slate-600' : 'text-[#808a92]'}`}>
                Net Flow
              </span>
              <span className={`text-xs sm:text-sm md:text-base font-bold font-mono block truncate ${
                summaryMetrics.net >= 0 ? (isLight ? 'text-slate-900' : 'text-white') : 'text-rose-500'
              }`}>
                {summaryMetrics.net >= 0 ? '+' : ''}₱{summaryMetrics.net.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </ScrollFadeIn>

      {/* 3. Segmented Control Pills + Search & Filter Bar (Desktop & Mobile) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 relative z-30">
        {/* Filter Pills */}
        <div className={`flex items-center p-1 rounded-2xl border w-full sm:w-auto min-w-[240px] ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#24292e]/90 border-[#4a5156]/50'
        }`}>
          {['all', 'deposit', 'withdrawal'].map((t) => {
            const isActive = filterType === t
            const label = t === 'all' ? 'All' : t === 'deposit' ? 'Deposit' : 'Withdraw'

            return (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                aria-label={`Filter by ${label}`}
                className={`flex-1 py-1.5 px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center active:scale-[0.98] ${
                  isActive
                    ? isLight ? 'bg-white text-slate-900 shadow-sm' : 'bg-[#bdc7ce] text-black font-bold shadow-md'
                    : isLight ? 'text-slate-600 hover:text-black' : 'text-[#808a92] hover:text-white'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Desktop Search Field & Filter Popover Button (NO + Add button on desktop) */}
        <div className="hidden sm:flex items-center gap-2.5 relative" ref={filterRef}>
          {/* Desktop Search Input */}
          <div className={`relative flex items-center rounded-2xl border px-3 py-1.5 w-44 md:w-56 lg:w-64 transition-all ${
            isLight ? 'bg-white border-slate-300' : 'bg-[#24292e] border-[#4a5156]/60 focus-within:border-[#bdc7ce]'
          }`}>
            <Search className="w-3.5 h-3.5 text-[#808a92] mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full text-xs outline-none bg-transparent ${
                isLight ? 'text-slate-900 placeholder:text-slate-400' : 'text-white placeholder:text-[#808a92]'
              }`}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-0.5 text-[#808a92] hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Desktop Filter Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              aria-label="Filter options"
              className={`flex items-center gap-2 py-2 px-3.5 rounded-2xl border text-xs font-semibold cursor-pointer transition-all ${
                isFilterOpen || selectedCategory !== 'all' || dateRange !== 'all'
                  ? isLight ? 'bg-slate-900 text-white border-slate-900' : 'bg-[#bdc7ce] text-black border-[#bdc7ce] font-bold'
                  : isLight ? 'bg-white border-slate-200 text-slate-700 hover:text-black' : 'bg-[#24292e] border-[#4a5156]/60 text-[#bdc7ce] hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Filter Floating Popover directly underneath Filter Button with High z-index z-[200] */}
            {isFilterOpen && (
              <div
                className={`absolute right-0 mt-2 w-72 sm:w-80 rounded-3xl border p-4 shadow-2xl z-[200] animate-fade-in ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50'
                    : 'bg-[#1a1e22] border-[#4a5156]/70 text-white backdrop-blur-2xl shadow-black/90'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#808a92]">
                    Filter Transactions
                  </span>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="p-1 text-[#808a92] hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 pt-3">
                  {/* Date Range Selection */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold uppercase text-[#808a92]">
                      Date Range
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'all', label: 'All Time' },
                        { id: '7days', label: '7 Days' },
                        { id: 'month', label: 'This Month' },
                      ].map((d) => (
                        <button
                          key={d.id}
                          onClick={() => setDateRange(d.id)}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                            dateRange === d.id
                              ? isLight ? 'bg-slate-900 text-white border-slate-900' : 'bg-[#bdc7ce] text-black border-[#bdc7ce] font-bold'
                              : isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-[#000000]/60 border-[#4a5156]/50 text-[#808a92]'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category Selection */}
                  {categoriesList.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold uppercase text-[#808a92]">
                        Category
                      </label>
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                        <button
                          onClick={() => setSelectedCategory('all')}
                          className={`py-1.5 px-2.5 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                            selectedCategory === 'all'
                              ? isLight ? 'bg-slate-900 text-white border-slate-900' : 'bg-[#bdc7ce] text-black border-[#bdc7ce] font-bold'
                              : isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-[#000000]/60 border-[#4a5156]/50 text-[#808a92]'
                          }`}
                        >
                          All Categories
                        </button>
                        {categoriesList.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`py-1.5 px-2.5 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                              selectedCategory === cat
                                ? isLight ? 'bg-slate-900 text-white border-slate-900' : 'bg-[#bdc7ce] text-black border-[#bdc7ce] font-bold'
                                : isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-[#000000]/60 border-[#4a5156]/50 text-[#808a92]'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bottom Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="flex-1 py-2 px-3 rounded-xl border border-[#4a5156]/60 text-xs font-semibold text-[#bdc7ce] hover:text-white"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFilterOpen(false)}
                      className="flex-1 py-2 px-3 rounded-xl bg-white text-black font-bold text-xs shadow-lg hover:bg-[#bdc7ce] transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Error Banner (If fetch failed) */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>Unable to load transactions. Please check database connection.</span>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-white font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* 5. Skeleton Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border animate-pulse flex items-center justify-between ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#24292e]/40 border-[#4a5156]/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-white/10" />
                <div className="space-y-2">
                  <div className="w-28 h-3 rounded bg-white/10" />
                  <div className="w-20 h-2.5 rounded bg-white/10" />
                </div>
              </div>
              <div className="w-20 h-4 rounded bg-white/10" />
            </div>
          ))}
        </div>
      )}

      {/* 6. Empty State */}
      {!loading && !error && filteredTransactions.length === 0 && (
        <div className={`p-10 text-center rounded-3xl border space-y-4 my-4 animate-fade-in ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#24292e]/40 border-[#4a5156]/30'
        }`}>
          <div className={`w-14 h-14 rounded-3xl mx-auto flex items-center justify-center ${
            isLight ? 'bg-slate-100 text-slate-500' : 'bg-[#000000]/60 text-[#bdc7ce] border border-[#4a5156]/40'
          }`}>
            <Clock className="w-7 h-7" />
          </div>

          <div className="space-y-1.5 max-w-xs mx-auto">
            <h3 className={`text-base font-bold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
              No transactions found
            </h3>
            <p className="text-xs text-[#808a92] leading-relaxed">
              {searchQuery || filterType !== 'all' || selectedCategory !== 'all'
                ? 'No activity matches your active search or filter rules.'
                : 'Your financial activity will appear here once you make your first transaction.'}
            </p>
          </div>

          <div className="flex justify-center gap-2 pt-2">
            {(searchQuery || filterType !== 'all' || selectedCategory !== 'all') ? (
              <button
                onClick={resetFilters}
                className="py-2 px-4 rounded-2xl border border-[#4a5156]/60 text-xs font-semibold text-[#bdc7ce] hover:text-white cursor-pointer"
              >
                Reset Filters
              </button>
            ) : onAddTransaction ? (
              <button
                onClick={onAddTransaction}
                className="py-2.5 px-5 rounded-2xl bg-white text-black font-bold text-xs shadow-lg hover:bg-[#bdc7ce] transition-colors cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Transaction</span>
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* 7. Grouped Timeline Transaction List */}
      {!loading && !error && filteredTransactions.length > 0 && (
        <div className="space-y-6">
          {Object.keys(groupedTransactions).map((dateGroupKey) => {
            const txGroup = groupedTransactions[dateGroupKey]

            return (
              <div key={dateGroupKey} className="space-y-2.5">
                {/* Date Header */}
                <div className={`text-[11px] font-bold uppercase tracking-wider px-1 flex items-center gap-2 ${
                  isLight ? 'text-slate-700' : 'text-[#808a92]'
                }`}>
                  <span>{dateGroupKey}</span>
                  <div className={`flex-1 h-[1px] ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} />
                </div>

                {/* Rows in Date Group */}
                <div className="space-y-2">
                  {txGroup.map((tx) => {
                    const isIncomeType = tx.type === 'deposit' || tx.type === 'income'
                    const displayAmt = Number(tx.amount) || 0
                    const formattedTime = new Date(tx.transaction_date || tx.created_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })

                    return (
                      <div
                        key={tx.id}
                        onClick={() => setSelectedTx(tx)}
                        className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between transition-all cursor-pointer active:scale-[0.985] ${
                          isLight
                            ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
                            : 'bg-[#24292e]/60 border-[#4a5156]/30 hover:bg-[#24292e] hover:border-[#4a5156]/60 shadow-lg'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Icon Badge */}
                          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                            isIncomeType
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          }`}>
                            {isIncomeType ? (
                              <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
                            )}
                          </div>

                          <div className="space-y-0.5 min-w-0">
                            <h4 className={`text-xs sm:text-sm font-bold truncate leading-tight ${
                              isLight ? 'text-slate-900' : 'text-white'
                            }`}>
                              {tx.category || (isIncomeType ? 'Deposit' : 'Withdrawal')}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] text-[#808a92] truncate">
                              <span className="capitalize">{tx.type}</span>
                              <span>•</span>
                              <span>{formattedTime}</span>
                              {tx.description && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[120px]">{tx.description}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right shrink-0 ml-3">
                          <span className={`block text-xs sm:text-sm font-bold font-mono ${
                            isIncomeType ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {isIncomeType ? '+' : '-'}₱{displayAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 8. Transaction Detail View Drawer/Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center select-none animate-fade-in">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
            onClick={() => setSelectedTx(null)}
          />

          <div className={`relative w-full max-w-md rounded-t-[32px] sm:rounded-3xl border p-6 shadow-2xl z-10 transition-all ${
            isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50' : 'bg-[#1a1e22] border-[#4a5156]/60 text-white'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-bold uppercase tracking-wider text-[#808a92]">
                Transaction Detail
              </span>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1.5 text-[#808a92] hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 pt-4">
              {/* Type Badge & Amount Header */}
              <div className="text-center space-y-1 py-2">
                <span className={`inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-xl border ${
                  selectedTx.type === 'deposit' || selectedTx.type === 'income'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                }`}>
                  {selectedTx.type}
                </span>

                <div className={`text-2xl sm:text-3xl font-bold font-mono ${
                  selectedTx.type === 'deposit' || selectedTx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {selectedTx.type === 'deposit' || selectedTx.type === 'income' ? '+' : '-'}₱{Number(selectedTx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>

                <p className="text-xs font-semibold text-white">
                  {selectedTx.category || selectedTx.type}
                </p>
              </div>

              {/* Details List */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#000000]/60 border-[#4a5156]/40'
              }`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#808a92] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Date & Time
                  </span>
                  <span className="font-mono text-white font-semibold">
                    {new Date(selectedTx.transaction_date || selectedTx.created_at).toLocaleString()}
                  </span>
                </div>

                {selectedTx.description && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
                    <span className="text-[#808a92] flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" /> Note
                    </span>
                    <span className="font-semibold text-white">{selectedTx.description}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
                  <span className="text-[#808a92] flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" /> Transaction ID
                  </span>
                  <span className="font-mono text-[#bdc7ce] text-[11px]">
                    TXN-{selectedTx.id?.slice(0, 8).toUpperCase() || '8A92F1'}
                  </span>
                </div>
              </div>

              {/* Delete Action */}
              {onDeleteTransaction && (
                <div className="pt-2">
                  <button
                    onClick={handleDeleteConfirmed}
                    disabled={isDeleting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 font-bold text-xs transition-all cursor-pointer active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{isDeleting ? 'Deleting...' : 'Delete Transaction Record'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
