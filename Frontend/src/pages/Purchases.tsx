import React, { useState, useMemo } from 'react'
import {
  Truck,
  Building2,
  DollarSign,
  Clock,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Mail,
  Phone,
  Star,
  ExternalLink,
  ChevronRight,
  Download,
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
import { formatCurrency, formatDate } from '@/lib/utils'
import { exportToCsv } from '@/lib/exportToCsv'
import { Supplier, PurchaseOrder } from '@/types'

export const Purchases: React.FC = () => {
  const {
    suppliers,
    purchaseOrders,
    updatePOStatus,
    addSupplier,
    deleteSupplier,
    deletePurchaseOrder,
    setQuickActionModal,
  } = useApp()

  const [activeTab, setActiveTab] = useState<'orders' | 'suppliers'>('orders')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  // Modals state
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false)
  const [poToDelete, setPoToDelete] = useState<PurchaseOrder | null>(null)
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null)

  // Add Supplier form state
  const [supName, setSupName] = useState('')
  const [supCategory, setSupCategory] = useState('Displays & Peripherals')
  const [supContact, setSupContact] = useState('')
  const [supEmail, setSupEmail] = useState('')
  const [supPhone, setSupPhone] = useState('')
  const [supLeadTime, setSupLeadTime] = useState(4)

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter(po => {
      const matchesSearch =
        po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'All' || po.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [purchaseOrders, searchQuery, statusFilter])

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      return (
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })
  }, [suppliers, searchQuery])

  // Aggregate metrics
  const totalSpend = purchaseOrders.reduce((acc, po) => acc + po.totalAmount, 0)
  const activeOrdersCount = purchaseOrders.filter(po => po.status === 'Pending' || po.status === 'In Transit').length
  const avgLeadTime = suppliers.length > 0 ? (suppliers.reduce((acc, s) => acc + s.leadTimeDays, 0) / suppliers.length).toFixed(1) : '0'
  const avgFulfillmentRate = suppliers.length > 0 ? (suppliers.reduce((acc, s) => acc + s.fulfillmentRate, 0) / suppliers.length).toFixed(1) : '0'

  // Chart data: Supplier spending in INR
  const supplierSpendChartData = useMemo(() => {
    return suppliers.map(s => {
      const ordersForSup = purchaseOrders.filter(
        po => String(po.supplierId) === String(s.id) || po.supplierName.toLowerCase() === s.name.toLowerCase()
      )
      const poSpend = ordersForSup.reduce((acc, po) => acc + (Number(po.totalAmount) || 0), 0)
      const finalSpend = (s.totalSpend && s.totalSpend > 0) ? s.totalSpend : poSpend

      return {
        name: s.name.split(' ')[0],
        fullName: s.name,
        spend: finalSpend,
      }
    })
  }, [suppliers, purchaseOrders])

  const chartColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']

  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!supName || !supEmail) return
    addSupplier({
      name: supName,
      category: supCategory,
      contactPerson: supContact || 'Procurement Rep',
      email: supEmail,
      phone: supPhone || '+91 98200 12345',
      leadTimeDays: Number(supLeadTime),
      fulfillmentRate: 98.0,
      status: 'active',
    })
    setShowAddSupplierModal(false)
    setSupName('')
    setSupEmail('')
  }

  const handleExport = () => {
    exportToCsv('procurement_purchase_orders', purchaseOrders)
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Purchases & Vendor Network</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Procurement lifecycle, supplier contracts, purchase orders, and vendor fulfillment KPIs (INR)
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
            onClick={() => setShowAddSupplierModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-xs transition"
          >
            <Building2 className="w-3.5 h-3.5" />
            Add Supplier
          </button>
          <button
            onClick={() => setQuickActionModal('po')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition active:scale-98"
          >
            <Plus className="w-4 h-4" />
            New Purchase Order
          </button>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Procurement Spend"
          value={formatCurrency(totalSpend)}
          changePercent={purchaseOrders.length > 0 ? 8.4 : 0}
          trendDirection="up"
          tooltip="Total volume of executed purchase orders this financial period"
          icon={<span className="text-sm font-bold text-blue-600 font-sans">₹</span>}
        />
        <MetricCard
          title="Active Purchase Orders"
          value={`${activeOrdersCount} Orders`}
          badgeText={activeOrdersCount > 0 ? 'Pending Delivery' : 'Cleared'}
          changePercent={0}
          trendDirection="up"
          tooltip="POs currently in manufacturing, packaging, or in-transit shipping"
          icon={<Truck className="w-4 h-4 text-amber-500" />}
        />
        <MetricCard
          title="Avg Supplier Lead Time"
          value={`${avgLeadTime} Days`}
          changePercent={suppliers.length > 0 ? 5.2 : 0}
          trendDirection="down"
          isPositive={true}
          tooltip="Turnaround duration from PO transmission to warehouse dock reception"
          icon={<Clock className="w-4 h-4 text-indigo-600" />}
        />
        <MetricCard
          title="On-Time Delivery Rate"
          value={`${avgFulfillmentRate}%`}
          badgeText={suppliers.length > 0 ? (Number(avgFulfillmentRate) >= 90 ? 'High Reliability' : 'Moderate') : 'No Data'}
          changePercent={suppliers.length > 0 ? 1.8 : 0}
          trendDirection="up"
          tooltip="Percentage of consignments received on or before the committed delivery date"
          icon={<CheckCircle className="w-4 h-4 text-emerald-600" />}
        />
      </div>

      {/* 3. Procurement Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Supplier Lifetime Spend Breakdown</h3>
              <p className="text-[11px] text-slate-400">Total capital allocated per certified manufacturing partner</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              {suppliers.length} Registered
            </span>
          </div>

          <div className="h-60 w-full">
            {supplierSpendChartData.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <Truck className="w-8 h-8 text-slate-300 mb-2" />
                <div className="text-xs font-semibold text-slate-600">No Supplier Spend Data</div>
                <p className="text-[11px] text-slate-400 mt-0.5">Upload suppliers.csv or add vendors to visualize spend.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={supplierSpendChartData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={val => {
                      if (!val || val === 0) return '₹0'
                      if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`
                      if (val >= 100000) return `₹${(val / 100000).toFixed(val % 100000 === 0 ? 0 : 1)}L`
                      if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`
                      return `₹${val}`
                    }}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Total Spend']}
                    labelFormatter={label => {
                      const item = supplierSpendChartData.find(d => d.name === label)
                      return item?.fullName || label
                    }}
                  />
                  <Bar dataKey="spend" fill="#2563eb" radius={[6, 6, 0, 0]}>
                    {supplierSpendChartData.map((_, idx) => (
                      <Cell key={`sup-bar-${idx}`} fill={chartColors[idx % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Procurement Health Overview</h3>
            <p className="text-[11px] text-slate-400">Vendor quality scoring & SLA compliance</p>
          </div>

          <div className="space-y-3.5 my-2">
            {suppliers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                <span>No active suppliers registered</span>
              </div>
            ) : (
              suppliers.slice(0, 3).map(s => (
                <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-900">{s.name}</div>
                    <div className="text-[10px] text-slate-400">{s.category} • {s.leadTimeDays}d Lead time</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-600">{s.fulfillmentRate}% SLA</div>
                    <div className="text-[10px] text-amber-500 font-medium">★ {s.rating} Rating</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="text-[11px] text-slate-400 text-center border-t border-slate-100 pt-2">
            All tier-1 suppliers meet ISO-9001 and GST compliance standards.
          </div>
        </div>
      </div>

      {/* 4. Tab Navigation (Orders vs Suppliers) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === 'orders'
                  ? 'bg-blue-50 text-blue-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Purchase Orders ({purchaseOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === 'suppliers'
                  ? 'bg-blue-50 text-blue-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Supplier Directory ({suppliers.length})
            </button>
          </div>

          {/* Search & Status Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none"
              />
            </div>

            {activeTab === 'orders' && (
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Transit">In Transit</option>
                <option value="Received">Received</option>
              </select>
            )}
          </div>
        </div>

        {/* Tab Content 1: Purchase Orders Table */}
        {activeTab === 'orders' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">PO Reference</th>
                  <th className="py-2.5 px-3">Supplier Name</th>
                  <th className="py-2.5 px-3">Order Date</th>
                  <th className="py-2.5 px-3">Expected Delivery</th>
                  <th className="py-2.5 px-3 text-right">Items</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {filteredOrders.map(po => (
                  <tr key={po.id} className="hover:bg-slate-50/80 transition group">
                    <td className="py-3 px-3 font-mono font-semibold text-slate-900 group-hover:text-blue-600 transition">
                      {po.poNumber}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {po.supplierName}
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {formatDate(po.orderDate)}
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {formatDate(po.expectedDate)}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-800">
                      {po.itemCount} units
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {formatCurrency(po.totalAmount)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <StatusBadge
                        label={po.status}
                        variant={
                          po.status === 'Received'
                            ? 'success'
                            : po.status === 'In Transit'
                            ? 'info'
                            : po.status === 'Pending'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {po.status !== 'Received' ? (
                          <select
                            value={po.status}
                            onChange={e => updatePOStatus(po.id, e.target.value as any)}
                            className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Received">Mark Received</option>
                          </select>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-semibold">Fulfilled</span>
                        )}
                        <button
                          onClick={() => setPoToDelete(po)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Delete Purchase Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab Content 2: Supplier Directory Grid */}
        {activeTab === 'suppliers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {filteredSuppliers.map(sup => (
              <div
                key={sup.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-200 hover:shadow-card transition flex flex-col justify-between space-y-3 bg-white"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{sup.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{sup.category}</p>
                    </div>
                    <StatusBadge
                      label={sup.status === 'active' ? 'Active' : 'Under Review'}
                      variant={sup.status === 'active' ? 'success' : 'warning'}
                      size="sm"
                    />
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{sup.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sup.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Lead Time</span>
                    <span className="font-semibold text-slate-900">{sup.leadTimeDays} days</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">On-Time Rate</span>
                    <span className="font-semibold text-emerald-600">{sup.fulfillmentRate}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedSupplier(sup)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                      title="Supplier Profile"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSupplierToDelete(sup)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="Delete Supplier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Add Supplier Modal */}
      {showAddSupplierModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowAddSupplierModal(false)}
          title="Register Approved Supplier"
          subtitle="Add a new manufacturing or wholesale partner to procurement roster"
        >
          <form onSubmit={handleSupplierSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Supplier Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Precision Robotics India"
                value={supName}
                onChange={e => setSupName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={supCategory}
                  onChange={e => setSupCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Displays & Peripherals">Displays & Peripherals</option>
                  <option value="Ergonomic Furniture">Ergonomic Furniture</option>
                  <option value="Semiconductors & Storage">Semiconductors & Storage</option>
                  <option value="Specialty Beverages">Specialty Beverages</option>
                  <option value="Office Supplies & Packaging">Office Supplies & Packaging</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Average Lead Time (Days)</label>
                <input
                  type="number"
                  required
                  value={supLeadTime}
                  onChange={e => setSupLeadTime(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. Maya Lin"
                  value={supContact}
                  onChange={e => setSupContact(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  placeholder="+91 98200 12345"
                  value={supPhone}
                  onChange={e => setSupPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Business Email</label>
              <input
                type="email"
                required
                placeholder="procurement@partner.in"
                value={supEmail}
                onChange={e => setSupEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddSupplierModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs"
              >
                Register Supplier
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 6. Supplier Profile Details Modal */}
      {selectedSupplier && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedSupplier(null)}
          title={selectedSupplier.name}
          subtitle={`Primary Partner: ${selectedSupplier.category}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/60">
              <div>
                <span className="text-[11px] text-slate-400 block">Total Spend (YTD)</span>
                <span className="text-base font-bold text-slate-900">
                  {formatCurrency(
                    selectedSupplier.totalSpend > 0
                      ? selectedSupplier.totalSpend
                      : purchaseOrders
                          .filter(
                            po =>
                              String(po.supplierId) === String(selectedSupplier.id) ||
                              po.supplierName.toLowerCase() === selectedSupplier.name.toLowerCase()
                          )
                          .reduce((a, b) => a + (Number(b.totalAmount) || 0), 0)
                  )}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Quality Rating</span>
                <span className="text-base font-bold text-amber-500">★ {selectedSupplier.rating} / 5.0</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Standard Lead Time</span>
                <span className="text-sm font-semibold text-slate-800">{selectedSupplier.leadTimeDays} business days</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Fulfillment SLA</span>
                <span className="text-sm font-semibold text-emerald-600">{selectedSupplier.fulfillmentRate}% on-time</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="font-semibold text-slate-900">Direct Contact Information</div>
              <p>Contact Representative: <strong>{selectedSupplier.contactPerson}</strong></p>
              <p>Email: <a href={`mailto:${selectedSupplier.email}`} className="text-blue-600 hover:underline">{selectedSupplier.email}</a></p>
              <p>Phone: {selectedSupplier.phone}</p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  const s = selectedSupplier
                  setSelectedSupplier(null)
                  setSupplierToDelete(s)
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Supplier
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedSupplier(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setSelectedSupplier(null)
                    setQuickActionModal('po')
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs"
                >
                  Create PO for {selectedSupplier.name.split(' ')[0]}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 7. Confirm Delete PO Modal */}
      {poToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setPoToDelete(null)}
          title="Confirm Delete Purchase Order"
          subtitle={`PO Number: ${poToDelete.poNumber}`}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete purchase order{' '}
              <strong className="text-slate-900 dark:text-slate-100">{poToDelete.poNumber}</strong> ({formatCurrency(poToDelete.totalAmount)}) for{' '}
              <strong className="text-slate-900 dark:text-slate-100">{poToDelete.supplierName}</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPoToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deletePurchaseOrder(poToDelete.id)
                  setPoToDelete(null)
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition"
              >
                Yes, Delete Order
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 8. Confirm Delete Supplier Modal */}
      {supplierToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setSupplierToDelete(null)}
          title="Confirm Delete Supplier"
          subtitle={supplierToDelete.name}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to remove supplier{' '}
              <strong className="text-slate-900 dark:text-slate-100">{supplierToDelete.name}</strong> from your directory? Any active purchase orders tied to this vendor will also be removed.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSupplierToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteSupplier(supplierToDelete.id)
                  setSupplierToDelete(null)
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition"
              >
                Yes, Delete Supplier
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
