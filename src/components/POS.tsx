import { useState } from 'react';
import { useStore } from '../store/useStore';
import { ShoppingCart, Plus, Minus, Trash2, Check, Receipt, Search, X } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../utils/helpers';
import type { POSSaleItem } from '../types';

export default function POS() {
  const { products, locations, currentUser, posSales, createPOSSale, brands } = useStore();
  const [locationId, setLocationId] = useState(locations[0]?.id || '');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<POSSaleItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const filteredProducts = products.filter(p => {
    if (!search) return true;
    const brand = brands.find(b => b.id === p.brandId)?.name || '';
    return p.name.toLowerCase().includes(search.toLowerCase()) ||
      brand.toLowerCase().includes(search.toLowerCase());
  }).filter(p => p.quantity > 0);

  const addToCart = (product: typeof products[0]) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) return prev;
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        sellingPrice: product.sellingPrice,
        gstPercentage: product.gstPercentage,
      }];
    });
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.productId !== productId));
    } else {
      const product = products.find(p => p.id === productId);
      if (product && qty > product.quantity) return;
      setCart(prev => prev.map(i => i.productId === productId ? { ...i, quantity: qty } : i));
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.productId !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const totalGST = cart.reduce((sum, item) => sum + (item.sellingPrice * item.gstPercentage / 100) * item.quantity, 0);
  const total = subtotal + totalGST;

  const handleCheckout = async () => {
    if (!cart.length || !locationId) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const saleData = {
      items: cart,
      totalAmount: total,
      paymentMethod: 'cash' as const,
      locationId,
      userId: currentUser?.id || 'unknown',
      customerName: customerName || undefined,
    };
    createPOSSale(saleData);
    setCart([]);
    setCustomerName('');
    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 5000);
  };

  const recentSales = [...posSales].reverse().slice(0, 5);

  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-purple-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3">
          <ShoppingCart size={24} />
          <div>
            <h2 className="font-bold text-lg">POS Billing</h2>
            <p className="text-purple-200 text-sm">Cash payments only</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-purple-200 text-xs">Location</p>
            <select value={locationId} onChange={e => setLocationId(e.target.value)}
              className="bg-white/20 text-white text-sm rounded-lg px-2 py-1 border border-white/30 focus:outline-none">
              {locations.map(l => <option key={l.id} value={l.id} className="text-gray-900">{l.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800">
          <Check size={20} className="text-green-600 dark:text-green-400" />
          <div>
            <p className="font-semibold text-green-700 dark:text-green-300">Sale Completed!</p>
            <p className="text-sm text-green-600 dark:text-green-400">Stock has been automatically updated.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Search */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={14} /></button>}
            </div>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-96 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No products found</div>
            ) : filteredProducts.map(p => {
              const inCart = cart.find(i => i.productId === p.id);
              const brand = brands.find(b => b.id === p.brandId)?.name;
              return (
                <div key={p.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{brand} • Stock: {p.quantity}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-purple-600 dark:text-purple-400">{formatCurrency(p.sellingPrice)}</p>
                    <p className="text-xs text-gray-400">+{p.gstPercentage}% GST</p>
                  </div>
                  <button
                    onClick={() => addToCart(p)}
                    disabled={inCart ? inCart.quantity >= p.quantity : false}
                    className="w-8 h-8 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white flex items-center justify-center transition-all shrink-0"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cart & Bill */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <ShoppingCart size={18} className="text-purple-600 dark:text-purple-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Cart</h3>
            {cart.length > 0 && <span className="ml-auto text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">{cart.length} items</span>}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800 max-h-72">
            {cart.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Add products to cart</p>
              </div>
            ) : cart.map(item => (
              <div key={item.productId} className="flex items-center gap-3 p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.productName}</p>
                  <p className="text-xs text-gray-400">{formatCurrency(item.sellingPrice)} each</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200">
                    <Minus size={12} />
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-gray-900 dark:text-white">{item.quantity}</span>
                  <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200">
                    <Plus size={12} />
                  </button>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(item.sellingPrice * item.quantity)}</p>
                </div>
                <button onClick={() => removeFromCart(item.productId)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {cart.length > 0 && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
              {/* Customer Name */}
              <input value={customerName} onChange={e => setCustomerName(e.target.value)}
                placeholder="Customer name (optional)"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />

              {/* Bill Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>GST</span>
                  <span>{formatCurrency(totalGST)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-1.5">
                  <span>Total</span>
                  <span className="text-purple-600 dark:text-purple-400 text-lg">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-xl p-2">
                <span className="text-lg">💵</span>
                <span>Payment Method: <strong>Cash</strong></span>
              </div>

              <button onClick={handleCheckout} disabled={loading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Receipt size={16} />}
                Complete Sale — {formatCurrency(total)}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Sales */}
      {recentSales.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
              <Receipt size={16} className="text-purple-600 dark:text-purple-400" />
              Recent Sales
            </h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {recentSales.map(sale => (
              <div key={sale.id} className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                  <Receipt size={16} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{sale.customerName || 'Walk-in Customer'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{sale.items.length} items • {formatDateTime(sale.timestamp)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-purple-600 dark:text-purple-400">{formatCurrency(sale.totalAmount)}</p>
                  <p className="text-xs text-gray-400">Cash</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
