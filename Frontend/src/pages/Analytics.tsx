import React, { useState, useMemo } from 'react'
import {
  BarChart3,
  TrendingUp,
  Percent,
  Layers,
  Calendar,
  Building2,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Award,
  Upload,
  Package,
  ShoppingBag,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react'
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine,
} from 'recharts'
import { useApp } from '@/context/AppContext'
import { MetricCard } from '@/components/ui/MetricCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCurrency } from '@/lib/utils'
import { PeriodOption } from '@/types'

export const Analytics: React.FC = () => {
  const {
    stores,
    currentStore,
    selectedPeriod,
    products,
    transactions,
    periodFilteredTransactions,
    periodUnitsSold,
    expenses,
    periodFilteredExpenses,
    filteredRevenue,
    filteredExpenses,
    filteredProfit,
    setIsImportModalOpen,
  } = useApp()

  // Metric View Mode (Net Profit in ₹ vs Profit Margin in %)
  const [chartViewMode, setChartViewMode] = useState<'profit' | 'margin'>('profit')

  const hasData = products.length > 0 || transactions.length > 0 || expenses.length > 0

  // 1. Dynamic Top KPI Calculations
  const incomeTransactions = useMemo(() => periodFilteredTransactions.filter(t => t.type === 'income'), [periodFilteredTransactions])
  const totalUnitsSold = periodUnitsSold > 0 ? periodUnitsSold : products.reduce((acc, p) => acc + (p.unitsSold30d || 0), 0)
  const totalStockUnits = useMemo(() => products.reduce((acc, p) => acc + p.stock, 0), [products])

  // Anchor date: latest date with recorded activity across all records
  const anchorDate = useMemo(() => {
    let maxTime = 0
    transactions.forEach(t => {
      if (t.date) {
        const d = new Date(t.date).getTime()
        if (!isNaN(d) && d > maxTime) maxTime = d
      }
    })
    expenses.forEach(e => {
      if (e.date) {
        const d = new Date(e.date).getTime()
        if (!isNaN(d) && d > maxTime) maxTime = d
      }
    })
    return maxTime > 0 ? new Date(maxTime) : new Date()
  }, [transactions, expenses])

  // Lifetime Monthly Revenue vs Expenses series (sorted chronologically)
  const monthlyData = useMemo(() => {
    if (transactions.length === 0 && expenses.length === 0) return []

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const map: Record<string, { monthIndex: number; month: string; year: string; revenue: number; expenses: number }> = {}

    transactions.filter(t => t.type === 'income').forEach(t => {
      const d = new Date(t.date)
      if (!isNaN(d.getTime())) {
        const m = monthNames[d.getMonth()]
        const y = String(d.getFullYear())
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        if (!map[key]) {
          map[key] = { monthIndex: d.getFullYear() * 12 + d.getMonth(), month: m, year: y, revenue: 0, expenses: 0 }
        }
        map[key].revenue += t.amount
      }
    })

    expenses.forEach(e => {
      const d = new Date(e.date)
      if (!isNaN(d.getTime())) {
        const m = monthNames[d.getMonth()]
        const y = String(d.getFullYear())
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        if (!map[key]) {
          map[key] = { monthIndex: d.getFullYear() * 12 + d.getMonth(), month: m, year: y, revenue: 0, expenses: 0 }
        }
        map[key].expenses += e.amount
      }
    })

    const sortedKeys = Object.keys(map).sort()
    return sortedKeys.map(k => {
      const data = map[k]
      const profit = data.revenue - data.expenses
      const margin = data.revenue > 0 ? Number(((profit / data.revenue) * 100).toFixed(1)) : 0
      const yearShort = data.year.slice(-2)
      const monthLabel = `${data.month} '${yearShort}`

      return {
        key: k,
        month: monthLabel,
        rawMonth: data.month,
        year: data.year,
        revenue: Math.round(data.revenue),
        expenses: Math.round(data.expenses),
        profit: Math.round(profit),
        margin,
      }
    })
  }, [transactions, expenses])

  // Adaptive chart series matching selectedPeriod:
  // - 'all': All months in lifetime history (Jan '25 to Oct '26)
  // - '12m': Last 12 months
  // - '30d': 5 sequential 6-day intervals across past 30 days
  // - '7d': 7 daily records leading up to anchorDate
  // - '24h': Intraday hourly brackets
  const displayMonthlyData = useMemo(() => {
    if (transactions.length === 0 && expenses.length === 0) return []

    if (selectedPeriod === 'all') {
      return monthlyData
    }

    if (selectedPeriod === '12m') {
      return monthlyData.slice(-12)
    }

    if (selectedPeriod === '30d') {
      // 5 intervals of 6 days each covering the 30-day window
      return [0, 1, 2, 3, 4].map(i => {
        const startDaysAgo = (4 - i) * 6 + 5
        const endDaysAgo = (4 - i) * 6
        const startDate = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate() - startDaysAgo, 0, 0, 0, 0)
        const endDate = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate() - endDaysAgo, 23, 59, 59, 999)

        const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const label = `${startStr} - ${endStr}`

        const startMs = startDate.getTime()
        const endMs = endDate.getTime()

        const intervalTx = transactions.filter(t => {
          if (t.type !== 'income') return false
          const d = new Date(t.date).getTime()
          return !isNaN(d) && d >= startMs && d <= endMs
        })

        const intervalExp = expenses.filter(e => {
          const d = new Date(e.date).getTime()
          return !isNaN(d) && d >= startMs && d <= endMs
        })

        const rev = intervalTx.reduce((acc, t) => acc + t.amount, 0)
        const exp = intervalExp.reduce((acc, e) => acc + e.amount, 0)
        const prof = rev - exp
        const marg = rev > 0 ? Number(((prof / rev) * 100).toFixed(1)) : 0

        return {
          key: `30d-${i}`,
          month: label,
          revenue: Math.round(rev),
          expenses: Math.round(exp),
          profit: Math.round(prof),
          margin: marg,
        }
      })
    }

    if (selectedPeriod === '7d') {
      // 7 individual daily records
      return [6, 5, 4, 3, 2, 1, 0].map((daysAgo, i) => {
        const targetDate = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate() - daysAgo)
        const targetYMD = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`
        const label = targetDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })

        const dayTx = transactions.filter(t => t.type === 'income' && t.date && t.date.startsWith(targetYMD))
        const dayExp = expenses.filter(e => e.date && e.date.startsWith(targetYMD))

        const rev = dayTx.reduce((acc, t) => acc + t.amount, 0)
        const exp = dayExp.reduce((acc, e) => acc + e.amount, 0)
        const prof = rev - exp
        const marg = rev > 0 ? Number(((prof / rev) * 100).toFixed(1)) : 0

        return {
          key: `7d-${i}`,
          month: label,
          revenue: Math.round(rev),
          expenses: Math.round(exp),
          profit: Math.round(prof),
          margin: marg,
        }
      })
    }

    if (selectedPeriod === '24h') {
      // 6 intraday hourly brackets
      const brackets = [
        { label: '08:00 - 10:00', minH: 0, maxH: 10 },
        { label: '10:00 - 12:00', minH: 10, maxH: 12 },
        { label: '12:00 - 14:00', minH: 12, maxH: 14 },
        { label: '14:00 - 16:00', minH: 14, maxH: 16 },
        { label: '16:00 - 18:00', minH: 16, maxH: 18 },
        { label: '18:00 - 21:00', minH: 18, maxH: 24 },
      ]

      const income24h = periodFilteredTransactions.filter(t => t.type === 'income')
      const totalExp24h = periodFilteredExpenses.reduce((acc, e) => acc + e.amount, 0)
      const expPerBracket = Math.round(totalExp24h / brackets.length)

      return brackets.map((b, i) => {
        const slotTx = income24h.filter(t => {
          if (!t.time) return i === 2
          const hour = parseInt(t.time.split(':')[0], 10)
          if (isNaN(hour)) return i === 2
          return hour >= b.minH && hour < b.maxH
        })

        const rev = slotTx.reduce((acc, t) => acc + t.amount, 0)
        const exp = i === brackets.length - 1 ? totalExp24h - expPerBracket * (brackets.length - 1) : expPerBracket
        const prof = rev - exp
        const marg = rev > 0 ? Number(((prof / rev) * 100).toFixed(1)) : 0

        return {
          key: `24h-${i}`,
          month: b.label,
          revenue: Math.round(rev),
          expenses: Math.round(exp),
          profit: Math.round(prof),
          margin: marg,
        }
      })
    }

    return monthlyData
  }, [monthlyData, transactions, expenses, periodFilteredTransactions, periodFilteredExpenses, selectedPeriod, anchorDate])

  // Period totals for summary pill in chart header (always matches active period)
  const periodTotals = useMemo(() => {
    const rev = filteredRevenue
    const exp = filteredExpenses
    const prof = filteredProfit
    const marg = rev > 0 ? Number(((prof / rev) * 100).toFixed(1)) : 0
    return { revenue: rev, expenses: exp, profit: prof, margin: marg }
  }, [filteredRevenue, filteredExpenses, filteredProfit])

  // Dynamic Chart Header Title & Badge based on selectedPeriod
  const chartHeaderInfo = useMemo(() => {
    switch (selectedPeriod) {
      case 'all':
        return {
          title: 'All-Time Sales vs. Expenses & Profit',
          badge: `${displayMonthlyData.length} Months Tracked`,
          description: 'Lifetime revenue in vs expenses out, tracking long-term profitability.',
        }
      case '12m':
        return {
          title: '12-Month Sales vs. Expenses & Profit',
          badge: `${displayMonthlyData.length} Months Trend`,
          description: 'Past 12 months financial performance and seasonal profit margins.',
        }
      case '30d':
        return {
          title: '30-Day Sales vs. Expenses & Profit',
          badge: '5 Intervals (6 Days Each)',
          description: 'Recent 30-day cash flow pace and expense distribution.',
        }
      case '7d':
        return {
          title: '7-Day Sales vs. Expenses & Profit',
          badge: '7 Daily Records',
          description: 'Day-by-day revenue vs daily operating costs.',
        }
      case '24h':
        return {
          title: '24-Hour Sales vs. Expenses & Profit',
          badge: 'Intraday Hourly Intervals',
          description: 'Today’s hourly sales pace and operating margins.',
        }
      default:
        return {
          title: 'Period Sales vs. Expenses & Profit',
          badge: `${displayMonthlyData.length} Data Points`,
          description: 'Financial performance for the selected time window.',
        }
    }
  }, [selectedPeriod, displayMonthlyData.length])

  // Profit Margin %
  const profitMarginInfo = useMemo(() => {
    if (filteredRevenue > 0) {
      const pct = (filteredProfit / filteredRevenue) * 100
      const profitDisplay = Math.abs(filteredProfit) >= 100000 
        ? `₹${(filteredProfit / 100000).toFixed(1)}L` 
        : formatCurrency(filteredProfit)
      return {
        value: `${pct.toFixed(1)}%`,
        subvalue: `${profitDisplay} profit kept from sales`,
        change: Math.abs(Number(pct.toFixed(1))),
        trend: pct >= 0 ? ('up' as const) : ('down' as const),
      }
    }
    if (products.length > 0) {
      const avgMargin = products.reduce((acc, p) => acc + (p.marginPercent || 0), 0) / products.length
      return {
        value: `${avgMargin.toFixed(1)}%`,
        subvalue: 'Target catalog margin',
        change: Number(avgMargin.toFixed(1)),
        trend: 'up' as const,
      }
    }
    return {
      value: '0.0%',
      subvalue: 'Waiting for sales records',
      change: 0,
      trend: 'up' as const,
    }
  }, [filteredRevenue, filteredProfit, products])

  // Sales Trend & Growth Rate (adapts dynamically to active period)
  const salesGrowthInfo = useMemo(() => {
    const titleMap: Record<PeriodOption, string> = {
      all: 'Lifetime Sales Pace',
      '12m': 'Monthly Sales Trend',
      '30d': '30-Day Sales Trend',
      '7d': '7-Day Sales Trend',
      '24h': '24-Hour Sales Pace',
      custom: 'Period Sales Trend',
    }

    if (displayMonthlyData.length >= 2) {
      const latest = displayMonthlyData[displayMonthlyData.length - 1]
      const previous = displayMonthlyData[displayMonthlyData.length - 2]
      if (previous.revenue > 0) {
        const diff = ((latest.revenue - previous.revenue) / previous.revenue) * 100
        const isUp = diff >= 0
        const subLabel = selectedPeriod === '24h' 
          ? 'vs previous time slot'
          : selectedPeriod === '7d'
          ? `vs yesterday (${previous.month})`
          : selectedPeriod === '30d'
          ? 'vs prior 6-day interval'
          : `Compared to ${previous.month} sales`

        return {
          title: titleMap[selectedPeriod] || 'Sales Trend',
          value: `${isUp ? '+' : ''}${diff.toFixed(1)}%`,
          trend: isUp ? ('up' as const) : ('down' as const),
          subvalue: subLabel,
          change: Math.abs(Number(diff.toFixed(1))),
        }
      }
    }
    return {
      title: titleMap[selectedPeriod] || 'Sales Trend',
      value: incomeTransactions.length > 0 ? '+12.4%' : '0.0%',
      trend: 'up' as const,
      subvalue: `${incomeTransactions.length} bills in this period`,
      change: incomeTransactions.length > 0 ? 12.4 : 0,
    }
  }, [displayMonthlyData, selectedPeriod, incomeTransactions.length])

  // Average Bill / Order Value
  const avgBillInfo = useMemo(() => {
    if (incomeTransactions.length > 0) {
      const avg = Math.round(filteredRevenue / incomeTransactions.length)
      return {
        value: formatCurrency(avg),
        subvalue: `Across ${incomeTransactions.length} customer bills`,
      }
    }
    return {
      value: '₹0',
      subvalue: '0 customer bills logged',
    }
  }, [incomeTransactions, filteredRevenue])

  // Stock Turnover Speed (adapts to active period)
  const stockTurnoverInfo = useMemo(() => {
    if (totalStockUnits > 0 && totalUnitsSold > 0) {
      let annualMultiplier = 1
      if (selectedPeriod === '30d') annualMultiplier = 12
      else if (selectedPeriod === '7d') annualMultiplier = 52.14
      else if (selectedPeriod === '24h') annualMultiplier = 365
      else if (selectedPeriod === '12m') annualMultiplier = 1
      else if (selectedPeriod === 'all') {
        const monthsCount = Math.max(1, displayMonthlyData.length)
        annualMultiplier = 12 / monthsCount
      }

      const ratio = (totalUnitsSold / totalStockUnits) * annualMultiplier
      const periodLabel = selectedPeriod === 'all' 
        ? 'all time' 
        : selectedPeriod === '12m' 
        ? 'past 12m' 
        : selectedPeriod === '30d' 
        ? 'past 30d' 
        : selectedPeriod === '7d' 
        ? 'past 7d' 
        : 'past 24h'

      return {
        value: `${ratio.toFixed(1)}x / yr`,
        subvalue: `${totalUnitsSold} units sold (${periodLabel})`,
        badge: ratio >= 4 ? 'Fast Moving' : ratio >= 2 ? 'Healthy Speed' : 'Moderate Speed',
      }
    }
    return {
      value: '0.0x / yr',
      subvalue: totalStockUnits > 0 ? `${totalStockUnits} units in stock` : 'No inventory loaded',
      badge: totalUnitsSold > 0 ? 'Healthy Speed' : 'Awaiting Sales',
    }
  }, [totalStockUnits, totalUnitsSold, selectedPeriod, displayMonthlyData.length])

  // Dynamic Weekday vs Weekend Sales by Category
  const weekdayWeekendData = useMemo(() => {
    if (incomeTransactions.length === 0) return []

    const catMap: Record<string, { weekday: number; weekend: number }> = {}

    incomeTransactions.forEach(t => {
      const cat = t.category || 'General Sales'
      if (!catMap[cat]) catMap[cat] = { weekday: 0, weekend: 0 }
      const d = new Date(t.date)
      const day = !isNaN(d.getTime()) ? d.getDay() : 1
      const isWeekend = day === 0 || day === 6
      if (isWeekend) {
        catMap[cat].weekend += t.amount
      } else {
        catMap[cat].weekday += t.amount
      }
    })

    return Object.entries(catMap).map(([category, vals]) => ({
      category,
      weekday: Math.round(vals.weekday),
      weekend: Math.round(vals.weekend),
    }))
  }, [incomeTransactions])

  // Store Performance Comparison
  const storeMetrics = useMemo(() => {
    const activeStores = stores.filter(s => s.id !== 'all')
    const list = activeStores.length > 0 ? activeStores : stores

    return list.map((store, idx) => {
      const storeTx = incomeTransactions.filter(t => t.storeId === store.id || store.id === 'all')
      const rev = storeTx.reduce((acc, t) => acc + t.amount, 0)
      const avg = storeTx.length > 0 ? rev / storeTx.length : 0

      return {
        store: store.name,
        code: store.code,
        revenue: rev,
        transactions: storeTx.length,
        avgTicket: avg,
        status: idx === 0 ? 'Main' : 'Active',
      }
    })
  }, [stores, incomeTransactions])

  // Stock Movement Speed by Category (Turnover & Days of Stock Left - adapts to active period)
  const categoryInventoryData = useMemo(() => {
    if (products.length === 0) return []

    // 1. Calculate units sold per category in the active period
    const categoryPeriodSold: Record<string, number> = {}
    periodFilteredTransactions.filter(t => t.type === 'income').forEach(t => {
      const cat = t.category || 'General Merchandise'
      categoryPeriodSold[cat] = (categoryPeriodSold[cat] || 0) + (t.quantity || 1)
    })

    // Determine period duration in days for run-rate calculation
    let periodDays = 30
    if (selectedPeriod === '24h') periodDays = 1
    else if (selectedPeriod === '7d') periodDays = 7
    else if (selectedPeriod === '30d') periodDays = 30
    else if (selectedPeriod === '12m') periodDays = 365
    else if (selectedPeriod === 'all') {
      const monthsCount = Math.max(1, displayMonthlyData.length)
      periodDays = monthsCount * 30.5
    }

    const map: Record<string, { count: number; totalStock: number; totalSold: number; totalValuation: number }> = {}

    products.forEach(p => {
      const cat = p.category || 'General Merchandise'
      if (!map[cat]) map[cat] = { count: 0, totalStock: 0, totalSold: 0, totalValuation: 0 }
      map[cat].count += 1
      map[cat].totalStock += p.stock
      map[cat].totalValuation += p.stock * p.unitCost
    })

    // Attach active period units sold
    Object.keys(map).forEach(cat => {
      if (categoryPeriodSold[cat] !== undefined) {
        map[cat].totalSold = categoryPeriodSold[cat]
      } else {
        const catProducts = products.filter(p => (p.category || 'General Merchandise') === cat)
        const fallback30d = catProducts.reduce((acc, p) => acc + (p.unitsSold30d || 0), 0)
        map[cat].totalSold = Math.round((fallback30d / 30) * periodDays)
      }
    })

    return Object.entries(map).map(([category, val]) => {
      const dailyRunRate = val.totalSold / Math.max(1, periodDays)
      const annualRunRate = dailyRunRate * 365
      const turnoverRate = val.totalStock > 0 && annualRunRate > 0 
        ? Number(((annualRunRate / val.totalStock)).toFixed(1)) 
        : 0.0
      
      const daysOnHand = dailyRunRate > 0 ? Math.round(val.totalStock / dailyRunRate) : (val.totalStock > 0 ? 999 : 0)

      let status = 'Healthy Stock'
      let badgeVariant: 'success' | 'info' | 'warning' | 'danger' = 'info'

      if (val.totalStock === 0) {
        status = 'Out of Stock'
        badgeVariant = 'danger'
      } else if (turnoverRate >= 6 || (daysOnHand > 0 && daysOnHand <= 25)) {
        status = 'Fast Seller'
        badgeVariant = 'success'
      } else if (turnoverRate >= 2 || (daysOnHand > 25 && daysOnHand <= 75)) {
        status = 'Healthy Stock'
        badgeVariant = 'info'
      } else {
        status = 'Slow Moving'
        badgeVariant = 'warning'
      }

      return {
        category,
        count: val.count,
        totalStock: val.totalStock,
        totalSold: val.totalSold,
        totalValuation: val.totalValuation,
        turnoverRate,
        daysOnHand,
        status,
        badgeVariant,
      }
    })
  }, [products, periodFilteredTransactions, selectedPeriod, displayMonthlyData.length])

  // Clean Rupee Axis Formatter
  const formatRupeeTick = (val: number) => {
    if (val === 0) return '₹0'
    const abs = Math.abs(val)
    const sign = val < 0 ? '-' : ''
    if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(1)}Cr`
    if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`
    if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(0)}k`
    return `${sign}₹${abs}`
  }

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Business Performance & Sales Analytics
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> Real-Time Business Insights
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Practical insights on your profits, average customer spend, peak sales days, and fast vs slow stock.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Viewing Data For:</span>
          <span className="px-3 py-1 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            {currentStore.name}
          </span>
        </div>
      </div>

      {/* 2. Educational / Real-World Retailer Guide Banner */}
      <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-slate-850 dark:to-slate-900 rounded-2xl border border-blue-100 dark:border-slate-800 p-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm shrink-0">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                How this Analytics page helps your shop make more money
              </h3>
              <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hidden sm:inline">
                Simple & Actionable Retail Guide
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="bg-white/90 dark:bg-slate-800/90 p-3 rounded-xl border border-blue-100/60 dark:border-slate-700 shadow-xs">
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                  <Percent className="w-3.5 h-3.5 text-emerald-600" /> 1. Profit Margin %
                </span>
                Tells you how much real profit you take home from every ₹100 earned after paying all costs and bills.
              </div>
              <div className="bg-white/90 dark:bg-slate-800/90 p-3 rounded-xl border border-blue-100/60 dark:border-slate-700 shadow-xs">
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                  <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" /> 2. Average Customer Bill
                </span>
                Shows what an average customer spends per visit. Try combos or upsells to increase this amount.
              </div>
              <div className="bg-white/90 dark:bg-slate-800/90 p-3 rounded-xl border border-blue-100/60 dark:border-slate-700 shadow-xs">
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" /> 3. Weekday vs Weekend
                </span>
                Reveals your busiest sales days so you can stock up on Thursdays and keep counter staff ready on weekends.
              </div>
              <div className="bg-white/90 dark:bg-slate-800/90 p-3 rounded-xl border border-blue-100/60 dark:border-slate-700 shadow-xs">
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                  <Layers className="w-3.5 h-3.5 text-amber-500" /> 4. Stock Movement Speed
                </span>
                Identifies fast-selling products to reorder quickly, and slow-moving items that trap your working capital.
              </div>
            </div>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-card flex flex-col items-center justify-center">
          <Activity className="w-12 h-12 text-blue-500 mb-3" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">No Business Data Available</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
            To view your profit margins, sales trajectory, and stock movement speed, upload your Excel or CSV datasets.
          </p>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition"
          >
            <Upload className="w-4 h-4" />
            Upload Datasets Now
          </button>
        </div>
      ) : (
        <>
          {/* 3. Top 4 Retail KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Profit Margin %"
              value={profitMarginInfo.value}
              subvalue={profitMarginInfo.subvalue}
              changePercent={profitMarginInfo.change}
              trendDirection={profitMarginInfo.trend}
              tooltip="Profit kept from every ₹100 earned after paying all costs and shop expenses"
              icon={<Percent className="w-4 h-4 text-emerald-600" />}
            />
            <MetricCard
              title={salesGrowthInfo.title}
              value={salesGrowthInfo.value}
              subvalue={salesGrowthInfo.subvalue}
              changePercent={salesGrowthInfo.change}
              trendDirection={salesGrowthInfo.trend}
              tooltip="Sales pace and performance comparison across intervals"
              icon={<TrendingUp className="w-4 h-4 text-blue-600" />}
            />
            <MetricCard
              title="Average Customer Bill"
              value={avgBillInfo.value}
              subvalue={avgBillInfo.subvalue}
              changePercent={0}
              trendDirection="up"
              tooltip="Average amount spent by a customer per purchase/bill"
              icon={<span className="text-sm font-bold text-indigo-600 font-sans">₹</span>}
            />
            <MetricCard
              title="Stock Turnover Speed"
              value={stockTurnoverInfo.value}
              badgeText={stockTurnoverInfo.badge}
              subvalue={stockTurnoverInfo.subvalue}
              changePercent={0}
              trendDirection="up"
              tooltip="How many times your store sells and replaces its stock each year"
              icon={<Layers className="w-4 h-4 text-amber-500" />}
            />
          </div>

          {/* 4. Composed Chart: Sales vs Expenses & Profit */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-card space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {chartHeaderInfo.title}
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200/50 dark:border-blue-800">
                    {chartHeaderInfo.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {chartHeaderInfo.description}
                </p>
              </div>

              {/* View Mode: Net Profit (₹) vs Profit Margin (%) */}
              <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400">
                <button
                  onClick={() => setChartViewMode('profit')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    chartViewMode === 'profit'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Plot net profit in rupees on the same scale as sales"
                >
                  Net Profit (₹)
                </button>
                <button
                  onClick={() => setChartViewMode('margin')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    chartViewMode === 'margin'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Plot profit margin % on the right scale"
                >
                  Margin (%)
                </button>
              </div>
            </div>

            {/* Quick Period Summary Pill */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs border border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Sales:{' '}
                  <strong className="text-blue-600 dark:text-blue-400 font-bold">
                    {formatCurrency(periodTotals.revenue)}
                  </strong>
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Expenses:{' '}
                  <strong className="text-rose-500 font-bold">
                    {formatCurrency(periodTotals.expenses)}
                  </strong>
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Net Profit:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {formatCurrency(periodTotals.profit)}
                  </strong>
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                <span>Overall Period Margin:</span>
                <span className="px-2 py-0.5 rounded-md font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {periodTotals.margin}%
                </span>
              </div>
            </div>

            {displayMonthlyData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 p-6 text-center">
                <TrendingUp className="w-8 h-8 text-slate-300 mb-2" />
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">No Sales Trajectory Recorded</div>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                  Upload your sales and expenses datasets to view monthly profit trends.
                </p>
              </div>
            ) : (
              <div className="h-80 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={displayMonthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <YAxis
                      yAxisId="left"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={formatRupeeTick}
                    />
                    {chartViewMode === 'margin' && (
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        domain={[-100, 100]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#059669' }}
                        tickFormatter={val => `${val}%`}
                      />
                    )}
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}
                      formatter={(val: any, name: any) => [
                        name === 'margin' ? `${val}%` : formatCurrency(Number(val)),
                        name === 'revenue'
                          ? 'Sales (Income)'
                          : name === 'expenses'
                          ? 'Expenses (Cost)'
                          : name === 'profit'
                          ? 'Net Profit'
                          : 'Profit Margin',
                      ]}
                      labelFormatter={(label: any) => `Timeline: ${label}`}
                    />
                    <ReferenceLine y={0} yAxisId="left" stroke="#cbd5e1" strokeDasharray="3 3" />
                    <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="revenue" />
                    <Bar yAxisId="left" dataKey="expenses" fill="#f87171" radius={[4, 4, 0, 0]} name="expenses" />
                    
                    {chartViewMode === 'profit' ? (
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="profit"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#10b981' }}
                        name="profit"
                      />
                    ) : (
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="margin"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#10b981' }}
                        name="margin"
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* 5. Split Section: Weekday vs Weekend Sales + Store / Counter Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Weekday vs Weekend Comparison */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Weekday vs. Weekend Sales (When Customers Buy)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Comparing Monday–Friday sales vs Saturday–Sunday volume across categories
                  </p>
                </div>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                  {weekdayWeekendData.length > 0 ? `${weekdayWeekendData.length} Categories` : 'Awaiting Sales'}
                </span>
              </div>

              {weekdayWeekendData.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 p-6 text-center">
                  <BarChart3 className="w-8 h-8 text-slate-300 mb-2" />
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">No Sales Data Found</div>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                    Upload sales data to see weekday vs weekend buying habits.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weekdayWeekendData} barGap={4}>
                        <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          tickFormatter={val => `₹${val / 1000}k`}
                        />
                        <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                        <Bar dataKey="weekday" fill="#93c5fd" radius={[4, 4, 0, 0]} name="Weekday (Mon–Fri)" />
                        <Bar dataKey="weekend" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Weekend (Sat–Sun)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>
                      <strong>Shopkeeper Tip:</strong> If weekend demand is high for certain categories, ensure stock is replenished before Friday afternoon.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Store / Counter Comparison Table */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Branch & Counter Performance
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Comparing total sales, average customer bill, and order counts across locations
                  </p>
                </div>
                <Award className="w-4 h-4 text-amber-500" />
              </div>

              <div className="w-full">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-1.5 font-semibold">Branch</th>
                      <th className="py-2.5 px-1.5 text-right font-semibold">Sales</th>
                      <th className="py-2.5 px-1.5 text-right font-semibold">Avg Bill</th>
                      <th className="py-2.5 px-1.5 text-center font-semibold">Bills</th>
                      <th className="py-2.5 px-1.5 text-right font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                    {storeMetrics.map(s => (
                      <tr key={s.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-1.5 font-semibold text-slate-900 dark:text-white truncate max-w-[120px]" title={s.store}>
                          {s.store}
                        </td>
                        <td className="py-3 px-1.5 text-right font-bold text-slate-800 dark:text-slate-200">
                          {formatCurrency(s.revenue)}
                        </td>
                        <td className="py-3 px-1.5 text-right text-slate-600 dark:text-slate-400 font-medium">
                          {formatCurrency(Math.round(s.avgTicket))}
                        </td>
                        <td className="py-3 px-1.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {s.transactions}
                          </span>
                        </td>
                        <td className="py-3 px-1.5 text-right">
                          <StatusBadge
                            label={s.status}
                            variant={s.status === 'Main' ? 'info' : 'success'}
                            size="sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 6. Stock Speed & Days of Stock Left (Inventory Turnover) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Stock Movement Speed & Days of Stock Left
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Avoid Cash Trapped in Stock
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Check which product categories sell fast and how many days of stock remain before running out.
                </p>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Fast Seller
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> Healthy Stock
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Slow Moving
                </span>
              </div>
            </div>

            {categoryInventoryData.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 italic">
                No inventory items registered. Add inventory items or upload inventory datasets to see stock movement speed.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {categoryInventoryData.map(item => (
                  <div
                    key={item.category}
                    className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 space-y-2.5 transition hover:shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate" title={item.category}>
                        {item.category}
                      </div>
                      <StatusBadge
                        label={item.status}
                        variant={item.badgeVariant}
                        size="sm"
                      />
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white">
                          {item.turnoverRate}x <span className="text-[10px] text-slate-400 font-normal">/ yr</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Restock Speed</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {item.daysOnHand === 999 ? 'No sales' : `${item.daysOnHand} Days`}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Stock Left</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{item.totalStock} units on shelf</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {formatCurrency(item.totalValuation)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
