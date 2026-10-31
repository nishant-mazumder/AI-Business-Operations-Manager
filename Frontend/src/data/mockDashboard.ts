export interface MonthlyComparisonPoint {
  month: string
  lastYear: number
  thisYear: number
  expenses: number
  profit: number
}

export const MONTHLY_FINANCIAL_DATA: MonthlyComparisonPoint[] = [
  { month: 'Feb', lastYear: 420000, thisYear: 580000, expenses: 320000, profit: 260000 },
  { month: 'Mar', lastYear: 480000, thisYear: 640000, expenses: 350000, profit: 290000 },
  { month: 'Apr', lastYear: 560000, thisYear: 720000, expenses: 390000, profit: 330000 },
  { month: 'May', lastYear: 620000, thisYear: 840000, expenses: 440000, profit: 400000 },
  { month: 'Jun', lastYear: 710000, thisYear: 980000, expenses: 490000, profit: 490000 },
  { month: 'Jul', lastYear: 680000, thisYear: 910000, expenses: 470000, profit: 440000 },
  { month: 'Aug', lastYear: 760000, thisYear: 1040000, expenses: 510000, profit: 530000 },
  { month: 'Sep', lastYear: 840000, thisYear: 1160000, expenses: 540000, profit: 620000 },
  { month: 'Oct', lastYear: 950000, thisYear: 1284500, expenses: 529000, profit: 755500 },
  { month: 'Nov', lastYear: 890000, thisYear: 1120000, expenses: 510000, profit: 610000 },
  { month: 'Dec', lastYear: 1150000, thisYear: 1540000, expenses: 620000, profit: 920000 },
  { month: 'Jan', lastYear: 980000, thisYear: 1320000, expenses: 560000, profit: 760000 },
]

export const WEEKLY_SALES_TREND = [
  { day: 'Mon', sales: 142000, orders: 48, visitors: 320 },
  { day: 'Tue', sales: 168000, orders: 54, visitors: 360 },
  { day: 'Wed', sales: 189000, orders: 62, visitors: 410 },
  { day: 'Thu', sales: 215000, orders: 71, visitors: 450 },
  { day: 'Fri', sales: 294000, orders: 98, visitors: 680 },
  { day: 'Sat', sales: 348000, orders: 122, visitors: 820 },
  { day: 'Sun', sales: 262000, orders: 86, visitors: 590 },
]

export const CATEGORY_REVENUE_PIE = [
  { name: 'Hardware & Displays', value: 462000, color: '#3b82f6', percent: 36 },
  { name: 'Audio & Peripherals', value: 324000, color: '#ec4899', percent: 25 },
  { name: 'Office Furniture', value: 278000, color: '#f59e0b', percent: 22 },
  { name: 'Power & Cables', value: 142000, color: '#10b981', percent: 11 },
  { name: 'Consumables & Retail', value: 78500, color: '#06b6d4', percent: 6 },
]

export const TOP_PRODUCTS_RANKING = [
  { name: 'UltraHD 27" Curved Pro Monitor', revenue: 329990, units: 42, growth: '+18.4%' },
  { name: 'ErgoPeak Synchronous Chair', revenue: 299990, units: 31, growth: '+14.2%' },
  { name: 'AcousticPro ANC Headphones', revenue: 262485, units: 88, growth: '+22.6%' },
  { name: 'GaN 65W Multi-Port Hub', revenue: 154755, units: 215, growth: '+31.0%' },
  { name: 'VortexSpeed 2TB NVMe SSD', revenue: 149990, units: 64, growth: '+9.5%' },
]

export const NOTIFICATIONS_FEED = [
  {
    id: 'n-1',
    title: 'Low Stock Alert',
    message: 'ErgoPeak Executive Chair has reached critical threshold (8 units left).',
    timestamp: '12m ago',
    read: false,
    type: 'warning' as const,
  },
  {
    id: 'n-2',
    title: 'High-Value Sale Recorded',
    message: 'Corporate PO for ₹1,31,996 completed via Razorpay POS terminal.',
    timestamp: '45m ago',
    read: false,
    type: 'success' as const,
  },
  {
    id: 'n-3',
    title: 'AI Forecast Updated',
    message: 'XGBoost demand engine projected +28% weekend spike for Bengaluru hub.',
    timestamp: '2h ago',
    read: true,
    type: 'info' as const,
  },
  {
    id: 'n-4',
    title: 'Purchase Order Delivered',
    message: 'PO-2026-1047 from Silicon Matrix received and verified at Mumbai dock.',
    timestamp: '4h ago',
    read: true,
    type: 'info' as const,
  },
]
