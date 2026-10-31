export type PeriodOption = 'all' | '12m' | '30d' | '7d' | '24h' | 'custom'

export interface Store {
  id: string
  name: string
  code: string
  location: string
  manager: string
  revenueShare: number
}

export interface Transaction {
  id: string
  code: string
  date: string
  time: string
  type: 'income' | 'expense'
  category: string
  description: string
  amount: number
  status: 'completed' | 'pending' | 'flagged'
  paymentMethod: string
  storeId: string
  storeName: string
  customer?: string
  invoiceRef?: string
  quantity?: number
}

export interface Product {
  id: string
  sku: string
  name: string
  category: string
  stock: number
  reorderLevel: number
  unitCost: number
  sellingPrice: number
  supplier: string
  storeId: string
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
  unitsSold30d: number
  marginPercent: number
  lastRestocked: string
}

export interface ForecastPoint {
  date: string
  dayOfWeek: string
  isForecast: boolean
  historicalSales?: number
  predictedSales: number
  lowerBound: number
  upperBound: number
  salesLag7?: number
  salesLag14?: number
  salesLag28?: number
  salesRollingMean7?: number
  salesRollingMean28?: number
}

export interface ForecastModelMetrics {
  mae: number
  rmse: number
  mape: number
  r2Score: number
  horizonDays: number
  totalForecastUnits: number
  avgDailyDemand: number
  peakDay: string
  peakUnits: number
}

export interface Supplier {
  id: string
  name: string
  category: string
  contactPerson: string
  email: string
  phone: string
  leadTimeDays: number
  fulfillmentRate: number
  totalSpend: number
  activeOrders: number
  rating: number
  status: 'active' | 'under_review' | 'inactive'
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  supplierId: string
  supplierName: string
  orderDate: string
  expectedDate: string
  totalAmount: number
  itemCount: number
  status: 'Pending' | 'In Transit' | 'Received' | 'Cancelled'
  paymentStatus: 'Paid' | 'Unpaid' | 'Partial'
}

export interface ExpenseRecord {
  id: string
  code: string
  date: string
  category: 'Cost of Goods' | 'Salaries & Wages' | 'Rent & Lease' | 'Software & Cloud' | 'Marketing & Ads' | 'Logistics & Freight' | 'Utilities & Misc'
  description: string
  amount: number
  vendor: string
  paymentMethod: string
  status: 'Paid' | 'Pending' | 'Scheduled'
}

export interface Recommendation {
  id: string
  priority: 'critical' | 'high' | 'medium' | 'opportunity'
  title: string
  explanation: string
  metric: string
  metricLabel: string
  suggestedAction: string
  relatedCategory: string
  date: string
  status: 'active' | 'completed' | 'dismissed'
  targetRoute?: string
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  timestamp: string
  read: boolean
  type: 'alert' | 'info' | 'success' | 'warning'
}

export interface AppSettings {
  businessName: string
  businessType: string
  currency: 'INR' | 'USD' | 'EUR' | 'GBP'
  currencySymbol: string
  timezone: string
  lowStockThresholdPercent: number
  autoReorderAlerts: boolean
  emailReportsFrequency: 'daily' | 'weekly' | 'monthly' | 'never'
  compactDensity: boolean
  darkMode?: boolean
}
