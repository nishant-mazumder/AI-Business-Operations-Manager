import React, { createContext, useContext, useState, useMemo, useEffect, ReactNode } from 'react'
import {
  Store,
  Transaction,
  Product,
  ExpenseRecord,
  Supplier,
  PurchaseOrder,
  Recommendation,
  NotificationItem,
  AppSettings,
  PeriodOption,
} from '@/types'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { MOCK_STORES } from '@/data/mockStores'

export interface ToastItem {
  id: string
  title: string
  message: string
  type: 'success' | 'warning' | 'error' | 'info'
}

interface AppContextType {
  stores: Store[]
  selectedStoreId: string
  setSelectedStoreId: (id: string) => void
  currentStore: Store
  selectedPeriod: PeriodOption
  setSelectedPeriod: (period: PeriodOption) => void
  
  // Products
  products: Product[]
  addProduct: (product: Omit<Product, 'id' | 'status' | 'unitsSold30d' | 'marginPercent' | 'lastRestocked'>) => Promise<void>
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>
  adjustStock: (id: string, delta: number) => Promise<void>
  deleteProduct: (id: string) => Promise<void>

  // Transactions
  transactions: Transaction[]
  recordSale: (sale: {
    description: string
    category: string
    amount: number
    paymentMethod: string
    customer: string
    storeId: string
    productId?: string
    quantitySold?: number
  }) => Promise<void>
  deleteSale: (id: string) => Promise<void>

  // Expenses
  expenses: ExpenseRecord[]
  addExpense: (expense: Omit<ExpenseRecord, 'id' | 'code'>) => Promise<void>
  updateExpense: (id: string, updates: Partial<ExpenseRecord>) => Promise<void>
  deleteExpense: (id: string) => Promise<void>

  // Suppliers & POs
  suppliers: Supplier[]
  addSupplier: (supplier: Omit<Supplier, 'id' | 'totalSpend' | 'activeOrders' | 'rating'>) => Promise<void>
  deleteSupplier: (id: string) => Promise<void>
  purchaseOrders: PurchaseOrder[]
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'poNumber'>) => Promise<void>
  updatePOStatus: (id: string, status: PurchaseOrder['status']) => Promise<void>
  deletePurchaseOrder: (id: string) => Promise<void>
  purgeDatasets: (datasetType?: string) => Promise<void>

  // Recommendations
  recommendations: Recommendation[]
  markRecommendationComplete: (id: string) => void
  dismissRecommendation: (id: string) => void

  // Notifications
  notifications: NotificationItem[]
  unreadCount: number
  markNotificationAsRead: (id: string) => void
  markAllNotificationsRead: () => void

  // Search & Modals
  isSearchOpen: boolean
  setIsSearchOpen: (open: boolean) => void
  isImportModalOpen: boolean
  setIsImportModalOpen: (open: boolean) => void
  quickActionModal: 'sale' | 'product' | 'expense' | 'po' | null
  setQuickActionModal: (type: 'sale' | 'product' | 'expense' | 'po' | null) => void

  // Settings
  settings: AppSettings
  updateSettings: (newSettings: Partial<AppSettings>) => void

  // Toast
  toasts: ToastItem[]
  showToast: (title: string, message: string, type?: ToastItem['type']) => void
  removeToast: (id: string) => void

  // Filtered computed metrics
  periodFilteredTransactions: Transaction[]
  periodFilteredExpenses: ExpenseRecord[]
  filteredRevenue: number
  filteredExpenses: number
  filteredProfit: number
  periodUnitsSold: number
  refreshData: () => Promise<void>
}

const DEFAULT_SETTINGS: AppSettings = {
  businessName: 'NexusOps India Retail Enterprise',
  businessType: 'Retail & Multi-Category Electronics',
  currency: 'INR',
  currencySymbol: '₹',
  timezone: 'Asia/Kolkata (IST)',
  lowStockThresholdPercent: 20,
  autoReorderAlerts: true,
  emailReportsFrequency: 'weekly',
  compactDensity: false,
  darkMode: false,
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth()

  const [stores, setStores] = useState<Store[]>(MOCK_STORES)
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all')
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('all')
  
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [settings, setSettings] = useState<AppSettings>(() => {
    const isDark = typeof window !== 'undefined' && localStorage.getItem('nexusops_theme') === 'dark'
    return {
      ...DEFAULT_SETTINGS,
      darkMode: isDark,
    }
  })

  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [quickActionModal, setQuickActionModal] = useState<'sale' | 'product' | 'expense' | 'po' | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = (title: string, message: string, type: ToastItem['type'] = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev, { id, title, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  // Refresh data from PostgreSQL backend
  const refreshData = async () => {
    const token = localStorage.getItem('nexusops_access_token')
    if (!token) {
      setProducts([])
      setTransactions([])
      setExpenses([])
      setSuppliers([])
      setPurchaseOrders([])
      setRecommendations([])
      setNotifications([])
      return
    }

    try {
      // Auto-sync local `datasets/` CSV folder if files were modified on disk
      try {
        await api.post('/imports/sync-local/')
      } catch {
        // Fallback silently if offline or already in sync
      }

      // 0. Fetch business profile
      try {
        const bRes = await api.get<any>('/business/')
        if (bRes && bRes.name) {
          setSettings(prev => {
            const currentIsDark = typeof window !== 'undefined'
              ? (localStorage.getItem('nexusops_theme') === 'dark' || document.documentElement.classList.contains('dark'))
              : (prev.darkMode ?? false)
            return {
              ...prev,
              businessName: bRes.name,
              businessType: bRes.business_type || prev.businessType,
              currency: (bRes.currency as any) || prev.currency,
              currencySymbol: bRes.currency_symbol || prev.currencySymbol,
              timezone: bRes.timezone || prev.timezone,
              darkMode: currentIsDark,
            }
          })
        }
      } catch {
        // Fallback to local settings
      }

      // 1. Fetch products
      let mappedProducts: Product[] = []
      const prodRes = await api.get<any[]>('/inventory/products/')
      if (Array.isArray(prodRes)) {
        mappedProducts = prodRes.map(p => ({
          id: String(p.id),
          sku: p.sku,
          name: p.name,
          category: p.category,
          stock: p.current_stock,
          reorderLevel: p.reorder_level,
          unitCost: parseFloat(p.unit_cost) || 0,
          sellingPrice: parseFloat(p.selling_price) || 0,
          supplier: p.supplier_name || 'Direct Procurement',
          storeId: p.store ? String(p.store) : 'store-1',
          status: p.stock_status,
          unitsSold30d: 0,
          marginPercent: parseFloat(p.gross_margin_percentage) || 0,
          lastRestocked: p.updated_at ? p.updated_at.split('T')[0] : '2026-10-20',
        }))
        setProducts(mappedProducts)
      }

      // 2. Fetch sales
      const salesRes = await api.get<any[]>('/sales/')
      if (Array.isArray(salesRes)) {
        const unitsSoldMap: Record<string, number> = {}
        salesRes.forEach((s: any) => {
          const qty = parseInt(s.quantity_sold) || 1
          if (s.product) unitsSoldMap[String(s.product)] = (unitsSoldMap[String(s.product)] || 0) + qty
          if (s.product_sku) unitsSoldMap[s.product_sku] = (unitsSoldMap[s.product_sku] || 0) + qty
        })

        if (mappedProducts.length > 0) {
          mappedProducts = mappedProducts.map(p => ({
            ...p,
            unitsSold30d: unitsSoldMap[p.id] || unitsSoldMap[p.sku] || 0,
          }))
          setProducts(mappedProducts)
        }

        const mappedSales: Transaction[] = salesRes.map(s => ({
          id: String(s.id),
          code: s.transaction_id,
          date: s.date,
          time: s.created_at ? s.created_at.substring(11, 16) : '12:00',
          type: 'income',
          category: s.category || 'Retail Sales',
          description: s.product_name,
          amount: parseFloat(s.total_amount) || 0,
          status: 'completed',
          paymentMethod: s.payment_method,
          storeId: s.store ? String(s.store) : 'all',
          storeName: s.store_name || 'Flagship Store',
          customer: s.customer_name || 'Walk-in Customer',
          quantity: parseInt(s.quantity_sold) || 1,
        }))
        setTransactions(mappedSales)
      }

      // 3. Fetch expenses
      const expRes = await api.get<any[]>('/expenses/')
      if (Array.isArray(expRes)) {
        const validCategories: ExpenseRecord['category'][] = [
          'Cost of Goods',
          'Salaries & Wages',
          'Rent & Lease',
          'Software & Cloud',
          'Marketing & Ads',
          'Logistics & Freight',
          'Utilities & Misc',
        ]
        const mappedExp: ExpenseRecord[] = expRes.map(e => {
          const matchedCategory = validCategories.find(c => c.toLowerCase() === (e.category || '').toLowerCase()) || 'Utilities & Misc'
          return {
            id: String(e.id),
            code: e.receipt_reference || `EXP-${e.id}`,
            date: e.date,
            category: matchedCategory,
            description: e.description,
            amount: parseFloat(e.amount) || 0,
            vendor: e.vendor || 'General Vendor',
            paymentMethod: e.payment_method || 'NEFT/RTGS',
            status: 'Paid' as const,
          }
        })
        setExpenses(mappedExp)
      }

      // 4. Fetch recommendations
      const recRes = await api.get<any[]>('/analytics/recommendations/')
      if (Array.isArray(recRes)) {
        const mappedRecs: Recommendation[] = recRes.map(r => ({
          id: String(r.id),
          priority: (['critical', 'high', 'medium', 'opportunity'].includes((r.priority || '').toLowerCase())
            ? (r.priority || '').toLowerCase()
            : 'medium') as Recommendation['priority'],
          title: r.title || 'Operational Recommendation',
          explanation: r.why_it_matters || r.detected || '',
          metric: String(r.metric_value || 'Active'),
          metricLabel: r.metric_label || 'Metric',
          suggestedAction: r.suggested_action || '',
          relatedCategory: r.category || 'Operations',
          date: r.created_at ? r.created_at.split('T')[0] : '2026-10-25',
          status: r.is_completed ? 'completed' : 'active',
          targetRoute: '/forecasting',
        }))
        setRecommendations(mappedRecs)
      }

      // 5. Fetch suppliers
      const supRes = await api.get<any[]>('/purchases/suppliers/')
      let mappedSuppliers: Supplier[] = []
      if (Array.isArray(supRes)) {
        mappedSuppliers = supRes.map(s => ({
          id: String(s.id),
          name: s.name,
          category: s.category || 'General Procurement',
          contactPerson: s.contact_name || s.name,
          email: s.email || '',
          phone: s.phone || '',
          leadTimeDays: 4,
          fulfillmentRate: 98.0,
          totalSpend: typeof s.total_spend === 'number' ? s.total_spend : 0,
          activeOrders: typeof s.active_orders === 'number' ? s.active_orders : 0,
          rating: parseFloat(s.rating) || 4.8,
          status: 'active',
        }))
      }

      // 6. Fetch purchase orders
      const poRes = await api.get<any[]>('/purchases/orders/')
      if (Array.isArray(poRes)) {
        const mappedPOs: PurchaseOrder[] = poRes.map(po => ({
          id: String(po.id),
          poNumber: po.order_number,
          supplierId: String(po.supplier),
          supplierName: po.supplier_name || 'Procurement Vendor',
          orderDate: po.date,
          expectedDate: po.expected_delivery_date || po.date,
          totalAmount: parseFloat(po.total_cost) || 0,
          itemCount: po.items?.length || 1,
          status: po.status === 'RECEIVED' ? 'Received' : po.status === 'IN_TRANSIT' ? 'In Transit' : po.status === 'CANCELLED' ? 'Cancelled' : 'Pending',
          paymentStatus: po.payment_status === 'PAID' ? 'Paid' : po.payment_status === 'PARTIAL' ? 'Partial' : 'Unpaid',
        }))
        setPurchaseOrders(mappedPOs)

        // Enrich suppliers with PO calculations if needed
        mappedSuppliers = mappedSuppliers.map(sup => {
          const matchingPOs = mappedPOs.filter(
            po => po.supplierId === sup.id || po.supplierName.toLowerCase() === sup.name.toLowerCase()
          )
          const computedSpend = matchingPOs.reduce((acc, po) => acc + po.totalAmount, 0)
          const computedActive = matchingPOs.filter(po => po.status === 'Pending' || po.status === 'In Transit').length
          return {
            ...sup,
            totalSpend: sup.totalSpend > 0 ? sup.totalSpend : computedSpend,
            activeOrders: sup.activeOrders > 0 ? sup.activeOrders : computedActive,
          }
        })
      }
      setSuppliers(mappedSuppliers)

      // 7. Fetch stores
      const storeRes = await api.get<any[]>('/business/stores/')
      if (Array.isArray(storeRes) && storeRes.length > 0) {
        if (storeRes.length === 1) {
          const s = storeRes[0]
          setStores([
            {
              id: String(s.id),
              name: s.name,
              code: s.code || 'MAIN-01',
              location: s.city || 'Primary Hub',
              manager: user?.full_name ? user.full_name : 'Operations Lead',
              revenueShare: 1.0,
            }
          ])
          setSelectedStoreId(String(s.id))
        } else {
          const mappedStores: Store[] = [
            {
              id: 'all',
              name: 'All Locations',
              code: 'ALL',
              location: 'All Active Channels',
              manager: user?.full_name ? `${user.full_name} (Operations)` : 'Operations Lead',
              revenueShare: 1.0,
            },
            ...storeRes.map((s, idx) => ({
              id: String(s.id),
              name: s.name,
              code: s.code || s.name.substring(0, 3).toUpperCase(),
              location: s.city || 'Operational Hub',
              manager: s.manager || (user?.full_name ? user.full_name : 'Operations Lead'),
              revenueShare: Number((1 / storeRes.length).toFixed(2)),
            }))
          ]
          setStores(mappedStores)
        }
      }
    } catch {
      // Keep state as-is if network glitch
    }
  }

  // Load initial backend records on mount or auth change
  useEffect(() => {
    if (isAuthenticated) {
      refreshData()
    } else {
      setProducts([])
      setTransactions([])
      setExpenses([])
      setSuppliers([])
      setPurchaseOrders([])
      setRecommendations([])
      setNotifications([])
      setStores(MOCK_STORES)
      setSelectedStoreId('main')
    }
  }, [isAuthenticated, user?.id])

  const currentStore = useMemo(() => {
    return stores.find(s => s.id === selectedStoreId) || stores[0]
  }, [stores, selectedStoreId])

  // Products actions
  const addProduct = async (newProd: Omit<Product, 'id' | 'status' | 'unitsSold30d' | 'marginPercent' | 'lastRestocked'>) => {
    try {
      const res = await api.post('/inventory/products/', {
        name: newProd.name,
        sku: newProd.sku,
        category: newProd.category,
        current_stock: newProd.stock,
        reorder_level: newProd.reorderLevel,
        unit_cost: newProd.unitCost,
        selling_price: newProd.sellingPrice,
      })
      await refreshData()
      showToast('Product Added', `"${newProd.name}" saved to PostgreSQL catalog.`)
    } catch (err: any) {
      // Optimistic local fallback
      const margin = Number((((newProd.sellingPrice - newProd.unitCost) / newProd.sellingPrice) * 100).toFixed(1))
      const status: Product['status'] = newProd.stock === 0 ? 'out_of_stock' : newProd.stock <= newProd.reorderLevel ? 'low_stock' : 'in_stock'
      const product: Product = {
        ...newProd,
        id: `prod-${Date.now()}`,
        status,
        unitsSold30d: 0,
        marginPercent: margin,
        lastRestocked: new Date().toISOString().split('T')[0],
      }
      setProducts(prev => [product, ...prev])
      showToast('Product Added', `"${product.name}" added locally.`)
    }
  }

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      if (!id.startsWith('prod-')) {
        await api.patch(`/inventory/products/${id}/`, {
          name: updates.name,
          current_stock: updates.stock,
          reorder_level: updates.reorderLevel,
          unit_cost: updates.unitCost,
          selling_price: updates.sellingPrice,
        })
      }
      await refreshData()
      showToast('Product Updated', 'Product record updated.')
    } catch {
      setProducts(prev =>
        prev.map(p => {
          if (p.id !== id) return p
          const updated = { ...p, ...updates }
          return updated
        })
      )
      showToast('Product Updated', 'Product updated locally.')
    }
  }

  const adjustStock = async (id: string, delta: number) => {
    try {
      if (!id.startsWith('prod-')) {
        await api.post(`/inventory/products/${id}/adjust-stock/`, { quantity_change: delta })
      }
      await refreshData()
      showToast('Stock Adjusted', `Inventory count adjusted by ${delta > 0 ? `+${delta}` : delta} units.`)
    } catch {
      setProducts(prev =>
        prev.map(p => {
          if (p.id !== id) return p
          const newStock = Math.max(0, p.stock + delta)
          const status: Product['status'] = newStock === 0 ? 'out_of_stock' : newStock <= p.reorderLevel ? 'low_stock' : 'in_stock'
          return { ...p, stock: newStock, status }
        })
      )
      showToast('Stock Adjusted', `Inventory adjusted locally.`)
    }
  }

  const deleteProduct = async (id: string) => {
    try {
      if (!id.startsWith('prod-')) {
        await api.delete(`/inventory/products/${id}/`)
      }
      await refreshData()
      showToast('Product Deleted', 'Item removed from database.', 'info')
    } catch {
      setProducts(prev => prev.filter(p => p.id !== id))
      showToast('Product Deleted', 'Item removed locally.', 'info')
    }
  }

  // Transactions / Sale actions
  const recordSale = async (sale: {
    description: string
    category: string
    amount: number
    paymentMethod: string
    customer: string
    storeId: string
    productId?: string
    quantitySold?: number
  }) => {
    try {
      const pId = sale.productId || (products[0] ? products[0].id : null)
      if (pId && !pId.startsWith('prod-')) {
        await api.post('/sales/', {
          product: parseInt(pId),
          quantity_sold: sale.quantitySold || 1,
          unit_price: sale.amount,
          payment_method: sale.paymentMethod || 'UPI',
          customer_name: sale.customer,
        })
      }
      await refreshData()
      showToast('Sale Recorded', `Transaction logged successfully for ₹${sale.amount.toLocaleString('en-IN')}.`)
    } catch {
      const targetStore = stores.find(s => s.id === sale.storeId) || stores[1]
      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        code: `TX-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'income',
        category: sale.category,
        description: sale.description,
        amount: sale.amount,
        status: 'completed',
        paymentMethod: sale.paymentMethod,
        storeId: sale.storeId,
        storeName: targetStore.name,
        customer: sale.customer,
      }
      setTransactions(prev => [newTx, ...prev])
      showToast('Sale Recorded', `Transaction logged locally for ₹${sale.amount.toLocaleString('en-IN')}.`)
    }
  }

  const deleteSale = async (id: string) => {
    try {
      if (!id.startsWith('tx-')) {
        await api.delete(`/sales/${id}/`)
      }
      await refreshData()
      showToast('Sale Deleted', 'Transaction removed from records.', 'info')
    } catch {
      setTransactions(prev => prev.filter(t => t.id !== id))
      showToast('Sale Deleted', 'Transaction removed locally.', 'info')
    }
  }

  // Expense actions
  const addExpense = async (newExp: Omit<ExpenseRecord, 'id' | 'code'>) => {
    try {
      await api.post('/expenses/', {
        category: newExp.category,
        amount: newExp.amount,
        date: newExp.date,
        description: newExp.description,
        vendor: newExp.vendor,
        payment_method: newExp.paymentMethod,
      })
      await refreshData()
      showToast('Expense Recorded', `Logged ₹${newExp.amount.toLocaleString('en-IN')} for ${newExp.category}.`)
    } catch {
      const expense: ExpenseRecord = {
        ...newExp,
        id: `exp-${Date.now()}`,
        code: `EXP-${Math.floor(100 + Math.random() * 900)}`,
      }
      setExpenses(prev => [expense, ...prev])
      showToast('Expense Recorded', `Logged ₹${newExp.amount.toLocaleString('en-IN')} locally.`)
    }
  }

  const updateExpense = async (id: string, updates: Partial<ExpenseRecord>) => {
    try {
      if (!id.startsWith('exp-')) {
        await api.patch(`/expenses/${id}/`, updates)
      }
      await refreshData()
      showToast('Expense Updated', 'Expense voucher updated.')
    } catch {
      setExpenses(prev => prev.map(e => (e.id === id ? { ...e, ...updates } : e)))
      showToast('Expense Updated', 'Expense updated locally.')
    }
  }

  const deleteExpense = async (id: string) => {
    try {
      if (!id.startsWith('exp-')) {
        await api.delete(`/expenses/${id}/`)
      }
      await refreshData()
      showToast('Expense Removed', 'Voucher deleted.', 'info')
    } catch {
      setExpenses(prev => prev.filter(e => e.id !== id))
      showToast('Expense Removed', 'Voucher removed locally.', 'info')
    }
  }

  // Supplier & PO actions
  const addSupplier = async (newSup: Omit<Supplier, 'id' | 'totalSpend' | 'activeOrders' | 'rating'>) => {
    try {
      await api.post('/purchases/suppliers/', {
        name: newSup.name,
        contact_name: newSup.contactPerson,
        email: newSup.email,
        phone: newSup.phone,
        city: 'Mumbai',
        payment_terms: 'Net 30',
      })
      await refreshData()
      showToast('Supplier Added', `"${newSup.name}" added to procurement directory.`)
    } catch {
      const sup: Supplier = {
        ...newSup,
        id: `sup-${Date.now()}`,
        totalSpend: 0,
        activeOrders: 0,
        rating: 4.8,
      }
      setSuppliers(prev => [sup, ...prev])
      showToast('Supplier Added', `"${sup.name}" added locally.`)
    }
  }

  const addPurchaseOrder = async (newPo: Omit<PurchaseOrder, 'id' | 'poNumber'>) => {
    try {
      const orderNo = `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`
      await api.post('/purchases/orders/', {
        order_number: orderNo,
        supplier: parseInt(newPo.supplierId) || 1,
        date: newPo.orderDate,
        total_cost: newPo.totalAmount,
        status: 'PENDING',
      })
      await refreshData()
      showToast('PO Created', `Purchase order generated for ₹${newPo.totalAmount.toLocaleString('en-IN')}.`)
    } catch {
      const po: PurchaseOrder = {
        ...newPo,
        id: `po-${Date.now()}`,
        poNumber: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      }
      setPurchaseOrders(prev => [po, ...prev])
      showToast('PO Created', `Purchase order ${po.poNumber} created locally.`)
    }
  }

  const updatePOStatus = async (id: string, newStatus: PurchaseOrder['status']) => {
    try {
      if (!id.startsWith('po-')) {
        await api.patch(`/purchases/orders/${id}/`, { status: newStatus.toUpperCase() })
      }
      await refreshData()
      showToast('Order Status Updated', `PO marked as ${newStatus}.`)
    } catch {
      setPurchaseOrders(prev => prev.map(po => (po.id === id ? { ...po, status: newStatus } : po)))
      showToast('Order Status Updated', `PO marked as ${newStatus} locally.`)
    }
  }

  const deletePurchaseOrder = async (id: string) => {
    try {
      if (!id.startsWith('po-')) {
        await api.delete(`/purchases/orders/${id}/`)
      }
      await refreshData()
      showToast('Order Deleted', 'Purchase order removed.', 'info')
    } catch {
      setPurchaseOrders(prev => prev.filter(po => po.id !== id))
      showToast('Order Deleted', 'Purchase order removed locally.', 'info')
    }
  }

  const deleteSupplier = async (id: string) => {
    try {
      if (!id.startsWith('sup-')) {
        await api.delete(`/purchases/suppliers/${id}/`)
      }
      await refreshData()
      showToast('Supplier Removed', 'Supplier removed from directory.', 'info')
    } catch {
      setSuppliers(prev => prev.filter(s => s.id !== id))
      showToast('Supplier Removed', 'Supplier removed locally.', 'info')
    }
  }

  const purgeDatasets = async (datasetType: string = 'all') => {
    try {
      await api.post('/imports/purge/', { dataset_type: datasetType })
      await refreshData()
      const title = datasetType === 'all' ? 'All Datasets Purged' : `${datasetType.toUpperCase()} Dataset Cleared`
      const msg = datasetType === 'all'
        ? 'All business transactions, inventory, expenses, and orders have been permanently reset.'
        : `All records in the ${datasetType} dataset were removed.`
      showToast(title, msg, 'info')
    } catch {
      if (datasetType === 'all') {
        setTransactions([])
        setExpenses([])
        setProducts([])
        setPurchaseOrders([])
        setSuppliers([])
        setRecommendations([])
        showToast('Data Cleared', 'Records cleared locally.', 'info')
      } else if (datasetType === 'sales') {
        setTransactions([])
      } else if (datasetType === 'expenses') {
        setExpenses([])
      } else if (datasetType === 'inventory') {
        setProducts([])
      } else if (datasetType === 'purchases') {
        setPurchaseOrders([])
      } else if (datasetType === 'suppliers') {
        setSuppliers([])
      }
    }
  }

  const markRecommendationComplete = (id: string) => {
    setRecommendations(prev => prev.map(r => (r.id === id ? { ...r, status: 'completed' as const } : r)))
    showToast('Action Completed', 'Recommendation marked as resolved.')
  }

  const dismissRecommendation = (id: string) => {
    setRecommendations(prev => prev.filter(r => r.id !== id))
    showToast('Recommendation Dismissed', 'Insight archived.', 'info')
  }

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    showToast('Notifications Cleared', 'All alerts marked as read.')
  }

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const isDark = newSettings.darkMode !== undefined
        ? newSettings.darkMode
        : (typeof window !== 'undefined'
          ? (localStorage.getItem('nexusops_theme') === 'dark' || document.documentElement.classList.contains('dark'))
          : (prev.darkMode ?? false))

      if (newSettings.darkMode !== undefined) {
        if (newSettings.darkMode) {
          document.documentElement.classList.add('dark')
          localStorage.setItem('nexusops_theme', 'dark')
        } else {
          document.documentElement.classList.remove('dark')
          localStorage.setItem('nexusops_theme', 'light')
        }
      }
      return { ...prev, ...newSettings, darkMode: isDark }
    })
    try {
      if (newSettings.businessName || newSettings.businessType || newSettings.currency || newSettings.timezone) {
        await api.patch('/business/', {
          ...(newSettings.businessName ? { name: newSettings.businessName } : {}),
          ...(newSettings.businessType ? { business_type: newSettings.businessType } : {}),
          ...(newSettings.currency ? { currency: newSettings.currency } : {}),
          ...(newSettings.timezone ? { timezone: newSettings.timezone } : {}),
        })
      }
      showToast('Settings Saved', 'Business configuration updated.')
    } catch {
      showToast('Settings Saved', 'Business configuration updated locally.')
    }
  }

  // Helper to check if a date string falls within selectedPeriod relative to anchorDate
  const isDateWithinPeriod = (dateStr: string, period: PeriodOption, anchor: Date): boolean => {
    if (period === 'all' || period === 'custom') return true
    if (!dateStr) return false

    const itemDate = new Date(dateStr)
    if (isNaN(itemDate.getTime())) return false

    const anchorMidnight = new Date(
      anchor.getFullYear(),
      anchor.getMonth(),
      anchor.getDate(),
      23, 59, 59, 999
    ).getTime()

    const itemMidnight = new Date(
      itemDate.getFullYear(),
      itemDate.getMonth(),
      itemDate.getDate(),
      0, 0, 0, 0
    ).getTime()

    const diffMs = anchorMidnight - itemMidnight
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    if (period === '24h') {
      return diffDays >= 0 && diffDays <= 1.99
    }
    if (period === '7d') {
      return diffDays >= 0 && diffDays <= 7.99
    }
    if (period === '30d') {
      return diffDays >= 0 && diffDays <= 30.99
    }
    if (period === '12m') {
      return diffDays >= 0 && diffDays <= 366
    }
    return true
  }

  // Anchor date: latest date with recorded activity
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

  // Filtered transactions (respecting both selectedStoreId and selectedPeriod)
  const periodFilteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesStore = selectedStoreId === 'all' || t.storeId === selectedStoreId
      if (!matchesStore) return false
      return isDateWithinPeriod(t.date, selectedPeriod, anchorDate)
    })
  }, [transactions, selectedStoreId, selectedPeriod, anchorDate])

  // Filtered expenses (respecting selectedPeriod)
  const periodFilteredExpenses = useMemo(() => {
    return expenses.filter(e => isDateWithinPeriod(e.date, selectedPeriod, anchorDate))
  }, [expenses, selectedPeriod, anchorDate])

  // Filtered metrics computed across the active period & store scope
  const filteredRevenue = useMemo(() => {
    return periodFilteredTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0)
  }, [periodFilteredTransactions])

  const filteredExpenses = useMemo(() => {
    return periodFilteredExpenses.reduce((acc, e) => acc + e.amount, 0)
  }, [periodFilteredExpenses])

  const filteredProfit = useMemo(() => {
    return filteredRevenue - filteredExpenses
  }, [filteredRevenue, filteredExpenses])

  const periodUnitsSold = useMemo(() => {
    return periodFilteredTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + (t.quantity || 1), 0)
  }, [periodFilteredTransactions])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <AppContext.Provider
      value={{
        stores,
        selectedStoreId,
        setSelectedStoreId,
        currentStore,
        selectedPeriod,
        setSelectedPeriod,
        products,
        addProduct,
        updateProduct,
        adjustStock,
        deleteProduct,
        transactions,
        periodFilteredTransactions,
        recordSale,
        deleteSale,
        expenses,
        periodFilteredExpenses,
        addExpense,
        updateExpense,
        deleteExpense,
        suppliers,
        addSupplier,
        deleteSupplier,
        purchaseOrders,
        addPurchaseOrder,
        updatePOStatus,
        deletePurchaseOrder,
        purgeDatasets,
        recommendations,
        markRecommendationComplete,
        dismissRecommendation,
        notifications,
        unreadCount,
        markNotificationAsRead,
        markAllNotificationsRead,
        isSearchOpen,
        setIsSearchOpen,
        isImportModalOpen,
        setIsImportModalOpen,
        quickActionModal,
        setQuickActionModal,
        settings,
        updateSettings,
        toasts,
        showToast,
        removeToast,
        filteredRevenue,
        filteredExpenses,
        filteredProfit,
        periodUnitsSold,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
