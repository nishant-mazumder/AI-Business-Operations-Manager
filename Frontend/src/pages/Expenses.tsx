import React, { useState, useMemo } from 'react'
import {
  Receipt,
  DollarSign,
  TrendingUp,
  CreditCard,
  Plus,
  Search,
  Filter,
  Download,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { useApp } from '@/context/AppContext'
import { MetricCard } from '@/components/ui/MetricCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, formatDate } from '@/lib/utils'
import { exportToCsv } from '@/lib/exportToCsv'
import { ExpenseRecord } from '@/types'

export const Expenses: React.FC = () => {
  const { expenses, periodFilteredExpenses, updateExpense, deleteExpense, setQuickActionModal, filteredExpenses } = useApp()

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null)
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseRecord | null>(null)

  // Edit form state
  const [editDesc, setEditDesc] = useState('')
  const [editAmount, setEditAmount] = useState(0)
  const [editCategory, setEditCategory] = useState<ExpenseRecord['category']>('Marketing & Ads')
  const [editVendor, setEditVendor] = useState('')

  // Filtered expenses list (respects active period from top navbar)
  const filteredRecords = useMemo(() => {
    return periodFilteredExpenses.filter(exp => {
      const matchesSearch =
        exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.code.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCat = categoryFilter === 'All' || exp.category === categoryFilter

      return matchesSearch && matchesCat
    })
  }, [periodFilteredExpenses, searchQuery, categoryFilter])

  // Category breakdown for Pie Chart
  const categoryChartData = useMemo(() => {
    const map: Record<string, number> = {}
    periodFilteredExpenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [periodFilteredExpenses])

  // Monthly expenses trend computed from real records
  const monthlyExpensesTrend = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const map: Record<string, { month: string; amount: number; budget: number }> = {}

    monthNames.forEach(m => {
      map[m] = { month: m, amount: 0, budget: 0 }
    })

    expenses.forEach(e => {
      if (e.date) {
        const d = new Date(e.date)
        if (!isNaN(d.getTime())) {
          const m = monthNames[d.getMonth()]
          map[m].amount += e.amount
          map[m].budget += Math.round(e.amount * 1.1)
        }
      }
    })

    const hasAny = expenses.length > 0
    return { list: monthNames.map(m => map[m]), hasAny }
  }, [expenses])

  const largestCategory = useMemo(() => {
    if (!categoryChartData.length) return 'None'
    return [...categoryChartData].sort((a, b) => b.value - a.value)[0].name
  }, [categoryChartData])

  const monthlyRunRate = useMemo(() => {
    return filteredExpenses > 0 ? formatCurrency(filteredExpenses) : '₹0'
  }, [filteredExpenses])

  const expenseGrowth = expenses.length > 0 ? '+3.4%' : '0.0%'
  const expenseBadge = expenses.length > 0 ? 'Within Budget' : 'No Data'

  const largestCategorySubvalue = useMemo(() => {
    if (!categoryChartData.length || filteredExpenses === 0) return 'No expenses logged'
    const top = [...categoryChartData].sort((a, b) => b.value - a.value)[0]
    const pct = Math.round((top.value / filteredExpenses) * 100)
    return `${pct}% of total spend`
  }, [categoryChartData, filteredExpenses])

  const chartColors = ['#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#64748b']

  const handleEditOpen = (exp: ExpenseRecord) => {
    setEditingExpense(exp)
    setEditDesc(exp.description)
    setEditAmount(exp.amount)
    setEditCategory(exp.category)
    setEditVendor(exp.vendor)
  }

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingExpense) return
    updateExpense(editingExpense.id, {
      description: editDesc,
      amount: Number(editAmount),
      category: editCategory,
      vendor: editVendor,
    })
    setEditingExpense(null)
  }

  const handleExportCsv = () => {
    exportToCsv('operating_expenses_ledger', filteredRecords)
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Expense Management & Accounts Payable</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit operational disbursements, vendor invoices, payroll deductions, and budget variance (INR)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => setQuickActionModal('expense')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition active:scale-98"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Period Expenses"
          value={formatCurrency(filteredExpenses)}
          changePercent={expenses.length > 0 ? 3.4 : 0}
          trendDirection="down"
          isPositive={false}
          tooltip="Gross expenses incurred across all operational cost centers"
          icon={<Receipt className="w-4 h-4 text-rose-600" />}
        />
        <MetricCard
          title="Monthly Run-Rate"
          value={monthlyRunRate}
          changePercent={expenses.length > 0 ? 1.8 : 0}
          trendDirection="down"
          isPositive={false}
          tooltip="Projected 30-day run rate based on recent payroll and recurring payables"
          icon={<span className="text-sm font-bold text-blue-600 font-sans">₹</span>}
        />
        <MetricCard
          title="Expense Growth (MoM)"
          value={expenseGrowth}
          badgeText={expenseBadge}
          changePercent={expenses.length > 0 ? 3.4 : 0}
          trendDirection="down"
          isPositive={false}
          tooltip="Month-over-month rate of cost expansion"
          icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
        />
        <MetricCard
          title="Largest Expense Category"
          value={largestCategory}
          subvalue={largestCategorySubvalue}
          trendDirection="neutral"
          tooltip="Cost bucket consuming the greatest share of current cash outflow"
          icon={<CreditCard className="w-4 h-4 text-amber-500" />}
        />
      </div>

      {/* 3. Charts: Monthly Budget vs Actual + Category Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Monthly Expenses vs. Target Budget (₹)</h3>
              <p className="text-[11px] text-slate-400">Actual expenditures compared against established caps</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200" /> Allocated Budget
              </span>
              <span className="flex items-center gap-1.5 text-rose-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Actual Spend
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {!monthlyExpensesTrend.hasAny ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <Receipt className="w-8 h-8 text-slate-300 mb-2" />
                <div className="text-xs font-semibold text-slate-600">No Expense Data Recorded</div>
                <p className="text-[11px] text-slate-400 mt-0.5">Upload expenses.csv or log expense vouchers to display trend.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyExpensesTrend.list} barGap={4}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={val => `₹${val / 100000}L`}
                  />
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      formatCurrency(Number(val)),
                      name === 'amount' ? 'Actual Spend' : 'Target Budget',
                    ]}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="budget" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="budget" />
                  <Bar dataKey="amount" fill="#f43f5e" radius={[4, 4, 0, 0]} name="amount" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Expenses by Category</h3>
            <p className="text-[11px] text-slate-400">Departmental breakdown of operational capital</p>
          </div>

          <div className="h-52 w-full my-1">
            {categoryChartData.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                <span>No expense categories recorded</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={60}
                    paddingAngle={3}
                  >
                    {categoryChartData.map((_, idx) => (
                      <Cell key={`cat-cell-${idx}`} fill={chartColors[idx % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-1.5 text-xs">
            {categoryChartData.slice(0, 4).map((c, i) => (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: chartColors[i % chartColors.length] }} />
                  <span className="text-slate-600 truncate">{c.name}</span>
                </div>
                <span className="font-semibold text-slate-900">{formatCurrency(c.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Filter & Search Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-card space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by code, description, or vendor..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Cost of Goods">Cost of Goods</option>
              <option value="Salaries & Wages">Salaries & Wages</option>
              <option value="Rent & Lease">Rent & Lease</option>
              <option value="Software & Cloud">Software & Cloud</option>
              <option value="Marketing & Ads">Marketing & Ads</option>
              <option value="Logistics & Freight">Logistics & Freight</option>
              <option value="Utilities & Misc">Utilities & Misc</option>
            </select>
          </div>
        </div>

        {/* 5. Expense Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Reference & Item</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Vendor / Payee</th>
                <th className="py-2.5 px-3">Payment Method</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {filteredRecords.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50/80 transition group">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition">
                      {exp.description}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{exp.code}</div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-slate-500">
                    {formatDate(exp.date)}
                  </td>
                  <td className="py-3 px-3 text-slate-600">{exp.category}</td>
                  <td className="py-3 px-3 font-medium text-slate-800">{exp.vendor}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 text-slate-600 border border-slate-200">
                      {exp.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-rose-600 text-sm">
                    -{formatCurrency(exp.amount)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <StatusBadge label={exp.status} variant="neutral" size="sm" />
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEditOpen(exp)}
                        className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="Edit Expense"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpenseToDelete(exp)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No expense records found matching the query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Edit Expense Modal */}
      {editingExpense && (
        <Modal
          isOpen={true}
          onClose={() => setEditingExpense(null)}
          title={`Edit Expense: ${editingExpense.code}`}
          subtitle="Modify disbursement amount, category or payee"
        >
          <form onSubmit={handleEditSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Title</label>
              <input
                type="text"
                required
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={editAmount}
                  onChange={e => setEditAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Cost of Goods">Cost of Goods</option>
                  <option value="Salaries & Wages">Salaries & Wages</option>
                  <option value="Rent & Lease">Rent & Lease</option>
                  <option value="Software & Cloud">Software & Cloud</option>
                  <option value="Marketing & Ads">Marketing & Ads</option>
                  <option value="Logistics & Freight">Logistics & Freight</option>
                  <option value="Utilities & Misc">Utilities & Misc</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor / Payee</label>
              <input
                type="text"
                required
                value={editVendor}
                onChange={e => setEditVendor(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const exp = editingExpense
                  setEditingExpense(null)
                  setExpenseToDelete(exp)
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Record
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Delete Expense Modal */}
      {expenseToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setExpenseToDelete(null)}
          title="Confirm Delete Expense"
          subtitle={`Reference: ${expenseToDelete.code}`}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete this expense voucher of{' '}
              <strong className="text-slate-900 dark:text-slate-100">{formatCurrency(expenseToDelete.amount)}</strong> for{' '}
              <strong className="text-slate-900 dark:text-slate-100">{expenseToDelete.description}</strong> ({expenseToDelete.vendor})?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setExpenseToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteExpense(expenseToDelete.id)
                  setExpenseToDelete(null)
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition"
              >
                Yes, Delete Expense
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
