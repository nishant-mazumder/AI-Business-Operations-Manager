import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
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
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const { recommendations, products } = useApp()
  const { user, logout } = useAuth()

  const activeRecsCount = recommendations.filter(r => r.status === 'active' && (r.priority === 'critical' || r.priority === 'high')).length
  const lowStockCount = products.filter(p => p.status === 'low_stock' || p.status === 'out_of_stock').length

  const navItems = [
    { label: 'Overview', path: '/', icon: LayoutDashboard },
    { label: 'Sales', path: '/sales', icon: ShoppingCart },
    { label: 'Forecasting', path: '/forecasting', icon: TrendingUp, badge: 'AI' },
    { label: 'Inventory', path: '/inventory', icon: Package, count: lowStockCount > 0 ? lowStockCount : undefined },
    { label: 'Purchases & Suppliers', path: '/purchases', icon: Truck },
    { label: 'Expenses', path: '/expenses', icon: Receipt },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'AI Business Assistant', path: '/assistant', icon: Bot, isSpecial: true },
    { label: 'Recommendations', path: '/recommendations', icon: Lightbulb, count: activeRecsCount > 0 ? activeRecsCount : undefined },
    { label: 'Reports', path: '/reports', icon: FileSpreadsheet },
    { label: 'Settings', path: '/settings', icon: Settings },
  ]

  return (
    <aside
      className={`no-print relative flex flex-col bg-white border-r border-slate-200/90 transition-all duration-300 z-30 select-none shrink-0 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Logo icon with sleek circle like the reference image 'kayko' */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center text-white font-bold shadow-sm shadow-blue-500/20 shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 text-base tracking-tight leading-none">
                Nexus<span className="text-blue-600">Ops</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">
                AI Operations OS
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-7 h-7 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center justify-center transition"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {!collapsed && (
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Core Operations
          </div>
        )}

        {navItems.map(item => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                } ${collapsed ? 'justify-center px-0' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      isActive
                        ? 'text-blue-600'
                        : item.isSpecial
                        ? 'text-indigo-500 group-hover:text-indigo-600'
                        : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />

                  {!collapsed && (
                    <span className="truncate flex-1">{item.label}</span>
                  )}

                  {!collapsed && item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-indigo-100 text-indigo-700 border border-indigo-200">
                      {item.badge}
                    </span>
                  )}

                  {!collapsed && item.count !== undefined && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      {item.count}
                    </span>
                  )}

                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 z-50 transition shadow-lg">
                      {item.label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </div>

      {/* Bottom User / Store Info */}
      <div className="p-3 border-t border-slate-100">
        {!collapsed ? (
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="/default-avatar.png"
                alt="User Profile"
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200/80 shadow-2xs bg-white"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-800 truncate">
                  {user?.full_name || user?.username || 'Operations Lead'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {user?.role || 'Director of Operations'}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign out of operations"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <img
              src="/default-avatar.png"
              alt="User Profile"
              className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200/80 shadow-2xs bg-white"
            />
            <button
              onClick={logout}
              title="Sign out"
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
