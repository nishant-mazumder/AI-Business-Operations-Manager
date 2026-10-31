import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Search,
  Bell,
  Building2,
  ChevronDown,
  Plus,
  MoreVertical,
  Check,
  CheckCircle2,
  AlertTriangle,
  Info,
  DollarSign,
  Package,
  Receipt,
  Truck,
  Upload,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { PeriodOption } from '@/types'

export const TopNavbar: React.FC = () => {
  const location = useLocation()
  const {
    stores,
    selectedStoreId,
    setSelectedStoreId,
    selectedPeriod,
    setSelectedPeriod,
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsRead,
    setIsSearchOpen,
    setIsImportModalOpen,
    setQuickActionModal,
  } = useApp()

  const [showNotifications, setShowNotifications] = useState(false)
  const [showStoreDropdown, setShowStoreDropdown] = useState(false)
  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const [showMoreActions, setShowMoreActions] = useState(false)

  // Map route to clean title
  const getPageTitle = (path: string) => {
    switch (path) {
      case '/':
        return 'Overview'
      case '/sales':
        return 'Sales'
      case '/forecasting':
        return 'Demand Forecasting'
      case '/inventory':
        return 'Inventory'
      case '/purchases':
        return 'Purchases'
      case '/expenses':
        return 'Expenses'
      case '/analytics':
        return 'Analytics'
      case '/assistant':
        return 'AI Assistant'
      case '/recommendations':
        return 'Recommendations'
      case '/reports':
        return 'Reports'
      case '/settings':
        return 'Settings'
      default:
        return 'Dashboard'
    }
  }

  const periodButtons: { label: string; value: PeriodOption }[] = [
    { label: 'All time', value: 'all' },
    { label: '12 months', value: '12m' },
    { label: '30 days', value: '30d' },
    { label: '7 days', value: '7d' },
    { label: '24 hours', value: '24h' },
  ]

  const currentStore = stores.find(s => s.id === selectedStoreId) || stores[0]

  return (
    <header className="no-print sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-3 select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left Section: Page Title & Location Selector */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-slate-900 leading-none">
            {getPageTitle(location.pathname)}
          </h1>

          {/* Business / Store Selector */}
          <div className="relative">
            <button
              onClick={() => setShowStoreDropdown(!showStoreDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-700 transition"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="max-w-[140px] truncate">{currentStore.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showStoreDropdown && (
              <div
                className="absolute left-0 mt-1 w-64 bg-white rounded-xl shadow-dropdown border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95"
                onMouseLeave={() => setShowStoreDropdown(false)}
              >
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Location
                </div>
                {stores.map(store => (
                  <button
                    key={store.id}
                    onClick={() => {
                      setSelectedStoreId(store.id)
                      setShowStoreDropdown(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition ${
                      selectedStoreId === store.id
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{store.name}</div>
                      <div className="text-[10px] text-slate-400">{store.location}</div>
                    </div>
                    {selectedStoreId === store.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Search, Date Filter Pills, Actions, Notifications */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Search Bar with ⌘K */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl bg-slate-100/80 hover:bg-slate-100 text-slate-500 border border-slate-200/60 transition"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white rounded border border-slate-200 shadow-xs">
              ⌘ K
            </kbd>
          </button>

          {/* Time Filter Pills - matching Reference Image */}
          <div className="hidden lg:flex items-center bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/60 text-xs">
            {periodButtons.map(btn => (
              <button
                key={btn.value}
                onClick={() => setSelectedPeriod(btn.value)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  selectedPeriod === btn.value
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Notification Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-dropdown border border-slate-200 py-2 z-40 animate-in fade-in zoom-in-95"
                onMouseLeave={() => setShowNotifications(false)}
              >
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-800">Notifications</div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] text-blue-600 hover:underline font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {notifications.map(item => (
                    <div
                      key={item.id}
                      onClick={() => markNotificationAsRead(item.id)}
                      className={`p-3 text-xs cursor-pointer transition ${
                        item.read ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/40 hover:bg-blue-50/70'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">
                          {item.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                          {item.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          {item.type === 'info' && <Info className="w-4 h-4 text-blue-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-900">{item.title}</div>
                          <div className="text-slate-500 text-[11px] leading-relaxed mt-0.5">
                            {item.message}
                          </div>
                          <div className="text-slate-400 text-[10px] mt-1">{item.timestamp}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* More Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMoreActions(!showMoreActions)}
              className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition"
            >
              <span>More actions</span>
              <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showMoreActions && (
              <div
                className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-dropdown border border-slate-200 py-1.5 z-40 animate-in fade-in"
                onMouseLeave={() => setShowMoreActions(false)}
              >
                <button
                  onClick={() => {
                    window.print()
                    setShowMoreActions(false)
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition"
                >
                  Print Dashboard
                </button>
                <button
                  onClick={() => {
                    setIsSearchOpen(true)
                    setShowMoreActions(false)
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition"
                >
                  Quick Search (⌘K)
                </button>
              </div>
            )}
          </div>

          {/* Multi-File Import Button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
            title="Upload multi-file batch CSV/Excel"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Import Data</span>
          </button>

          {/* Create New Action Button */}
          <div className="relative">
            <button
              onClick={() => setShowCreateMenu(!showCreateMenu)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create new</span>
              <ChevronDown className="w-3 h-3 opacity-80" />
            </button>

            {showCreateMenu && (
              <div
                className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-dropdown border border-slate-200 py-1.5 z-40 animate-in fade-in"
                onMouseLeave={() => setShowCreateMenu(false)}
              >
                <button
                  onClick={() => {
                    setIsImportModalOpen(true)
                    setShowCreateMenu(false)
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition text-left border-b border-slate-100"
                >
                  <Upload className="w-4 h-4 text-purple-600" />
                  <div>
                    <div className="font-semibold text-purple-700">Batch Import (CSV/Excel)</div>
                    <div className="text-[10px] text-slate-400">Multi-file sales, stock, POs</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setQuickActionModal('sale')
                    setShowCreateMenu(false)
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition text-left"
                >
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <div>
                    <div className="font-semibold">Record Sale</div>
                    <div className="text-[10px] text-slate-400">POS or customer transaction</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setQuickActionModal('product')
                    setShowCreateMenu(false)
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition text-left"
                >
                  <Package className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="font-semibold">Add New Product</div>
                    <div className="text-[10px] text-slate-400">Register SKU in inventory</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setQuickActionModal('expense')
                    setShowCreateMenu(false)
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition text-left"
                >
                  <Receipt className="w-4 h-4 text-rose-500" />
                  <div>
                    <div className="font-semibold">Record Expense</div>
                    <div className="text-[10px] text-slate-400">Log AP or overhead invoice</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setQuickActionModal('po')
                    setShowCreateMenu(false)
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition text-left"
                >
                  <Truck className="w-4 h-4 text-amber-500" />
                  <div>
                    <div className="font-semibold">New Purchase Order</div>
                    <div className="text-[10px] text-slate-400">Order from vendor</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
