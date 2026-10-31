import React, { useState, useMemo } from 'react'
import {
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Filter,
  Edit2,
  Sliders,
  DollarSign,
  ArrowUpDown,
  Download,
  Boxes,
  Trash2,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import { useApp } from '@/context/AppContext'
import { MetricCard } from '@/components/ui/MetricCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'
import { exportToCsv } from '@/lib/exportToCsv'
import { Product } from '@/types'

export const Inventory: React.FC = () => {
  const { products, updateProduct, deleteProduct, adjustStock, setQuickActionModal } = useApp()

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  // Modals state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Product | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [adjustDelta, setAdjustDelta] = useState(10)

  // Edit form state
  const [editPrice, setEditPrice] = useState(0)
  const [editCost, setEditCost] = useState(0)
  const [editReorder, setEditReorder] = useState(0)

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.supplier.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [products, searchQuery, categoryFilter, statusFilter])

  // Inventory Totals
  const totalProducts = products.length
  const totalValue = products.reduce((acc, p) => acc + p.stock * p.unitCost, 0)
  const lowStockCount = products.filter(p => p.status === 'low_stock').length
  const outOfStockCount = products.filter(p => p.status === 'out_of_stock').length

  // Category distribution for pie chart
  const categoryDistribution = useMemo(() => {
    const map: Record<string, number> = {}
    products.forEach(p => {
      map[p.category] = (map[p.category] || 0) + p.stock
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [products])

  // Stock level vs reorder threshold chart data
  const stockChartData = useMemo(() => {
    return products.slice(0, 8).map(p => ({
      ...p,
      displayName: p.name,
      shortName: p.name.length > 15 ? p.name.slice(0, 14) + '…' : p.name,
    }))
  }, [products])

  const chartColors = ['#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4']

  const handleEditOpen = (p: Product) => {
    setEditingProduct(p)
    setEditPrice(p.sellingPrice)
    setEditCost(p.unitCost)
    setEditReorder(p.reorderLevel)
  }

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return
    updateProduct(editingProduct.id, {
      sellingPrice: Number(editPrice),
      unitCost: Number(editCost),
      reorderLevel: Number(editReorder),
    })
    setEditingProduct(null)
  }

  const handleStockAdjustSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!stockAdjustProduct) return
    adjustStock(stockAdjustProduct.id, Number(adjustDelta))
    setStockAdjustProduct(null)
  }

  const handleExport = () => {
    exportToCsv('inventory_valuation_catalog', filteredProducts)
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Inventory & Warehouse Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time SKU stock levels, reorder safety thresholds, and inventory asset valuation (INR)
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
            onClick={() => setQuickActionModal('product')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition active:scale-98"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Catalog SKUs"
          value={`${totalProducts} Products`}
          changePercent={products.length > 0 ? 4.3 : 0}
          trendDirection="up"
          tooltip="Active distinct stock keeping units registered in operations"
          icon={<Package className="w-4 h-4 text-blue-600" />}
        />
        <MetricCard
          title="Total Inventory Value"
          value={formatCurrency(totalValue)}
          changePercent={products.length > 0 ? 2.8 : 0}
          trendDirection="up"
          tooltip="Asset value of sitting stock based on manufacturer landed cost"
          icon={<span className="text-sm font-bold text-emerald-600 font-sans">₹</span>}
        />
        <MetricCard
          title="Low-Stock Alerts"
          value={`${lowStockCount} SKUs`}
          badgeText={lowStockCount > 0 ? 'Action Needed' : 'Healthy'}
          changePercent={lowStockCount > 0 ? 12.5 : 0}
          trendDirection={lowStockCount > 0 ? 'up' : 'down'}
          isPositive={lowStockCount === 0}
          tooltip="Items with current units below minimum safety buffer"
          icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
        />
        <MetricCard
          title="Out of Stock"
          value={`${outOfStockCount} SKUs`}
          badgeText={outOfStockCount > 0 ? 'Critical' : 'Zero'}
          changePercent={0}
          trendDirection="down"
          isPositive={outOfStockCount === 0}
          tooltip="SKUs currently depleted and unable to fulfill orders"
          icon={<XCircle className="w-4 h-4 text-rose-500" />}
        />
      </div>

      {/* 3. Charts: Stock Level vs Reorder Threshold + Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Stock Level vs. Reorder Safety Threshold</h3>
              <p className="text-[11px] text-slate-400">Comparing available on-hand units with threshold level</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> On-Hand Stock
              </span>
              <span className="flex items-center gap-1.5 text-amber-500 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Reorder Buffer
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {products.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <Package className="w-8 h-8 text-slate-300 mb-2" />
                <div className="text-xs font-semibold text-slate-600">No Inventory Stock Logged</div>
                <p className="text-[11px] text-slate-400 mt-0.5">Import inventory datasets or add products to track stock levels.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockChartData} barGap={4}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickFormatter={val => (val.length > 15 ? val.slice(0, 14) + '…' : val)}
                    interval={0}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload
                      return item?.name || label
                    }}
                    formatter={(val: any, name: any) => [
                      `${val} units`,
                      name === 'stock' ? 'Current On-Hand' : 'Reorder Level',
                    ]}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="stock" fill="#2563eb" radius={[4, 4, 0, 0]} name="stock" />
                  <Bar dataKey="reorderLevel" fill="#f59e0b" radius={[4, 4, 0, 0]} name="reorderLevel" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Unit Stock by Category</h3>
            <p className="text-[11px] text-slate-400">Physical inventory volume distribution</p>
          </div>

          <div className="h-52 w-full my-1">
            {categoryDistribution.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                <span>No category stock distribution</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={62}
                    paddingAngle={3}
                  >
                    {categoryDistribution.map((_, idx) => (
                      <Cell key={`pie-cell-${idx}`} fill={chartColors[idx % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => `${val} units`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-1.5 text-xs">
            {categoryDistribution.slice(0, 4).map((c, i) => (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: chartColors[i % chartColors.length] }} />
                  <span className="text-slate-600 truncate">{c.name}</span>
                </div>
                <span className="font-semibold text-slate-800">{c.value} pcs</span>
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
              placeholder="Search by SKU, product name, or supplier..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
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
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
            >
              <option value="All">All Stock Statuses</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* 5. Inventory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Product Name & SKU</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">In Stock</th>
                <th className="py-2.5 px-3 text-right">Reorder Level</th>
                <th className="py-2.5 px-3 text-right">Unit Cost</th>
                <th className="py-2.5 px-3 text-right">Retail Price</th>
                <th className="py-2.5 px-3 text-right">Margin</th>
                <th className="py-2.5 px-3">Supplier</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {filteredProducts.map(p => {
                const isOut = p.status === 'out_of_stock'
                const isLow = p.status === 'low_stock'

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition group">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.sku}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{p.category}</td>
                    <td className="py-3 px-3 text-center">
                      <StatusBadge
                        label={isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                        variant={isOut ? 'danger' : isLow ? 'warning' : 'success'}
                        size="sm"
                      />
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {p.stock}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-500 font-medium">
                      {p.reorderLevel}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-500">
                      ₹{p.unitCost.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-900">
                      ₹{p.sellingPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
                        {p.marginPercent}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px] truncate max-w-[130px]">
                      {p.supplier}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setStockAdjustProduct(p)
                            setAdjustDelta(10)
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition"
                          title="Quick Stock Adjustment"
                        >
                          <Sliders className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditOpen(p)}
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                          title="Edit Pricing & Thresholds"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setProductToDelete(p)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                    No products found matching the search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Edit Product Pricing Modal */}
      {editingProduct && (
        <Modal
          isOpen={true}
          onClose={() => setEditingProduct(null)}
          title={`Edit Product: ${editingProduct.name}`}
          subtitle={`SKU: ${editingProduct.sku}`}
        >
          <form onSubmit={handleEditSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Cost (₹)</label>
                <input
                  type="number"
                  value={editCost}
                  onChange={e => setEditCost(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price (₹)</label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={e => setEditPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Level (Safety Buffer)</label>
              <input
                type="number"
                value={editReorder}
                onChange={e => setEditReorder(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 flex justify-between">
              <span>Updated Margin</span>
              <span className="font-bold text-emerald-600">
                {(((editPrice - editCost) / (editPrice || 1)) * 100).toFixed(1)}%
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const p = editingProduct
                  setEditingProduct(null)
                  setProductToDelete(p)
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Product
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
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

      {/* 7. Quick Stock Adjustment Modal */}
      {stockAdjustProduct && (
        <Modal
          isOpen={true}
          onClose={() => setStockAdjustProduct(null)}
          title="Stock Adjustment"
          subtitle={`Adjust physical unit count for ${stockAdjustProduct.name}`}
        >
          <form onSubmit={handleStockAdjustSave} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between items-center">
              <span className="text-slate-500">Current On-Hand:</span>
              <span className="text-base font-bold text-slate-900">{stockAdjustProduct.stock} units</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Adjustment Delta (+ to add restock, - to deduct damaged/shrinkage)
              </label>
              <input
                type="number"
                value={adjustDelta}
                onChange={e => setAdjustDelta(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div className="p-3 bg-blue-50/70 rounded-xl text-xs text-blue-900 flex justify-between items-center border border-blue-100">
              <span>New Resulting Stock:</span>
              <span className="text-base font-bold text-blue-700">
                {Math.max(0, stockAdjustProduct.stock + Number(adjustDelta))} units
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStockAdjustProduct(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs"
              >
                Confirm Adjustment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 8. Confirm Delete Product Modal */}
      {productToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setProductToDelete(null)}
          title="Confirm Delete Product"
          subtitle={`SKU: ${productToDelete.sku}`}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-900 dark:text-slate-100">{productToDelete.name}</strong> from your inventory catalog? This will remove all pricing and stock tracking for this item.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteProduct(productToDelete.id)
                  setProductToDelete(null)
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition"
              >
                Yes, Delete Product
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
