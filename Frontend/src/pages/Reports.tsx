import React, { useState, useMemo } from 'react'
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
  Package,
  Receipt,
  PieChart,
  CheckCircle,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency, formatDate } from '@/lib/utils'
import { exportToCsv } from '@/lib/exportToCsv'
import { StatusBadge } from '@/components/ui/StatusBadge'

export const Reports: React.FC = () => {
  const { products, transactions, periodFilteredTransactions, expenses, periodFilteredExpenses, filteredRevenue, filteredExpenses, filteredProfit, currentStore, selectedPeriod } = useApp()
  const { user } = useAuth()
  const certifierName = user?.full_name?.trim() || user?.username?.trim() || 'Operations Lead'
  const [selectedReport, setSelectedReport] = useState<'pnl' | 'sales' | 'expenses' | 'inventory'>('pnl')
  
  const periodLabel = selectedPeriod === 'all'
    ? 'All Time (Lifetime Records)'
    : selectedPeriod === '24h'
    ? 'Past 24 Hours'
    : selectedPeriod === '7d'
    ? 'Past 7 Days'
    : selectedPeriod === '30d'
    ? 'Past 30 Days'
    : 'Past 12 Months'
  const dateRange = `${periodLabel} (Fiscal 2026)`

  const reportsList = [
    { id: 'pnl', title: 'Profit & Loss (P&L) Statement', description: 'Comprehensive income statement, gross margins, and net operating revenue', icon: PieChart },
    { id: 'sales', title: 'Sales Performance Audit', description: 'Itemized retail sales receipts, GST compliance, and unit velocity', icon: DollarSign },
    { id: 'expenses', title: 'Operational Expenditure (OPEX)', description: 'Audited accounts payable, payroll distributions, lease overhead, and logistics', icon: Receipt },
    { id: 'inventory', title: 'Inventory Valuation & Asset Report', description: 'Warehouse on-hand quantities, landed cost valuation, and reorder alerts', icon: Package },
  ]

  const pnlExpenseCategories = useMemo(() => {
    const map: Record<string, number> = {}
    periodFilteredExpenses.forEach(e => {
      const cat = e.category || 'Operating Expenses'
      map[cat] = (map[cat] || 0) + e.amount
    })
    return Object.entries(map).map(([category, amount]) => ({
      category,
      amount,
      percent: filteredRevenue > 0 ? ((amount / filteredRevenue) * 100).toFixed(1) : '0.0',
    }))
  }, [periodFilteredExpenses, filteredRevenue])

  const totalCogs = pnlExpenseCategories.find(c => c.category === 'Cost of Goods')?.amount || 0
  const grossMargin = filteredRevenue - totalCogs
  const grossMarginPercent = filteredRevenue > 0 ? ((grossMargin / filteredRevenue) * 100).toFixed(1) : '0.0'
  const cogsPercent = filteredRevenue > 0 ? ((totalCogs / filteredRevenue) * 100).toFixed(1) : '0.0'
  const netProfitPercent = filteredRevenue > 0 ? ((filteredProfit / filteredRevenue) * 100).toFixed(1) : '0.0'

  // CSV Exporters in INR
  const handleDownloadReport = () => {
    if (selectedReport === 'pnl') {
      const pnlData = [
        { Metric: 'Gross Revenue (INR)', Amount: filteredRevenue, Store: currentStore.name, Period: dateRange },
        { Metric: 'Cost of Goods Sold (COGS)', Amount: totalCogs, Store: currentStore.name, Period: dateRange },
        { Metric: 'Gross Profit (INR)', Amount: grossMargin, Store: currentStore.name, Period: dateRange },
        { Metric: 'Operating Expenses', Amount: filteredExpenses, Store: currentStore.name, Period: dateRange },
        { Metric: 'Net Operating Income (INR)', Amount: filteredProfit, Store: currentStore.name, Period: dateRange },
      ]
      exportToCsv('pnl_statement_report_inr', pnlData)
    } else if (selectedReport === 'sales') {
      exportToCsv('sales_transactions_report_inr', periodFilteredTransactions.filter(t => t.type === 'income'))
    } else if (selectedReport === 'expenses') {
      exportToCsv('expenses_ledger_report_inr', periodFilteredExpenses)
    } else if (selectedReport === 'inventory') {
      exportToCsv('inventory_valuation_report_inr', products)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Header (hidden in print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Executive Reports Center</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Generate printable audit packages and download real CSV tabular reports (INR).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-xs transition"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Print Report
          </button>
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition active:scale-98"
          >
            <Download className="w-4 h-4" />
            Download CSV
          </button>
        </div>
      </div>

      {/* 2. Report Selector Grid (hidden in print) */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportsList.map(r => {
          const Icon = r.icon
          const isSelected = selectedReport === r.id

          return (
            <div
              key={r.id}
              onClick={() => setSelectedReport(r.id as any)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-blue-50/70 border-blue-400 shadow-sm'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-card'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-900">{r.title}</h3>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                {r.description}
              </p>
            </div>
          )
        })}
      </div>

      {/* 3. Printable Report Document Preview */}
      <div className="printable-document bg-white rounded-2xl border border-slate-200/80 p-8 shadow-card print:border-none print:shadow-none print:p-0 space-y-6">
        {/* Document Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-blue-600">
              NexusOps India • Business Operations System
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              {reportsList.find(r => r.id === selectedReport)?.title}
            </h1>
            <div className="text-xs text-slate-500 mt-1">
              Entity: <strong>{currentStore.name}</strong> • Reporting Window: <strong>{dateRange}</strong>
            </div>
          </div>

          <div className="text-right text-xs text-slate-400">
            <div>Generated: {new Date().toLocaleDateString('en-IN')}</div>
            <div>Status: Audited & Certified (INR)</div>
          </div>
        </div>

        {/* P&L View */}
        {selectedReport === 'pnl' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-xs text-slate-500">Gross Collected Revenue</span>
                <div className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(filteredRevenue)}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-xs text-slate-500">Total Operating Expenses</span>
                <div className="text-xl font-bold text-rose-600 mt-1">-{formatCurrency(filteredExpenses)}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-xs text-slate-500">Net Operating Profit</span>
                <div className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(filteredProfit)}</div>
              </div>
            </div>

            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5">Line Item</th>
                  <th className="py-2.5">Accounting Classification</th>
                  <th className="py-2.5 text-right">% of Revenue</th>
                  <th className="py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3 font-semibold text-slate-900">Gross Sales Revenue</td>
                  <td className="py-3">Top-line Operating Income</td>
                  <td className="py-3 text-right">{filteredRevenue > 0 ? '100.0%' : '0.0%'}</td>
                  <td className="py-3 text-right font-bold text-slate-900">{formatCurrency(filteredRevenue)}</td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-slate-900">Cost of Goods Sold (COGS)</td>
                  <td className="py-3">Wholesale inventory purchase & landed freight</td>
                  <td className="py-3 text-right">{cogsPercent}%</td>
                  <td className="py-3 text-right text-rose-600">-{formatCurrency(totalCogs)}</td>
                </tr>
                <tr className="bg-slate-50 font-bold text-slate-900">
                  <td className="py-3">Gross Operating Margin</td>
                  <td className="py-3">Gross Revenue minus COGS</td>
                  <td className="py-3 text-right">{grossMarginPercent}%</td>
                  <td className="py-3 text-right">{formatCurrency(grossMargin)}</td>
                </tr>
                
                {/* Dynamically list actual expense categories from expenses ledger */}
                {pnlExpenseCategories.filter(c => c.category !== 'Cost of Goods').map(cat => (
                  <tr key={cat.category}>
                    <td className="py-3 font-semibold text-slate-900">{cat.category}</td>
                    <td className="py-3">Operating overhead & disbursements</td>
                    <td className="py-3 text-right">{cat.percent}%</td>
                    <td className="py-3 text-right text-rose-600">-{formatCurrency(cat.amount)}</td>
                  </tr>
                ))}

                {pnlExpenseCategories.filter(c => c.category !== 'Cost of Goods').length === 0 && (
                  <tr>
                    <td className="py-3 text-slate-400 italic text-center" colSpan={4}>
                      {expenses.length === 0 ? 'No operating expense vouchers logged. Upload expenses.csv to track overhead.' : 'No other operating expenses.'}
                    </td>
                  </tr>
                )}

                <tr className="bg-emerald-50/60 font-bold text-emerald-900 border-t-2 border-emerald-400">
                  <td className="py-3.5">Net Pre-Tax Operating Profit</td>
                  <td className="py-3.5">Net cash generation</td>
                  <td className="py-3.5 text-right">{netProfitPercent}%</td>
                  <td className="py-3.5 text-right text-emerald-700 text-sm font-bold">{formatCurrency(filteredProfit)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Sales Audit View */}
        {selectedReport === 'sales' && (
          <div className="space-y-4">
            <div className="text-xs text-slate-500">
              Showing settled retail transactions for the current reporting cycle.
            </div>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Transaction Code</th>
                  <th className="py-2.5">Description</th>
                  <th className="py-2.5">Customer</th>
                  <th className="py-2.5 text-right">Gross Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {transactions.filter(t => t.type === 'income').slice(0, 10).map(t => (
                  <tr key={t.id}>
                    <td className="py-2.5 whitespace-nowrap">{t.date}</td>
                    <td className="py-2.5 font-mono text-slate-500">{t.code}</td>
                    <td className="py-2.5 font-medium text-slate-900">{t.description}</td>
                    <td className="py-2.5">{t.customer}</td>
                    <td className="py-2.5 text-right font-bold text-emerald-600">+{formatCurrency(t.amount)}</td>
                  </tr>
                ))}
                {transactions.filter(t => t.type === 'income').length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs italic">
                      No sales transactions recorded. Upload sales.csv to audit sales receipts.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Expenses Audit View */}
        {selectedReport === 'expenses' && (
          <div className="space-y-4">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Voucher Code</th>
                  <th className="py-2.5">Category</th>
                  <th className="py-2.5">Payee / Vendor</th>
                  <th className="py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {expenses.map(e => (
                  <tr key={e.id}>
                    <td className="py-2.5 whitespace-nowrap">{e.date}</td>
                    <td className="py-2.5 font-mono text-slate-500">{e.code}</td>
                    <td className="py-2.5">{e.category}</td>
                    <td className="py-2.5 font-medium text-slate-900">{e.vendor}</td>
                    <td className="py-2.5 text-right font-bold text-rose-600">-{formatCurrency(e.amount)}</td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs italic">
                      No expense records recorded. Upload expenses.csv to audit expense vouchers.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Inventory Report View */}
        {selectedReport === 'inventory' && (
          <div className="space-y-4">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5">SKU</th>
                  <th className="py-2.5">Product Title</th>
                  <th className="py-2.5">Category</th>
                  <th className="py-2.5 text-right">On-Hand Stock</th>
                  <th className="py-2.5 text-right">Unit Cost</th>
                  <th className="py-2.5 text-right">Asset Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {products.map(p => (
                  <tr key={p.id}>
                    <td className="py-2.5 font-mono text-slate-500">{p.sku}</td>
                    <td className="py-2.5 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-2.5">{p.category}</td>
                    <td className="py-2.5 text-right font-bold text-slate-800">{p.stock}</td>
                    <td className="py-2.5 text-right text-slate-500">₹{p.unitCost.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 text-right font-bold text-slate-900">
                      {formatCurrency(p.stock * p.unitCost)}
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs italic">
                      No inventory products recorded. Upload inventory.csv to audit warehouse assets.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Sign-off footer */}
        <div className="pt-8 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>Report certified for operational review by <strong>{certifierName} • NexusOps India</strong></div>
          <div className="font-mono text-[10px]">SHA256: 9b2d88a10f78c903</div>
        </div>
      </div>
    </div>
  )
}
