import React, { useState, useEffect } from 'react'
import {
  Settings as SettingsIcon,
  Building2,
  Globe,
  Bell,
  Shield,
  Palette,
  Check,
  Save,
  Sliders,
  DollarSign,
  User,
  Sun,
  Moon,
  Database,
  Trash2,
  AlertTriangle,
  ShoppingCart,
  Receipt,
  Package,
  Truck,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { Modal } from '@/components/ui/Modal'
import { api } from '@/lib/api'
import { AppSettings } from '@/types'

export const BUSINESS_SECTOR_GROUPS = [
  {
    group: 'Retail & Consumer Goods',
    options: [
      'Retail & Multi-Category Electronics',
      'Retail & Consumer Electronics',
      'Grocery, Supermarket & FMCG',
      'Apparel, Fashion & Footwear',
      'Cosmetics, Personal Care & Beauty (DTC)',
      'Jewelry, Watches & Luxury Goods',
      'Home Decor, Furniture & Furnishings',
      'Books, Stationery & Office Supplies',
      'Sports, Fitness & Outdoor Gear',
      'Toys, Baby Care & Maternity',
      'General Merchandising & Department Store',
    ],
  },
  {
    group: 'Food, Dining & Hospitality',
    options: [
      'Food & Beverage, Cafés & Restaurants',
      'Cloud Kitchens, Bakery & Confectionery',
      'Specialty Beverage & Consumables',
      'Wine, Spirits & Beverage Distribution',
    ],
  },
  {
    group: 'Healthcare & Pharmaceuticals',
    options: [
      'Pharmaceuticals, Chemist & Medical Supplies',
      'Healthcare, Diagnostics & Wellness Clinics',
      'Ayurveda, Organic Wellness & Supplements',
    ],
  },
  {
    group: 'Automotive, Hardware & Industrial',
    options: [
      'Automotive Dealership, Spares & Accessories',
      'Hardware, Electricals & Construction Materials',
      'Industrial Machinery, Tools & Equipment',
      'Plumbing, Sanitaryware & Paints',
    ],
  },
  {
    group: 'Wholesale, Supply Chain & B2B',
    options: [
      'Wholesale Trade, Distribution & Logistics',
      'Commercial Office Furniture & Logistics',
      'Omnichannel DTC & B2B',
      'Agriculture, Farming & Agro-Commodities',
      'Import / Export Trade & Freight',
    ],
  },
  {
    group: 'Technology & Specialty Services',
    options: [
      'IT Hardware, Telecom & Networking',
      'Software, SaaS & Digital Solutions',
      'Pet Care, Animal Health & Veterinary',
      'Textiles, Fabric Mills & Handloom Export',
      'Printing, Packaging & Publishing',
    ],
  },
  {
    group: 'Custom Classification',
    options: [
      'Other / Custom Industry Sector...',
    ],
  },
]

const ALL_STANDARD_SECTORS = BUSINESS_SECTOR_GROUPS.flatMap(g =>
  g.options.filter(o => o !== 'Other / Custom Industry Sector...')
)

export const Settings: React.FC = () => {
  const {
    settings,
    updateSettings,
    showToast,
    transactions,
    products,
    expenses,
    purchaseOrders,
    suppliers,
    purgeDatasets,
  } = useApp()
  const { user } = useAuth()

  const userFullName = user?.full_name?.trim() || user?.username?.trim() || 'Operations Lead'
  const userEmail = user?.email || user?.username || 'operator@nexusops.in'
  const userInitials = userFullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('') || 'OP'

  const [activeTab, setActiveTab] = useState<'profile' | 'regional' | 'inventory' | 'notifications' | 'appearance' | 'datasets'>('profile')
  const [purgeTarget, setPurgeTarget] = useState<'all' | 'sales' | 'expenses' | 'inventory' | 'purchases' | 'suppliers' | null>(null)
  const [isPurging, setIsPurging] = useState(false)

  // Form local state initialized with settings
  const [bName, setBName] = useState(settings.businessName)
  
  const isInitialStandard = ALL_STANDARD_SECTORS.includes(settings.businessType)
  const [selectedSector, setSelectedSector] = useState(
    isInitialStandard ? settings.businessType : (settings.businessType ? 'Other / Custom Industry Sector...' : 'Retail & Consumer Electronics')
  )
  const [customSector, setCustomSector] = useState(
    isInitialStandard ? '' : (settings.businessType || '')
  )
  const [bType, setBType] = useState(settings.businessType)

  const [currency, setCurrency] = useState(settings.currency)
  const [timezone, setTimezone] = useState(settings.timezone)
  const [threshold, setThreshold] = useState(settings.lowStockThresholdPercent)
  const [autoReorder, setAutoReorder] = useState(settings.autoReorderAlerts)
  const [emailFreq, setEmailFreq] = useState(settings.emailReportsFrequency)
  const [compact, setCompact] = useState(settings.compactDensity)
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nexusops_theme')
      if (stored === 'dark') return true
      if (stored === 'light') return false
      if (document.documentElement.classList.contains('dark')) return true
    }
    return Boolean(settings.darkMode)
  })

  useEffect(() => {
    setBName(settings.businessName)
    setCurrency(settings.currency)
    setTimezone(settings.timezone)
    setThreshold(settings.lowStockThresholdPercent)
    setAutoReorder(settings.autoReorderAlerts)
    setEmailFreq(settings.emailReportsFrequency)
    setCompact(settings.compactDensity)

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nexusops_theme')
      const isDocDark = document.documentElement.classList.contains('dark')
      if (stored === 'dark' || (stored === null && isDocDark)) {
        setIsDark(true)
      } else if (stored === 'light' || (stored === null && !isDocDark)) {
        setIsDark(false)
      } else {
        setIsDark(Boolean(settings.darkMode))
      }
    } else {
      setIsDark(Boolean(settings.darkMode))
    }

    const isStd = ALL_STANDARD_SECTORS.includes(settings.businessType)
    if (isStd) {
      setSelectedSector(settings.businessType)
      setCustomSector('')
      setBType(settings.businessType)
    } else if (settings.businessType) {
      setSelectedSector('Other / Custom Industry Sector...')
      setCustomSector(settings.businessType)
      setBType(settings.businessType)
    }
  }, [settings])

  // Real-time synchronization with localStorage across browser tabs / windows
  useEffect(() => {
    const syncTheme = () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('nexusops_theme')
        const isDocDark = document.documentElement.classList.contains('dark')
        if (stored === 'dark' || (stored === null && isDocDark)) {
          setIsDark(true)
        } else if (stored === 'light' || (stored === null && !isDocDark)) {
          setIsDark(false)
        }
      }
    }
    window.addEventListener('storage', syncTheme)
    window.addEventListener('focus', syncTheme)
    return () => {
      window.removeEventListener('storage', syncTheme)
      window.removeEventListener('focus', syncTheme)
    }
  }, [])

  const handleThemeChange = (dark: boolean) => {
    setIsDark(dark)
    if (typeof window !== 'undefined') {
      if (dark) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('nexusops_theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('nexusops_theme', 'light')
      }
    }
    updateSettings({ darkMode: dark })
  }

  const handleSectorChange = (val: string) => {
    setSelectedSector(val)
    if (val === 'Other / Custom Industry Sector...') {
      setBType(customSector.trim() || '')
    } else {
      setBType(val)
    }
  }

  const handleCustomSectorChange = (val: string) => {
    setCustomSector(val)
    setBType(val)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const resolvedType = selectedSector === 'Other / Custom Industry Sector...'
      ? (customSector.trim() || 'General Enterprise')
      : selectedSector

    if (typeof window !== 'undefined') {
      if (isDark) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('nexusops_theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('nexusops_theme', 'light')
      }
    }

    updateSettings({
      businessName: bName,
      businessType: resolvedType,
      currency: currency as any,
      timezone: timezone,
      lowStockThresholdPercent: Number(threshold),
      autoReorderAlerts: autoReorder,
      emailReportsFrequency: emailFreq,
      compactDensity: compact,
      darkMode: isDark,
    })
  }

  const tabs = [
    { id: 'profile', label: 'Business Profile', icon: Building2 },
    { id: 'regional', label: 'Regional & Currency', icon: Globe },
    { id: 'inventory', label: 'Inventory Rules', icon: Sliders },
    { id: 'notifications', label: 'Alerts & Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance & Layout', icon: Palette },
    { id: 'datasets', label: 'Uploaded Datasets & Storage', icon: Database },
  ]

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-card">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">System Settings & Governance</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure Indian business profile, operational threshold parameters, reporting frequency, and UI themes.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition active:scale-98"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      {/* 2. Settings Shell */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-card overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
        {/* Settings Navigation Sidebar */}
        <div className="md:col-span-4 border-r border-slate-100 dark:border-slate-800 p-4 space-y-1 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 py-2">
            Configuration
          </div>
          {tabs.map(tab => {
            const Icon = tab.icon
            const isCurrent = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left ${
                  isCurrent
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Settings Form Body */}
        <div className="md:col-span-8 p-6 lg:p-8">
          <form onSubmit={handleSave} className="space-y-6 max-w-xl">
            {/* Tab 1: Profile */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Commercial Business Profile</h3>
                  <p className="text-xs text-slate-400">Legal entity information and operations registration</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Organization Name</label>
                  <input
                    type="text"
                    value={bName}
                    onChange={e => setBName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Business Sector / Classification
                  </label>
                  <select
                    value={selectedSector}
                    onChange={e => handleSectorChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                  >
                    {BUSINESS_SECTOR_GROUPS.map(grp => (
                      <optgroup key={grp.group} label={grp.group}>
                        {grp.options.map(opt => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>

                  {selectedSector === 'Other / Custom Industry Sector...' && (
                    <div className="mt-2.5 p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/80 space-y-1.5 transition-all">
                      <label className="block text-[11px] font-semibold text-blue-900">
                        Specify Your Custom Business Sector / Industry Niche
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Solar Power Equipment, Artisanal Pottery & Export, Veterinary Care..."
                        value={customSector}
                        onChange={e => handleCustomSectorChange(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
                        autoFocus
                      />
                      <p className="text-[10px] text-slate-500">
                        Enter your specific industry sector. This will be certified on all executive reports and operational analytics.
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center gap-3">
                  <img
                    src="/default-avatar.png"
                    alt="User Profile"
                    className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200/80 shadow-2xs bg-white"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">{userFullName}</div>
                    <div className="text-[11px] text-slate-400">Account Owner • {userEmail}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Regional & Currency */}
            {activeTab === 'regional' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Regional & Financial Settings</h3>
                  <p className="text-xs text-slate-400">Currency display preferences and fiscal year timezone</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Functional Base Currency</label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="INR">INR (₹ - Indian Rupee - Default)</option>
                    <option value="USD">USD ($ - United States Dollar)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="GBP">GBP (£ - British Pound)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Timezone & Register Synchronization</label>
                  <select
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST - Indian Standard Time)</option>
                    <option value="Asia/Dubai (GST)">Asia/Dubai (GST - Gulf Standard Time)</option>
                    <option value="Asia/Singapore (SGT)">Asia/Singapore (SGT - Singapore Time)</option>
                    <option value="Europe/London (GMT)">Europe/London (GMT - UTC+0)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Tab 3: Inventory Rules */}
            {activeTab === 'inventory' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Inventory & Safety Stock Rules</h3>
                  <p className="text-xs text-slate-400">Automated triggers for replenishment and restock alerts</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Low Stock Threshold Buffer (% of baseline reorder point)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={threshold}
                    onChange={e => setThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    When units drop below this safety percentage, items are flagged in the Recommendations feed.
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Automated Reorder Alerts</div>
                    <div className="text-[11px] text-slate-500">Auto-create PO drafts when stock reaches zero</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoReorder}
                    onChange={e => setAutoReorder(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Tab 4: Notifications */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Alerts & Dispatch Settings</h3>
                  <p className="text-xs text-slate-400">Configure alert channels for inventory breaches and high-value orders</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Executive Report Frequency</label>
                  <select
                    value={emailFreq}
                    onChange={e => setEmailFreq(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="daily">Daily Morning Digest (08:00 AM IST)</option>
                    <option value="weekly">Weekly Strategic Rollup (Monday)</option>
                    <option value="monthly">Monthly Audit Package</option>
                    <option value="never">Never (On-Demand Only)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Tab 5: Appearance */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Theme & Appearance</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Choose between light daytime contrast and deep dark mode</p>
                </div>

                {/* Theme Cards (Light vs Dark) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Light Theme Card */}
                  <div
                    onClick={() => handleThemeChange(false)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      !isDark
                        ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${!isDark ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                          <Sun className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Light Mode</span>
                      </div>
                      {!isDark && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    {/* Visual mockup preview */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                      <div className="h-2 w-14 bg-slate-300 dark:bg-slate-600 rounded"></div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <div className="h-5 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600"></div>
                        <div className="h-5 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600"></div>
                        <div className="h-5 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600"></div>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5">
                      Crisp, daytime interface optimized for high readability.
                    </p>
                  </div>

                  {/* Dark Theme Card */}
                  <div
                    onClick={() => handleThemeChange(true)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isDark
                        ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDark ? 'bg-indigo-900/60 text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                          <Moon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Dark Mode</span>
                      </div>
                      {isDark && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    {/* Visual mockup preview */}
                    <div className="rounded-xl border border-slate-700 p-2.5 bg-slate-900 space-y-1.5">
                      <div className="h-2 w-14 bg-slate-700 rounded"></div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <div className="h-5 bg-slate-800 rounded border border-slate-700"></div>
                        <div className="h-5 bg-slate-800 rounded border border-slate-700"></div>
                        <div className="h-5 bg-slate-800 rounded border border-slate-700"></div>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5">
                      Deep slate & obsidian theme engineered for low-light environments.
                    </p>
                  </div>
                </div>

                {/* Direct Switch Row */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${isDark ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                      {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Enable Dark Mode</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isDark ? 'Dark theme is currently active' : 'Light theme is currently active'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleThemeChange(!isDark)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isDark ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isDark ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Tab 6: Uploaded Datasets & Storage Management */}
            {activeTab === 'datasets' && (
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Uploaded Datasets & Database Storage
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Review live business records and delete individual datasets or all business data.
                  </p>
                </div>

                {/* Dataset Breakdown Cards */}
                <div className="space-y-3">
                  {/* 1. Sales Dataset Card */}
                  <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Sales Transactions
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {transactions.length.toLocaleString('en-IN')} records loaded • Gross Revenue: ₹
                          {transactions.reduce((acc, t) => acc + t.amount, 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPurgeTarget('sales')}
                      disabled={transactions.length === 0}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200/60 dark:border-rose-900/40 transition disabled:opacity-40 flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Sales Data
                    </button>
                  </div>

                  {/* 2. Expenses Dataset Card */}
                  <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Operating Expenses
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {expenses.length.toLocaleString('en-IN')} vouchers recorded • Total Spend: ₹
                          {expenses.reduce((acc, e) => acc + e.amount, 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPurgeTarget('expenses')}
                      disabled={expenses.length === 0}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200/60 dark:border-rose-900/40 transition disabled:opacity-40 flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Expenses Data
                    </button>
                  </div>

                  {/* 3. Inventory Dataset Card */}
                  <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Inventory Catalog
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {products.length.toLocaleString('en-IN')} product SKUs • Inventory Valuation: ₹
                          {products.reduce((acc, p) => acc + p.stock * p.unitCost, 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPurgeTarget('inventory')}
                      disabled={products.length === 0}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200/60 dark:border-rose-900/40 transition disabled:opacity-40 flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Inventory Data
                    </button>
                  </div>

                  {/* 4. Purchase Orders Dataset Card */}
                  <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Purchase Orders
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {purchaseOrders.length.toLocaleString('en-IN')} orders logged • Total Procurement: ₹
                          {purchaseOrders.reduce((acc, po) => acc + po.totalAmount, 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPurgeTarget('purchases')}
                      disabled={purchaseOrders.length === 0}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200/60 dark:border-rose-900/40 transition disabled:opacity-40 flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete PO Data
                    </button>
                  </div>

                  {/* 5. Suppliers Dataset Card */}
                  <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Suppliers Directory
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {suppliers.length.toLocaleString('en-IN')} registered procurement vendors
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPurgeTarget('suppliers')}
                      disabled={suppliers.length === 0}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200/60 dark:border-rose-900/40 transition disabled:opacity-40 flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Suppliers Data
                    </button>
                  </div>
                </div>

                {/* Danger Zone: Purge All Business Data */}
                <div className="p-5 rounded-2xl border-2 border-dashed border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wider">
                        Danger Zone — Purge All Uploaded Business Records
                      </h4>
                      <p className="text-xs text-rose-700/80 dark:text-rose-300/70 mt-1 leading-relaxed">
                        Permanently delete all sales, expenses, inventory SKUs, purchase orders, suppliers, and import audit batches for your business. Use this if you want to wipe test records or start completely fresh with clean datasets.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setPurgeTarget('all')}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-98 rounded-xl shadow-xs transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete All Uploaded Business Records
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab !== 'datasets' && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
                >
                  Save Settings
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Purge Dataset Confirmation Modal */}
      {purgeTarget && (
        <Modal
          isOpen={true}
          onClose={() => !isPurging && setPurgeTarget(null)}
          title={purgeTarget === 'all' ? 'Delete ALL Business Records?' : `Delete ${purgeTarget.toUpperCase()} Dataset?`}
          subtitle="This action is irreversible and permanently removes the data."
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900 dark:text-rose-200 space-y-1">
                <p className="font-semibold">
                  {purgeTarget === 'all'
                    ? 'Warning: Every record in this business account will be deleted.'
                    : `Warning: All records in the '${purgeTarget}' dataset will be deleted.`}
                </p>
                <p className="text-rose-700 dark:text-rose-300">
                  {purgeTarget === 'all'
                    ? 'This will wipe all sales, inventory items, operating expenses, purchase orders, and supplier files. Dashboards will reset to zero.'
                    : `This will permanently remove all records belonging to the ${purgeTarget} dataset and update connected calculations.`}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isPurging}
                onClick={() => setPurgeTarget(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPurging}
                onClick={async () => {
                  setIsPurging(true)
                  try {
                    await purgeDatasets(purgeTarget)
                    setPurgeTarget(null)
                  } finally {
                    setIsPurging(false)
                  }
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                {isPurging ? 'Deleting Records...' : purgeTarget === 'all' ? 'Yes, Delete Everything' : `Yes, Delete ${purgeTarget}`}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
