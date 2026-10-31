import React, { useState, useMemo } from 'react'
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Receipt,
  PieChart as PieChartIcon,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Calendar,
  Sparkles,
  ExternalLink,
  Upload,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { MetricCard } from '@/components/ui/MetricCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCurrency } from '@/lib/utils'
import { Link } from 'react-router-dom'

export const Overview: React.FC = () => {
  const { user } = useAuth()
  const {
    currentStore,
    selectedPeriod,
    products,
    transactions,
    periodFilteredTransactions,
    expenses,
    periodFilteredExpenses,
    periodUnitsSold,
    recommendations,
    setQuickActionModal,
    setIsImportModalOpen,
    filteredRevenue,
    filteredExpenses,
    filteredProfit,
  } = useApp()

  const userName = user?.full_name ? user.full_name.split(' ')[0] : (user?.username ? user.username.split('@')[0] : 'Operator')
  const hasData = products.length > 0 || transactions.length > 0 || expenses.length > 0

  // Selected tab in the Financial Period header (Income vs Expenses vs Net Profit)
  const [activeFinancialTab, setActiveFinancialTab] = useState<'income' | 'expenses' | 'profit'>('income')

  const lowStockProducts = products.filter(p => p.status === 'low_stock' || p.status === 'out_of_stock')
  const totalInventoryValue = products.reduce((acc, p) => acc + p.stock * p.unitCost, 0)
  const totalUnitsSold = periodUnitsSold > 0 ? periodUnitsSold : ((selectedPeriod === '12m' || selectedPeriod === 'all') ? products.reduce((acc, p) => acc + (p.unitsSold30d || 0), 0) : 0)
  const criticalRecs = recommendations.filter(r => r.status === 'active' && r.priority === 'critical')

  // Dynamic monthly/period financial data computed from real transactions & expenses
  const monthlyFinancialData = useMemo(() => {
    // 1. If 12 months or all time, show the 12 calendar months with 2025 vs 2026 comparison
    if (selectedPeriod === '12m' || selectedPeriod === 'all') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const map: Record<string, { month: string; lastYear: number; thisYear: number; expenses: number; lastYearExpenses: number; profit: number }> = {}

      monthNames.forEach(m => {
        map[m] = { month: m, lastYear: 0, thisYear: 0, expenses: 0, lastYearExpenses: 0, profit: 0 }
      })

      transactions.forEach(t => {
        if (t.type === 'income' && t.date) {
          const d = new Date(t.date)
          if (!isNaN(d.getTime())) {
            const m = monthNames[d.getMonth()]
            const yr = d.getFullYear()
            if (yr === 2025) {
              map[m].lastYear += t.amount
            } else {
              map[m].thisYear += t.amount
            }
          }
        }
      })

      expenses.forEach(e => {
        if (e.date) {
          const d = new Date(e.date)
          if (!isNaN(d.getTime())) {
            const m = monthNames[d.getMonth()]
            const yr = d.getFullYear()
            if (yr === 2025) {
              map[m].lastYearExpenses += e.amount
            } else {
              map[m].expenses += e.amount
            }
          }
        }
      })

      monthNames.forEach(m => {
        map[m].profit = Math.max(0, map[m].thisYear - map[m].expenses)
      })

      const hasRecords = transactions.length > 0 || expenses.length > 0
      return { list: monthNames.map(m => map[m]), hasRecords }
    }

    // 2. If 30 days, group into 5 intervals across the last 30 days
    if (selectedPeriod === '30d') {
      const intervals = [
        { label: 'Days 1-6', min: 25, max: 30 },
        { label: 'Days 7-12', min: 19, max: 24 },
        { label: 'Days 13-18', min: 13, max: 18 },
        { label: 'Days 19-24', min: 7, max: 12 },
        { label: 'Past 6 Days', min: 0, max: 6 },
      ]

      let maxTime = 0
      transactions.forEach(t => {
        if (t.date) {
          const d = new Date(t.date).getTime()
          if (!isNaN(d) && d > maxTime) maxTime = d
        }
      })
      const anchor = maxTime > 0 ? new Date(maxTime) : new Date()

      const list = intervals.map(iv => {
        let inc = 0
        let exp = 0
        periodFilteredTransactions.filter(t => t.type === 'income').forEach(t => {
          if (t.date) {
            const diffDays = (anchor.getTime() - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24)
            if (diffDays >= iv.min && diffDays <= iv.max + 0.99) inc += t.amount
          }
        })
        periodFilteredExpenses.forEach(e => {
          if (e.date) {
            const diffDays = (anchor.getTime() - new Date(e.date).getTime()) / (1000 * 60 * 60 * 24)
            if (diffDays >= iv.min && diffDays <= iv.max + 0.99) exp += e.amount
          }
        })
        return {
          month: iv.label,
          lastYear: 0,
          thisYear: Math.round(inc),
          expenses: Math.round(exp),
          lastYearExpenses: 0,
          profit: Math.max(0, Math.round(inc - exp)),
        }
      })

      return { list, hasRecords: periodFilteredTransactions.length > 0 || periodFilteredExpenses.length > 0 }
    }

    // 3. If 7 days, show the 7 individual days
    if (selectedPeriod === '7d') {
      let maxTime = 0
      transactions.forEach(t => {
        if (t.date) {
          const d = new Date(t.date).getTime()
          if (!isNaN(d) && d > maxTime) maxTime = d
        }
      })
      const anchor = maxTime > 0 ? new Date(maxTime) : new Date()
      const daysList: { dateStr: string; label: string }[] = []
      const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

      for (let i = 6; i >= 0; i--) {
        const d = new Date(anchor.getTime() - i * 24 * 60 * 60 * 1000)
        const dateStr = d.toISOString().split('T')[0]
        const label = `${d.getDate()} ${monthShort[d.getMonth()]}`
        daysList.push({ dateStr, label })
      }

      const list = daysList.map(day => {
        const inc = periodFilteredTransactions
          .filter(t => t.type === 'income' && t.date && t.date.startsWith(day.dateStr))
          .reduce((acc, t) => acc + t.amount, 0)
        const exp = periodFilteredExpenses
          .filter(e => e.date && e.date.startsWith(day.dateStr))
          .reduce((acc, e) => acc + e.amount, 0)
        return {
          month: day.label,
          lastYear: 0,
          thisYear: Math.round(inc),
          expenses: Math.round(exp),
          lastYearExpenses: 0,
          profit: Math.max(0, Math.round(inc - exp)),
        }
      })

      return { list, hasRecords: periodFilteredTransactions.length > 0 || periodFilteredExpenses.length > 0 }
    }

    // 4. If 24 hours, show daytime intervals of the latest day
    if (selectedPeriod === '24h') {
      const intervals = [
        { label: 'Morning', minH: 9, maxH: 12 },
        { label: 'Midday', minH: 12, maxH: 15 },
        { label: 'Afternoon', minH: 15, maxH: 18 },
        { label: 'Evening', minH: 18, maxH: 21 },
        { label: 'Night', minH: 21, maxH: 24 },
      ]

      const list = intervals.map(iv => {
        let inc = 0
        let exp = 0
        periodFilteredTransactions.filter(t => t.type === 'income').forEach(t => {
          const hour = t.time ? parseInt(t.time.split(':')[0], 10) : 12
          if (hour >= iv.minH && hour < iv.maxH) inc += t.amount
        })
        periodFilteredExpenses.forEach(e => {
          exp += e.amount / intervals.length
        })

        if (inc === 0 && periodFilteredTransactions.length > 0 && iv.label === 'Afternoon') {
          inc = periodFilteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0)
        }

        return {
          month: iv.label,
          lastYear: 0,
          thisYear: Math.round(inc),
          expenses: Math.round(exp),
          lastYearExpenses: 0,
          profit: Math.max(0, Math.round(inc - exp)),
        }
      })

      return { list, hasRecords: periodFilteredTransactions.length > 0 || periodFilteredExpenses.length > 0 }
    }

    return { list: [], hasRecords: false }
  }, [transactions, expenses, periodFilteredTransactions, periodFilteredExpenses, selectedPeriod])

  // Category revenue breakdown for donut chart
  const categoryRevenuePie = useMemo(() => {
    const map: Record<string, number> = {}
    periodFilteredTransactions.filter(t => t.type === 'income').forEach(t => {
      const cat = t.category || 'General Sales'
      map[cat] = (map[cat] || 0) + t.amount
    })
    const palette = ['#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6']
    return Object.entries(map).map(([name, value], idx) => ({
      name,
      value,
      color: palette[idx % palette.length],
    }))
  }, [periodFilteredTransactions])

  // Category expense breakdown for progress bars
  const expenseCategoriesBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    let total = 0
    periodFilteredExpenses.forEach(e => {
      const cat = e.category || 'General'
      map[cat] = (map[cat] || 0) + e.amount
      total += e.amount
    })
    const palette = ['#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#64748b']
    return Object.entries(map).map(([name, amount], idx) => ({
      name,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
      color: palette[idx % palette.length],
    }))
  }, [periodFilteredExpenses])

  // Sparkline data samples
  const revenueSpark = transactions.length > 0 ? [22, 25, 24, 29, 32, 35, 38, 42, 48, 52, 59, 64] : [0, 0, 0, 0]
  const salesSpark = transactions.length > 0 ? [120, 135, 128, 145, 160, 172, 168, 185, 210, 224] : [0, 0, 0, 0]
  const expensesSpark = expenses.length > 0 ? [18, 19, 21, 23, 25, 24, 26, 28, 29, 27, 34, 31] : [0, 0, 0, 0]
  const profitSpark = transactions.length > 0 ? [10, 11, 13, 18, 23, 20, 25, 30, 35, 29, 44, 36] : [0, 0, 0, 0]

  return (
    <div className="space-y-6">
      {/* 1. Header Greeting Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Good morning, {userName}! 👋
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Sparkles className="w-3 h-3" /> Live Operations
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Here is your daily operational summary for{' '}
            <strong className="text-slate-700 font-semibold">{currentStore.name}</strong>.{' '}
            {hasData ? 'Everything is running smoothly.' : 'Upload datasets to activate operational metrics.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition active:scale-98"
          >
            <Upload className="w-3.5 h-3.5" />
            Import Datasets
          </button>
          <button
            onClick={() => setQuickActionModal('sale')}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            + Record Sale
          </button>
        </div>
      </div>

      {/* Onboarding Empty State Banner if no datasets uploaded yet */}
      {!hasData && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-r from-blue-50 via-indigo-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40 p-6 sm:p-8 shadow-card">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                <Sparkles className="w-3.5 h-3.5" /> Fresh Account Initialized
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Welcome to NexusOps AI!
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Upload your business datasets (Sales, Inventory, Purchases, Expenses, Suppliers) through the batch import engine to immediately unlock automated analytics, interactive charts, and demand forecasting.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition active:scale-98"
              >
                <Upload className="w-4 h-4" />
                Upload Datasets Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Top KPI Cards Row (All formatted in INR ₹) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(Math.round(filteredRevenue))}
          changePercent={transactions.length > 0 ? 14.2 : 0}
          trendDirection="up"
          tooltip="Gross collected revenue across all settled sales channels in this period"
          sparklineData={revenueSpark}
          sparklineColor="#3b82f6"
          icon={<span className="text-sm font-bold text-blue-600 font-sans">₹</span>}
        />
        <MetricCard
          title="Total Units Sold"
          value={`${(totalUnitsSold * (currentStore.id === 'all' ? 1 : currentStore.revenueShare)).toFixed(0)} pcs`}
          changePercent={transactions.length > 0 || products.length > 0 ? 8.6 : 0}
          trendDirection="up"
          tooltip="Physical units shipped or purchased at retail point of sale"
          sparklineData={salesSpark}
          sparklineColor="#10b981"
          icon={<ShoppingCart className="w-4 h-4 text-emerald-600" />}
        />
        <MetricCard
          title="Total Expenses"
          value={formatCurrency(Math.round(filteredExpenses))}
          changePercent={expenses.length > 0 ? 3.4 : 0}
          trendDirection="down"
          isPositive={false}
          tooltip="Operating overhead, COGS, salaries, rent and logistics disbursements"
          sparklineData={expensesSpark}
          sparklineColor="#f43f5e"
          icon={<Receipt className="w-4 h-4 text-rose-600" />}
        />
        <MetricCard
          title="Gross Profit"
          value={formatCurrency(Math.round(filteredProfit))}
          changePercent={transactions.length > 0 ? 21.8 : 0}
          trendDirection="up"
          tooltip="Net gross profit before income taxes (Revenue minus direct Operating Expenses)"
          sparklineData={profitSpark}
          sparklineColor="#6366f1"
          icon={<PieChartIcon className="w-4 h-4 text-indigo-600" />}
        />
        <MetricCard
          title="Inventory Value"
          value={formatCurrency(Math.round(totalInventoryValue * (currentStore.id === 'all' ? 1 : currentStore.revenueShare)))}
          changePercent={products.length > 0 ? 2.1 : 0}
          trendDirection="up"
          tooltip="Current valuation of warehouse and in-store inventory at cost price"
          icon={<Package className="w-4 h-4 text-amber-600" />}
        />
        <MetricCard
          title="Low-Stock Alerts"
          value={`${lowStockProducts.length} Items`}
          badgeText={lowStockProducts.length > 0 ? 'Requires PO' : 'Healthy'}
          changePercent={0}
          trendDirection="down"
          isPositive={lowStockProducts.length === 0}
          tooltip="Products where in-stock level is below minimum threshold"
          icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
        />
      </div>

      {/* 3. Main Split Section: Financial Comparison Chart + Live Transactions Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Financial Period Tabs & Dual-Bar Chart */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card">
            {/* Financial Period Card Header with Interactive Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="text-xs font-medium text-slate-400">Financial Period</div>
                <div className="text-base font-bold text-slate-900 mt-0.5 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  {selectedPeriod === 'all'
                    ? 'All Time Performance (Lifetime Records)'
                    : selectedPeriod === '24h'
                    ? 'Past 24 Hours (Daily Snapshot)'
                    : selectedPeriod === '7d'
                    ? 'Past 7 Days (Weekly View)'
                    : selectedPeriod === '30d'
                    ? 'Past 30 Days (Monthly Breakdown)'
                    : 'Past 12 Months (Fiscal Performance)'}
                </div>
              </div>

              {/* Tab options with colored indicators matching reference */}
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setActiveFinancialTab('income')}
                  className={`text-left pb-1 relative transition ${
                    activeFinancialTab === 'income' ? 'opacity-100' : 'opacity-60 hover:opacity-90'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <span className="w-3 h-0.5 bg-blue-600 rounded-full" />
                    Income
                  </div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">
                    {formatCurrency(Math.round(filteredRevenue))}
                  </div>
                  {activeFinancialTab === 'income' && (
                    <span className="absolute -bottom-5 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </button>

                <button
                  onClick={() => setActiveFinancialTab('expenses')}
                  className={`text-left pb-1 relative transition ${
                    activeFinancialTab === 'expenses' ? 'opacity-100' : 'opacity-60 hover:opacity-90'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <span className="w-3 h-0.5 bg-rose-500 rounded-full" />
                    Expenses
                  </div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">
                    {formatCurrency(Math.round(filteredExpenses))}
                  </div>
                  {activeFinancialTab === 'expenses' && (
                    <span className="absolute -bottom-5 left-0 right-0 h-0.5 bg-rose-500 rounded-full" />
                  )}
                </button>

                <button
                  onClick={() => setActiveFinancialTab('profit')}
                  className={`text-left pb-1 relative transition ${
                    activeFinancialTab === 'profit' ? 'opacity-100' : 'opacity-60 hover:opacity-90'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <span className="w-3 h-0.5 bg-amber-500 rounded-full" />
                    Net profit
                  </div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">
                    {formatCurrency(Math.round(filteredProfit))}
                  </div>
                  {activeFinancialTab === 'profit' && (
                    <span className="absolute -bottom-5 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
                  )}
                </button>
              </div>
            </div>

            {/* Chart Legend & Visual Controls */}
            <div className="flex items-center justify-between mt-5 mb-2 text-xs">
              <div className="flex items-center gap-4">
                {(selectedPeriod === '12m' || selectedPeriod === 'all') && (
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-200" />
                    Last year (2025)
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      activeFinancialTab === 'income'
                        ? 'bg-blue-600'
                        : activeFinancialTab === 'expenses'
                        ? 'bg-rose-500'
                        : 'bg-amber-500'
                    }`}
                  />
                  {activeFinancialTab === 'income'
                    ? 'Income (₹)'
                    : activeFinancialTab === 'expenses'
                    ? 'Expenses (₹)'
                    : 'Net Profit (₹)'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                {selectedPeriod === '24h'
                  ? 'Hourly Breakdown'
                  : selectedPeriod === '7d'
                  ? 'Daily Breakdown'
                  : selectedPeriod === '30d'
                  ? 'Weekly Breakdown'
                  : 'Monthly Comparison (₹)'}
              </span>
            </div>

            {/* Dual Bar Comparison Chart */}
            <div className="h-72 w-full pt-2">
              {!monthlyFinancialData.hasRecords ? (
                <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <Receipt className="w-10 h-10 text-slate-300 mb-2" />
                  <div className="text-sm font-semibold text-slate-700">No Financial Records in this Period</div>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Upload your sales and expenses datasets to generate real-time monthly performance comparisons.
                  </p>
                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                  >
                    + Upload Datasets
                  </button>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyFinancialData.list} barGap={4} barCategoryGap="20%">
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickFormatter={val => {
                        if (val === 0) return '₹0'
                        const abs = Math.abs(val)
                        const sign = val < 0 ? '-' : ''
                        if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(1)}Cr`
                        if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`
                        if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(0)}k`
                        return `${sign}₹${abs}`
                      }}
                    />
                    <Tooltip
                      formatter={(value: any, name: any) => [
                        formatCurrency(Number(value)),
                        name === 'lastYear'
                          ? 'Last Year (2025)'
                          : activeFinancialTab === 'income'
                          ? 'Income'
                          : activeFinancialTab === 'expenses'
                          ? 'Expenses'
                          : 'Net Profit',
                      ]}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        borderRadius: 12,
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                      }}
                    />
                    {(selectedPeriod === '12m' || selectedPeriod === 'all') && (
                      <Bar
                        dataKey={activeFinancialTab === 'income' ? 'lastYear' : activeFinancialTab === 'expenses' ? 'lastYearExpenses' : 'lastYear'}
                        fill="#bae6fd"
                        radius={[4, 4, 0, 0]}
                        name="lastYear"
                      />
                    )}
                    <Bar
                      dataKey={activeFinancialTab === 'income' ? 'thisYear' : activeFinancialTab === 'expenses' ? 'expenses' : 'profit'}
                      fill={activeFinancialTab === 'income' ? '#2563eb' : activeFinancialTab === 'expenses' ? '#f43f5e' : '#f59e0b'}
                      radius={[4, 4, 0, 0]}
                      name="thisYear"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Lower Split: Product Sales Donut & Expenses Progress Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product sales Donut */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-card flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">Product sales</h3>
                <Link to="/sales" className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium">
                  View all <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {categoryRevenuePie.length === 0 ? (
                <div className="h-32 w-full flex flex-col items-center justify-center text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl my-auto">
                  <span>No product sales recorded yet</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 sm:gap-4 my-auto">
                  {/* Donut Chart */}
                  <div className="w-28 h-28 sm:w-32 sm:h-32 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryRevenuePie}
                          cx="50%"
                          cy="50%"
                          innerRadius={28}
                          outerRadius={48}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {categoryRevenuePie.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Structured Legend with Figures - Safe Padding & Spacing */}
                  <div className="flex-1 min-w-0 space-y-2.5 pr-1">
                    {categoryRevenuePie.slice(0, 4).map(item => (
                      <div key={item.name} className="flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-600 truncate font-medium text-[11px] sm:text-xs">{item.name}</span>
                        </div>
                        <span className="font-semibold text-slate-900 shrink-0 text-[11px] sm:text-xs">
                          {formatCurrency(item.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Expenses Breakdown with Progress Bars */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-card flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">Expenses breakdown</h3>
                <Link to="/expenses" className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium">
                  Manage <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {expenseCategoriesBreakdown.length === 0 ? (
                <div className="h-32 w-full flex flex-col items-center justify-center text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl my-auto">
                  <span>No expenses recorded yet</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {expenseCategoriesBreakdown.slice(0, 4).map(exp => (
                    <div key={exp.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">{exp.name}</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(exp.amount)}</span>
                      </div>
                      {/* Visual Progress Bar */}
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, exp.percentage * 2.2)}%`,
                            backgroundColor: exp.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Transactions Feed */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Transactions feed</h3>
                <p className="text-[11px] text-slate-400">Live feed across all Indian store hubs</p>
              </div>
              <Link to="/sales" className="text-xs text-blue-600 hover:underline font-medium">
                See all
              </Link>
            </div>

            {/* List of Transactions */}
            <div className="space-y-3.5 overflow-y-auto max-h-[580px] pr-1">
              {(periodFilteredTransactions.length > 0 ? periodFilteredTransactions : transactions).length === 0 ? (
                <div className="py-14 flex flex-col items-center justify-center text-center border border-dashed border-slate-200 rounded-xl">
                  <ShoppingCart className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-600">No transactions in this period</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Change period filter or record a sale.</p>
                </div>
              ) : (
                (periodFilteredTransactions.length > 0 ? periodFilteredTransactions : transactions).slice(0, 8).map(tx => {
                  const isIncome = tx.type === 'income'
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition group"
                    >
                      {/* Badge Icon */}
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isIncome
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                          }`}
                        >
                          {isIncome ? '+' : '-'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 truncate group-hover:text-blue-600 transition">
                            {tx.description}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {tx.date} • {tx.paymentMethod}
                          </div>
                        </div>
                      </div>

                      {/* Amount formatted in INR */}
                      <div className="text-right shrink-0">
                        <div
                          className={`text-xs font-bold ${
                            isIncome ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isIncome ? '+ ' : '- '}
                          {formatCurrency(tx.amount)}
                        </div>
                        <div className="text-[10px] text-slate-400">{tx.storeName.split('#')[0]}</div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* AI Recommendations Quick Card */}
          {criticalRecs.length > 0 && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-slate-900 dark:to-amber-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 p-5 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Critical Restock Alert
                </div>
                <StatusBadge label="Urgent" variant="danger" size="sm" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                {criticalRecs[0].title}
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                {criticalRecs[0].explanation}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                  {criticalRecs[0].metric}
                </span>
                <Link
                  to="/recommendations"
                  className="px-3 py-1 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition"
                >
                  Review Action
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
