import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Truck, Check, ArrowRight, MapPin, CheckCircle } from 'lucide-react';
import { formatDateTime } from '../utils/helpers';

export default function Transfers() {
  const { products, locations, transfers, currentUser, createTransfer, completeTransfer } = useStore();
  const [form, setForm] = useState({
    productId: '', fromLocationId: '', toLocationId: '',
    quantity: '', notes: '',
  });
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activeTransfers = transfers.filter(t => t.status === 'in_transit');
  const completedTransfers = transfers.filter(t => t.status === 'completed').slice(0, 10);
  const selectedProduct = products.find(p => p.id === form.productId);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.productId) e.productId = 'Select a product';
    if (!form.fromLocationId) e.fromLocationId = 'Select source location';
    if (!form.toLocationId) e.toLocationId = 'Select destination';
    if (form.fromLocationId === form.toLocationId && form.fromLocationId !== '') e.toLocationId = 'Destination must differ from source';
    if (!form.quantity || Number(form.quantity) <= 0) e.quantity = 'Valid quantity required';
    if (selectedProduct && Number(form.quantity) > selectedProduct.quantity) {
      e.quantity = `Insufficient stock. Available: ${selectedProduct.quantity}`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    createTransfer({
      productId: form.productId,
      fromLocationId: form.fromLocationId,
      toLocationId: form.toLocationId,
      quantity: Number(form.quantity),
      userId: currentUser?.id || 'unknown',
      notes: form.notes || undefined,
    });
    setLoading(false);
    setSuccess(true);
    setForm({ productId: '', fromLocationId: '', toLocationId: '', quantity: '', notes: '' });
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleComplete = (id: string) => {
    completeTransfer(id);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transfer Form */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Truck size={22} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white">New Transfer</h2>
                <p className="text-blue-100 text-xs">Move stock between locations</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <Check size={16} className="text-green-600 dark:text-green-400" />
                <p className="text-green-700 dark:text-green-300 text-sm font-medium">Transfer initiated! Truck is on the way 🚛</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Product <span className="text-red-500">*</span></label>
              <select value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}
                className={`w-full px-3 py-2.5 border rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.productId ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}>
                <option value="">Select product...</option>
                {products.filter(p => p.quantity > 0).map(p => <option key={p.id} value={p.id}>{p.name} (Qty: {p.quantity})</option>)}
              </select>
              {errors.productId && <p className="text-xs text-red-500 mt-0.5">{errors.productId}</p>}
            </div>

            {selectedProduct && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">{selectedProduct.name}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">Available: {selectedProduct.quantity} units</p>
              </div>
            )}

            {/* Location Arrow */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">From Location <span className="text-red-500">*</span></label>
                <select value={form.fromLocationId} onChange={e => setForm(f => ({ ...f, fromLocationId: e.target.value }))}
                  className={`w-full px-3 py-2.5 border rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.fromLocationId ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}>
                  <option value="">From...</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="shrink-0 mt-5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <ArrowRight size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">To Location <span className="text-red-500">*</span></label>
                <select value={form.toLocationId} onChange={e => setForm(f => ({ ...f, toLocationId: e.target.value }))}
                  className={`w-full px-3 py-2.5 border rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.toLocationId ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}>
                  <option value="">To...</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </div>
            {errors.fromLocationId && <p className="text-xs text-red-500 -mt-2">{errors.fromLocationId}</p>}
            {errors.toLocationId && <p className="text-xs text-red-500 -mt-2">{errors.toLocationId}</p>}

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Quantity <span className="text-red-500">*</span></label>
              <input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                placeholder="0"
                className={`w-full px-3 py-2.5 border rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.quantity ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`} />
              {errors.quantity && <p className="text-xs text-red-500 mt-0.5">{errors.quantity}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} placeholder="Transfer notes..."
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Truck size={16} />}
              Initiate Transfer
            </button>
          </form>
        </div>

        {/* Active Transfers */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <Truck size={18} className="text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Active Transfers</h3>
              {activeTransfers.length > 0 && (
                <span className="ml-auto text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">{activeTransfers.length}</span>
              )}
            </div>

            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {activeTransfers.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Truck size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No active transfers</p>
                </div>
              ) : activeTransfers.map(t => {
                const product = products.find(p => p.id === t.productId);
                const fromLoc = locations.find(l => l.id === t.fromLocationId);
                const toLoc = locations.find(l => l.id === t.toLocationId);
                return (
                  <div key={t.id} className="p-4">
                    {/* Truck Animation */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{fromLoc?.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{toLoc?.name}</span>
                          <MapPin size={12} className="text-blue-500" />
                        </div>
                      </div>
                      {/* Truck Track */}
                      <div className="relative h-10 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
                        <div className="absolute inset-0 flex items-center px-2">
                          <div className="flex-1 border-t-2 border-dashed border-gray-300 dark:border-gray-600" />
                        </div>
                        {/* Animated truck */}
                        <div className="absolute inset-y-0 flex items-center" style={{ animation: 'truckMove 3s linear infinite', left: '10%' }}>
                          <div className="w-8 h-7 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                            <Truck size={14} className="text-white" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{product?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t.quantity} units • {formatDateTime(t.timestamp)}</p>

                    <button
                      onClick={() => handleComplete(t.id)}
                      className="w-full py-2 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={14} />
                      Mark as Received ✓
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Completed Transfers */}
          {completedTransfers.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  Completed Transfers
                </h3>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-64 overflow-y-auto">
                {completedTransfers.map(t => {
                  const product = products.find(p => p.id === t.productId);
                  const fromLoc = locations.find(l => l.id === t.fromLocationId);
                  const toLoc = locations.find(l => l.id === t.toLocationId);
                  return (
                    <div key={t.id} className="p-3 flex items-center gap-3">
                      <CheckCircle size={16} className="text-green-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{product?.name}</p>
                        <p className="text-xs text-gray-400">{fromLoc?.name} → {toLoc?.name} • {t.quantity} units</p>
                      </div>
                      <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">Done</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSS for truck animation */}
      <style>{`
        @keyframes truckMove {
          0% { left: 5%; }
          100% { left: 80%; }
        }
      `}</style>
    </div>
  );
}
