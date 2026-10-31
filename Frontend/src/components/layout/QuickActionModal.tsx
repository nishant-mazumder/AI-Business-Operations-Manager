import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useApp } from '@/context/AppContext'

export const QuickActionModal: React.FC = () => {
  const {
    quickActionModal,
    setQuickActionModal,
    products,
    stores,
    suppliers,
    recordSale,
    addProduct,
    addExpense,
    addPurchaseOrder,
  } = useApp()

  // Sale form state
  const [saleProduct, setSaleProduct] = useState(products[0]?.name || '')
  const [saleCategory, setSaleCategory] = useState(products[0]?.category || 'Hardware & Displays')
  const [saleQty, setSaleQty] = useState(1)
  const [salePrice, setSalePrice] = useState(products[0]?.sellingPrice || 32999)
  const [saleCustomer, setSaleCustomer] = useState('')
  const [salePayment, setSalePayment] = useState('UPI / GPay')
  const [saleStore, setSaleStore] = useState('store-1')

  // Product form state
  const [pSku, setPSku] = useState('')
  const [pName, setPName] = useState('')
  const [pCategory, setPCategory] = useState('Hardware & Displays')
  const [pStock, setPStock] = useState(25)
  const [pReorder, setPReorder] = useState(15)
  const [pCost, setPCost] = useState(4500)
  const [pPrice, setPPrice] = useState(8999)
  const [pSupplier, setPSupplier] = useState('Synapse Tech Electronics India')
  const [pStore, setPStore] = useState('store-1')

  // Expense form state
  const [expTitle, setExpTitle] = useState('')
  const [expCategory, setExpCategory] = useState<'Cost of Goods' | 'Salaries & Wages' | 'Rent & Lease' | 'Software & Cloud' | 'Marketing & Ads' | 'Logistics & Freight' | 'Utilities & Misc'>('Marketing & Ads')
  const [expAmount, setExpAmount] = useState(25000)
  const [expVendor, setExpVendor] = useState('')
  const [expMethod, setExpMethod] = useState('HDFC Corporate Card')

  // PO form state
  const [poSupplierId, setPoSupplierId] = useState(suppliers[0]?.id || '')
  const [poAmount, setPoAmount] = useState(185000)
  const [poItemCount, setPoItemCount] = useState(30)
  const [poExpectedDays, setPoExpectedDays] = useState(5)

  if (!quickActionModal) return null

  const handleSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    recordSale({
      description: `${saleProduct} (x${saleQty})`,
      category: saleCategory,
      amount: salePrice * saleQty,
      paymentMethod: salePayment,
      customer: saleCustomer || 'Retail Customer (Walk-in)',
      storeId: saleStore,
    })
    setQuickActionModal(null)
  }

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pName || !pSku) return
    addProduct({
      sku: pSku.toUpperCase(),
      name: pName,
      category: pCategory,
      stock: Number(pStock),
      reorderLevel: Number(pReorder),
      unitCost: Number(pCost),
      sellingPrice: Number(pPrice),
      supplier: pSupplier,
      storeId: pStore,
    })
    setQuickActionModal(null)
  }

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!expTitle) return
    addExpense({
      date: new Date().toISOString().split('T')[0],
      category: expCategory,
      description: expTitle,
      amount: Number(expAmount),
      vendor: expVendor || 'Authorized Vendor',
      paymentMethod: expMethod,
      status: 'Paid',
    })
    setQuickActionModal(null)
  }

  const handlePOSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const sup = suppliers.find(s => s.id === poSupplierId) || suppliers[0]
    const expected = new Date()
    expected.setDate(expected.getDate() + Number(poExpectedDays))

    addPurchaseOrder({
      supplierId: sup.id,
      supplierName: sup.name,
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: expected.toISOString().split('T')[0],
      totalAmount: Number(poAmount),
      itemCount: Number(poItemCount),
      status: 'Pending',
      paymentStatus: 'Unpaid',
    })
    setQuickActionModal(null)
  }

  return (
    <>
      {/* 1. Record Sale Modal */}
      {quickActionModal === 'sale' && (
        <Modal
          isOpen={true}
          onClose={() => setQuickActionModal(null)}
          title="Record New Transaction"
          subtitle="Record customer purchase and adjust sales velocity in real-time"
        >
          <form onSubmit={handleSaleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Item / Product</label>
              <select
                value={saleProduct}
                onChange={e => {
                  const prod = products.find(p => p.name === e.target.value)
                  setSaleProduct(e.target.value)
                  if (prod) {
                    setSalePrice(prod.sellingPrice)
                    setSaleCategory(prod.category)
                  }
                }}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {products.map(p => (
                  <option key={p.id} value={p.name}>
                    {p.name} — ₹{p.sellingPrice.toLocaleString('en-IN')} ({p.stock} in stock)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={saleQty}
                  onChange={e => setSaleQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Price (₹)</label>
                <input
                  type="number"
                  value={salePrice}
                  onChange={e => setSalePrice(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Organization</label>
                <input
                  type="text"
                  placeholder="e.g. Reliance Retail / Walk-in"
                  value={saleCustomer}
                  onChange={e => setSaleCustomer(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Store Location</label>
                <select
                  value={saleStore}
                  onChange={e => setSaleStore(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {stores.filter(s => s.id !== 'all').map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={salePayment}
                onChange={e => setSalePayment(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="UPI / GPay">UPI (Google Pay / PhonePe)</option>
                <option value="Razorpay POS">Razorpay POS Terminal</option>
                <option value="Credit Card / RuPay">RuPay / Credit Card</option>
                <option value="NEFT / RTGS Wire">NEFT / RTGS Wire</option>
                <option value="NetBanking (HDFC/ICICI)">NetBanking (HDFC / ICICI)</option>
                <option value="Paytm QR">Paytm QR Wallet</option>
              </select>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-xl flex items-center justify-between border border-blue-100">
              <span className="text-xs font-medium text-blue-900">Calculated Total Revenue</span>
              <span className="text-base font-bold text-blue-700">
                ₹{(salePrice * saleQty).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setQuickActionModal(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
              >
                Confirm & Record Sale
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 2. Add Product Modal */}
      {quickActionModal === 'product' && (
        <Modal
          isOpen={true}
          onClose={() => setQuickActionModal(null)}
          title="Add New Inventory Product"
          subtitle="Catalog a new SKU into the multi-store operations system"
        >
          <form onSubmit={handleProductSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SKU Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MON-4K-ULTRA"
                  value={pSku}
                  onChange={e => setPSku(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={pCategory}
                  onChange={e => setPCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Hardware & Displays">Hardware & Displays</option>
                  <option value="Audio & Peripherals">Audio & Peripherals</option>
                  <option value="Office Furniture">Office Furniture</option>
                  <option value="Power & Cables">Power & Cables</option>
                  <option value="Consumables & Retail">Consumables & Retail</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Product Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Ergonomic Dual-Arm Monitor Stand"
                value={pName}
                onChange={e => setPName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Cost (₹)</label>
                <input
                  type="number"
                  required
                  value={pCost}
                  onChange={e => setPCost(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Retail Price (₹)</label>
                <input
                  type="number"
                  required
                  value={pPrice}
                  onChange={e => setPPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Stock Quantity</label>
                <input
                  type="number"
                  required
                  value={pStock}
                  onChange={e => setPStock(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Alert Level</label>
                <input
                  type="number"
                  required
                  value={pReorder}
                  onChange={e => setPReorder(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier</label>
                <select
                  value={pSupplier}
                  onChange={e => setPSupplier(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Store Hub</label>
                <select
                  value={pStore}
                  onChange={e => setPStore(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {stores.filter(s => s.id !== 'all').map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setQuickActionModal(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
              >
                Save Product
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 3. Record Expense Modal */}
      {quickActionModal === 'expense' && (
        <Modal
          isOpen={true}
          onClose={() => setQuickActionModal(null)}
          title="Record Operating Expense"
          subtitle="Track accounts payable, logistics, salaries, or overhead costs"
        >
          <form onSubmit={handleExpenseSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Description</label>
              <input
                type="text"
                required
                placeholder="e.g. Google India Festive Retargeting Campaign"
                value={expTitle}
                onChange={e => setExpTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Category</label>
                <select
                  value={expCategory}
                  onChange={e => setExpCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Cost of Goods">Cost of Goods</option>
                  <option value="Salaries & Wages">Salaries & Wages</option>
                  <option value="Rent & Lease">Rent & Lease</option>
                  <option value="Software & Cloud">Software & Cloud</option>
                  <option value="Marketing & Ads">Marketing & Ads</option>
                  <option value="Logistics & Freight">Logistics & Freight</option>
                  <option value="Utilities & Misc">Utilities & Misc</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={expAmount}
                  onChange={e => setExpAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor / Payee</label>
                <input
                  type="text"
                  placeholder="e.g. Tata Power / Delhivery"
                  value={expVendor}
                  onChange={e => setExpVendor(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={expMethod}
                  onChange={e => setExpMethod(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="HDFC Corporate Card">HDFC Corporate Card</option>
                  <option value="Direct ACH / IMPS">Direct ACH / IMPS</option>
                  <option value="NEFT / RTGS Wire">NEFT / RTGS Wire</option>
                  <option value="UPI Direct">UPI Direct</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setQuickActionModal(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
              >
                Record Expense
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 4. Create PO Modal */}
      {quickActionModal === 'po' && (
        <Modal
          isOpen={true}
          onClose={() => setQuickActionModal(null)}
          title="Create Purchase Order"
          subtitle="Generate purchase procurement order for approved supplier"
        >
          <form onSubmit={handlePOSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Supplier</label>
              <select
                value={poSupplierId}
                onChange={e => setPoSupplierId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={poAmount}
                  onChange={e => setPoAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Units / Items</label>
                <input
                  type="number"
                  required
                  value={poItemCount}
                  onChange={e => setPoItemCount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Lead Time (Days)</label>
              <input
                type="number"
                value={poExpectedDays}
                onChange={e => setPoExpectedDays(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setQuickActionModal(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
              >
                Generate & Dispatch PO
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
