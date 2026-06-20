import { useState } from 'react';
import { useStore } from '../store/useStore';
import { ArrowDownCircle, Check, Package } from 'lucide-react';
import { formatDateTime, formatCurrency } from '../utils/helpers';

export default function StockIn() {
  const { products, locations, suppliers, stockMovements, currentUser, stockIn } = useStore();
  const [form, setForm] = useState({
    productId: '', locationId: '', quantity: '', purchaseCost: '',
    supplierId: '', invoiceNumber: '', notes: '',
  });
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const recentMovements = stockMovements.filter(m => m.type === 'stock_in').slice(0, 10);

  const selectedProduct = products.find(p => p.id === form.productId);
  const filteredProducts = form.locationId
    ? products.filter(p => p.locationId === form.locationId)
    : products;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.locationId) e.locationId = 'Select a location';
    if (!form.productId) e.productId = 'Select a product';
    if (!form.quantity || Number(form.quantity) <= 0) e.quantity = 'Valid quantity required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    stockIn({
      productId: form.productId,
      locationId: form.locationId,
      quantity: Number(form.quantity),
      purchaseCost: form.purchaseCost ? Number(form.purchaseCost) : undefined,
      supplierId: form.supplierId || undefined,
      invoiceNumber: form.invoiceNumber || undefined,
      notes: form.notes || undefined,
      userId: currentUser?.id || 'unknown',
    });
    setLoading(false);
    setSuccess(true);
    setForm({ productId: '', locationId: '', quantity: '', purchaseCost: '', supplierId: '', invoiceNumber: '', notes: '' });
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-500 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <ArrowDownCircle size={22} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white">Stock In</h2>
                <p className="text-green-100 text-xs">Record incoming stock</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <Check size={16} className="text-green-600 dark:text-green-400" />
                <p className="text-green-700 dark:text-green-300 text-sm font-medium">Stock added successfully!</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Location <span className="text-red-500">*</span></label>
              <select value={form.locationId} onChange={e => setForm(f => ({ ...f, locationId: e.target.value, productId: '' }))}
                className={`w-full px-3 py-2.5 border rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.locationId ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}>
                <option value="">Select location...</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              {errors.locationId && <p className="text-xs text-red-500 mt-0.5">{errors.locationId}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Product <span className="text-red-500">*</span></label>
              <select value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}
                className={`w-full px-3 py-2.5 border rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.productId ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}>
                <option value="">{form.locationId ? 'Select product...' : 'Choose a location first'}</option>
                {form.locationId && filteredProducts.map(p => <option key={p.id} value={p.id}>{p.name} (Qty: {p.quantity})</option>)}
              </select>
              {errors.productId && <p className="text-xs text-red-500 mt-0.5">{errors.productId}</p>}
            </div>

            {selectedProduct && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900">
                <p className="text-xs text-green-700 dark:text-green-300 font-semibold">{selectedProduct.name}</p>
                <p className="text-xs text-green-600 dark:text-green-400">Current Qty: {selectedProduct.quantity} | Min: {selectedProduct.minimumStockLevel}</p>
                <p className="text-xs text-green-600 dark:text-green-400">Purchase Price: {formatCurrency(selectedProduct.purchasePrice)}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Quantity <span className="text-red-500">*</span></label>
                <input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  placeholder="0"
                  className={`w-full px-3 py-2.5 border rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.quantity ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`} />
                {errors.quantity && <p className="text-xs text-red-500 mt-0.5">{errors.quantity}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Purchase Cost (₹)</label>
                <input type="number" value={form.purchaseCost} onChange={e => setForm(f => ({ ...f, purchaseCost: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Invoice Number</label>
                <input type="text" value={form.invoiceNumber} onChange={e => setForm(f => ({ ...f, invoiceNumber: e.target.value }))}
                  placeholder="INV-001"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Supplier</label>
              <select value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Select supplier...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} placeholder="Additional notes..."
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
            </div>

            <div className="pt-1 text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p>📦 User: <span className="font-semibold text-gray-600 dark:text-gray-300">{currentUser?.name}</span></p>
              <p>📅 Date/Time: <span className="font-semibold text-gray-600 dark:text-gray-300">{new Date().toLocaleString('en-IN')}</span></p>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 shadow-lg shadow-green-500/30 flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ArrowDownCircle size={16} />}
              Add Stock In
            </button>
          </form>
        </div>

        {/* Recent Stock In */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Recent Stock In</h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-[500px] overflow-y-auto">
            {recentMovements.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Package size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No stock in records yet</p>
              </div>
            ) : recentMovements.map(m => {
              const product = products.find(p => p.id === m.productId);
              const location = locations.find(l => l.id === m.locationId);
              return (
                <div key={m.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                      <ArrowDownCircle size={16} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{product?.name || 'Unknown Product'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{location?.name} • {m.invoiceNumber && `INV: ${m.invoiceNumber} •`} {formatDateTime(m.timestamp)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">+{m.quantity}</span>
                      <p className="text-xs text-gray-400">units</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
