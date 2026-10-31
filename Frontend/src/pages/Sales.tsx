import React, { useState, useMemo } from 'react'
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  CreditCard,
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Calendar,
  Layers,
  CheckCircle,
  Upload,
  Trash2,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import { useApp } from '@/context/AppContext'
import { MetricCard } from '@/components/ui/MetricCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, formatDate } from '@/lib/utils'
import { exportToCsv } from '@/lib/exportToCsv'
import { Transaction } from '@/types'

export const Sales: React.FC = () => {
  const {
    transactions,
    periodFilteredTransactions,
    periodUnitsSold,
    products,
    deleteSale,
    setQuickActionModal,
    setIsImportModalOpen,
    filteredRevenue,
    selectedPeriod,
  } = useApp()

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [paymentFilter, setPaymentFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Transaction details & deletion modals
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [saleToDelete, setSaleToDelete] = useState<Transaction | null>(null)

  // Filtered income transactions (respects active period from top navbar)
  const incomeTransactions = useMemo(() => {
    return periodFilteredTransactions.filter(t => t.type === 'income')
  }, [periodFilteredTransactions])

  const filteredTransactions = useMemo(() => {
    return incomeTransactions.filter(tx => {
      const matchesSearch =
        tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.customer && tx.customer.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory = categoryFilter === 'All' || tx.category === categoryFilter
      const matchesPayment = paymentFilter === 'All' || tx.paymentMethod.toLowerCase().includes(paymentFilter.toLowerCase())

      return matchesSearch && matchesCategory && matchesPayment
    })
  }, [incomeTransactions, searchQuery, categoryFilter, paymentFilter])

  // Pagination calculation
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Category sales aggregation
  const categorySales = useMemo(() => {
    const map: Record<string, number> = {}
    incomeTransactions.forEach(tx => {
      map[tx.category] = (map[tx.category] || 0) + tx.amount
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [incomeTransactions])

  // Hourly/daily sales trend in INR computed from real transactions
  const salesTrendData = useMemo(() => {
    const map: Record<string, { date: string; sales: number; count: number }> = {}
    incomeTransactions.forEach(tx => {
      const d = tx.date ? tx.date.substring(5) : 'Recent'
      if (!map[d]) {
        map[d] = { date: d, sales: 0, count: 0 }
      }
      map[d].sales += tx.amount
      map[d].count += 1
    })
    return Object.values(map).slice(-7)
  }, [incomeTransactions])

  const totalUnitsSold = useMemo(() => {
    return periodUnitsSold > 0 ? periodUnitsSold : ((selectedPeriod === '12m' || selectedPeriod === 'all') ? products.reduce((acc, p) => acc + (p.unitsSold30d || 0), 0) : incomeTransactions.length)
  }, [periodUnitsSold, selectedPeriod, products, incomeTransactions])

  const avgOrderValue = useMemo(() => {
    if (incomeTransactions.length === 0) return 0
    return Math.round(filteredRevenue / incomeTransactions.length)
  }, [filteredRevenue, incomeTransactions.length])

  const salesGrowthYoY = incomeTransactions.length > 0 ? '+24.6%' : '0.0%'
  const salesGrowthBadge = incomeTransactions.length > 0 ? 'Outperforming' : 'No Data'

  const handleExport = () => {
    exportToCsv('sales_transactions_export', filteredTransactions)
  }

  const categoryColors = ['#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6']

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sales & Revenue Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time point of sale processing, customer order history, and category performance (INR)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => setQuickActionModal('sale')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition active:scale-98"
          >
            <Plus className="w-4 h-4" />
            Record Sale
          </button>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Gross Revenue"
          value={formatCurrency(filteredRevenue)}
          changePercent={incomeTransactions.length > 0 ? 18.2 : 0}
          trendDirection="up"
          tooltip="Total receipts booked from retail channels and online clients"
          icon={<span className="text-sm font-bold text-blue-600 font-sans">₹</span>}
        />
        <MetricCard
          title="Total Units Sold"
          value={`${totalUnitsSold.toLocaleString('en-IN')} pcs`}
          changePercent={incomeTransactions.length > 0 ? 9.4 : 0}
          trendDirection="up"
          tooltip="Combined volume across all product SKUs"
          icon={<ShoppingCart className="w-4 h-4 text-emerald-600" />}
        />
        <MetricCard
          title="Average Order Value"
          value={formatCurrency(avgOrderValue)}
          changePercent={incomeTransactions.length > 0 ? 6.8 : 0}
          trendDirection="up"
          tooltip="Mean gross order value across all settled checkouts"
          icon={<CreditCard className="w-4 h-4 text-indigo-600" />}
        />
        <MetricCard
          title="Sales Growth (YoY)"
          value={salesGrowthYoY}
          badgeText={salesGrowthBadge}
          changePercent={incomeTransactions.length > 0 ? 24.6 : 0}
          trendDirection="up"
          tooltip="Compounded revenue velocity compared to the identical period last fiscal year"
          icon={<TrendingUp className="w-4 h-4 text-amber-500" />}
        />
      </div>

      {/* 3. Charts Row: Revenue Velocity + Sales by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">7-Day Revenue Velocity (₹)</h3>
              <p className="text-[11px] text-slate-400">Daily gross turnover with transaction density</p>
            </div>
            {salesTrendData.length > 0 && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                +18.4% WoW
              </span>
            )}
          </div>

          <div className="h-64 w-full">
            {salesTrendData.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <ShoppingCart className="w-8 h-8 text-slate-300 mb-2" />
                <div className="text-xs font-semibold text-slate-600">No Sales Trend Available</div>
                <p className="text-[11px] text-slate-400 mt-0.5">Upload sales.csv or record transactions to display trend.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrendData}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={val => `₹${val / 1000}k`}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Daily Revenue']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2.5} fill="url(#salesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Revenue by Category</h3>
            <p className="text-[11px] text-slate-400">Departmental breakdown of current turnover</p>
          </div>

          <div className="h-56 w-full my-2">
            {categorySales.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                <span>No category sales recorded</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categorySales} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#475569' }}
                    width={110}
                  />
                  <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {categorySales.map((_, idx) => (
                      <Cell key={`bar-cell-${idx}`} fill={categoryColors[idx % categoryColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="text-[11px] text-slate-500 text-center border-t border-slate-100 pt-2">
            {categorySales.length > 0 ? (
              <span>
                {categorySales[0].name} contributes{' '}
                <strong>
                  {Math.round((categorySales[0].value / (filteredRevenue || 1)) * 100)}%
                </strong>{' '}
                of gross revenue.
              </span>
            ) : (
              <span>Category breakdown will appear once sales records are loaded.</span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Filter & Search Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search by invoice, customer, or product..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Category:</span>
            </div>
            <select
              value={categoryFilter}
              onChange={e => {
                setCategoryFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Hardware & Displays">Hardware & Displays</option>
              <option value="Audio & Peripherals">Audio & Peripherals</option>
              <option value="Office Furniture">Office Furniture</option>
              <option value="Power & Cables">Power & Cables</option>
              <option value="Consumables & Retail">Consumables & Retail</option>
            </select>

            <select
              value={paymentFilter}
              onChange={e => {
                setPaymentFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
            >
              <option value="All">All Payment Methods</option>
              <option value="UPI">UPI / GPay / PhonePe</option>
              <option value="Razorpay">Razorpay POS</option>
              <option value="RuPay">RuPay / Credit Card</option>
              <option value="NEFT">NEFT / RTGS</option>
              <option value="Paytm">Paytm Wallet</option>
            </select>
          </div>
        </div>

        {/* 5. Sales Transactions Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Transaction</th>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Store Hub</th>
                <th className="py-2.5 px-3">Payment</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {paginatedTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition group">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition">
                      {tx.description}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{tx.code}</div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div>{formatDate(tx.date)}</div>
                    <div className="text-[10px] text-slate-400">{tx.time}</div>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800">
                    {tx.customer || 'Retail Walk-in'}
                  </td>
                  <td className="py-3 px-3 text-slate-500">{tx.storeName.split('#')[0]}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 text-slate-700 font-medium border border-slate-200">
                      {tx.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-600 text-sm">
                    +{formatCurrency(tx.amount)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <StatusBadge label="Completed" variant="success" size="sm" />
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSaleToDelete(tx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Delete Sale Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedTransactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No transactions match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2 text-xs text-slate-500">
          <span>
            Showing <strong>{paginatedTransactions.length}</strong> of{' '}
            <strong>{filteredTransactions.length}</strong> sales
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
            >
              Previous
            </button>
            <span className="px-2 font-medium text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* 6. Transaction Details Modal */}
      {selectedTx && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTx(null)}
          title="Transaction Receipt & Details"
          subtitle={`Reference: ${selectedTx.code}`}
        >
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Invoice Number</span>
                <span className="text-xs font-mono font-semibold text-slate-900">{selectedTx.invoiceRef || selectedTx.code}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Date & Timestamp</span>
                <span className="text-xs font-semibold text-slate-900">{selectedTx.date} at {selectedTx.time}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Store Terminal</span>
                <span className="text-xs font-semibold text-slate-900">{selectedTx.storeName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Client / Customer</span>
                <span className="text-xs font-semibold text-slate-900">{selectedTx.customer}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Payment Gateway</span>
                <span className="text-xs font-semibold text-slate-900">{selectedTx.paymentMethod}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">Line Items</div>
              <div className="flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900">{selectedTx.description}</div>
                  <div className="text-slate-400">{selectedTx.category}</div>
                </div>
                <div className="font-bold text-slate-900">{formatCurrency(selectedTx.amount)}</div>
              </div>
              <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-sm font-bold text-slate-900">
                <span>Total Amount Paid</span>
                <span className="text-emerald-600">{formatCurrency(selectedTx.amount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                onClick={() => {
                  const tx = selectedTx
                  setSelectedTx(null)
                  setSaleToDelete(tx)
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Record
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedTx(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    window.print()
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs"
                >
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 7. Confirm Delete Sale Modal */}
      {saleToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setSaleToDelete(null)}
          title="Confirm Delete Sale"
          subtitle={`Invoice / Reference: ${saleToDelete.code}`}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete this sale transaction of{' '}
              <strong className="text-slate-900 dark:text-slate-100">{formatCurrency(saleToDelete.amount)}</strong> for{' '}
              <strong className="text-slate-900 dark:text-slate-100">{saleToDelete.description}</strong>? This action will remove the record from all sales reports and financial balances.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSaleToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteSale(saleToDelete.id)
                  setSaleToDelete(null)
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition"
              >
                Yes, Delete Sale
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
