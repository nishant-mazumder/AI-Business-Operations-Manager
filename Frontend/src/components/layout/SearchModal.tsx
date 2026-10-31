import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Package,
  Truck,
  Receipt,
  BarChart3,
  Bot,
  Lightbulb,
  FileSpreadsheet,
  Settings,
  ArrowRight,
  X,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'

export const SearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, products, transactions } = useApp()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(!isSearchOpen)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSearchOpen, setIsSearchOpen])

  if (!isSearchOpen) return null

  const pages = [
    { name: 'Overview Dashboard', path: '/', icon: LayoutDashboard, category: 'Pages' },
    { name: 'Sales & Transactions', path: '/sales', icon: ShoppingCart, category: 'Pages' },
    { name: 'AI Demand Forecasting', path: '/forecasting', icon: TrendingUp, category: 'Pages' },
    { name: 'Inventory Management', path: '/inventory', icon: Package, category: 'Pages' },
    { name: 'Purchases & Suppliers', path: '/purchases', icon: Truck, category: 'Pages' },
    { name: 'Expenses & Budget', path: '/expenses', icon: Receipt, category: 'Pages' },
    { name: 'BI Business Analytics', path: '/analytics', icon: BarChart3, category: 'Pages' },
    { name: 'AI Business Assistant', path: '/assistant', icon: Bot, category: 'Pages' },
    { name: 'Recommendations Center', path: '/recommendations', icon: Lightbulb, category: 'Pages' },
    { name: 'Reports & Export', path: '/reports', icon: FileSpreadsheet, category: 'Pages' },
    { name: 'System Settings', path: '/settings', icon: Settings, category: 'Pages' },
  ]

  const filteredPages = pages.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase())
  )

  const filteredProducts = products
    .filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 4)

  const filteredTransactions = transactions
    .filter(t => t.description.toLowerCase().includes(query.toLowerCase()) || t.code.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 3)

  const handleSelect = (path: string) => {
    navigate(path)
    setIsSearchOpen(false)
    setQuery('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={() => setIsSearchOpen(false)}
      />

      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages, products, transactions, or commands..."
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-slate-400 text-slate-800 font-medium"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold text-slate-400 bg-slate-100 rounded border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Search Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {/* Navigation Pages */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 py-1">
              Navigation
            </div>
            <div className="space-y-1">
              {filteredPages.slice(0, 6).map(page => {
                const Icon = page.icon
                return (
                  <button
                    key={page.path}
                    onClick={() => handleSelect(page.path)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-blue-50 text-slate-500 group-hover:text-blue-600 flex items-center justify-center transition">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium">{page.name}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition" />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Products Results */}
          {filteredProducts.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 py-1">
                Products & Inventory
              </div>
              <div className="space-y-1">
                {filteredProducts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect('/inventory')}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition group text-left"
                  >
                    <div>
                      <div className="font-medium text-slate-900 group-hover:text-blue-600">{p.name}</div>
                      <div className="text-xs text-slate-400">SKU: {p.sku} • Stock: {p.stock} units</div>
                    </div>
                    <span className="font-semibold text-slate-900 text-xs">₹{p.sellingPrice.toLocaleString('en-IN')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Transactions Results */}
          {filteredTransactions.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 py-1">
                Transactions Feed
              </div>
              <div className="space-y-1">
                {filteredTransactions.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleSelect('/sales')}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition group text-left"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="font-medium text-slate-900 truncate">{t.description}</div>
                      <div className="text-xs text-slate-400">{t.code} • {t.date}</div>
                    </div>
                    <span className={`font-semibold text-xs ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.type === 'income' ? '+₹' : '-₹'}{t.amount.toLocaleString('en-IN')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredPages.length === 0 && filteredProducts.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-500">
              No matching pages, products or records found for "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
