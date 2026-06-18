import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Clock, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { formatDate, formatCurrency, getDaysUntilExpiry } from '../utils/helpers';

export default function Expiry() {
  const { products, categories, brands, locations } = useStore();

  const grouped = useMemo(() => {
    const expired: typeof products = [];
    const within30: typeof products = [];
    const within60: typeof products = [];
    const within90: typeof products = [];
    const safe: typeof products = [];

    products.forEach(p => {
      const days = getDaysUntilExpiry(p.expiryDate);
      if (days < 0) expired.push(p);
      else if (days <= 30) within30.push(p);
      else if (days <= 60) within60.push(p);
      else if (days <= 90) within90.push(p);
      else safe.push(p);
    });

    return { expired, within30, within60, within90, safe };
  }, [products]);

  const ProductCard = ({ product, colorClass }: { product: typeof products[0]; colorClass: string }) => {
    const days = getDaysUntilExpiry(product.expiryDate);
    const brand = brands.find(b => b.id === product.brandId)?.name;
    const category = categories.find(c => c.id === product.categoryId)?.name;
    const location = locations.find(l => l.id === product.locationId)?.name;

    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
            <Package size={16} className="text-gray-500 dark:text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{product.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{brand} • {category}</p>
            <p className="text-xs text-gray-400">📍 {location}</p>
          </div>
          <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}>
            {days < 0 ? 'Expired' : `${days}d`}
          </span>
        </div>
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50 dark:border-gray-800 text-xs">
          <div>
            <p className="text-gray-400">Expiry</p>
            <p className="font-semibold text-gray-700 dark:text-gray-300">{formatDate(product.expiryDate)}</p>
          </div>
          <div>
            <p className="text-gray-400">Qty</p>
            <p className="font-semibold text-gray-700 dark:text-gray-300">{product.quantity}</p>
          </div>
          <div>
            <p className="text-gray-400">Value</p>
            <p className="font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(product.purchasePrice * product.quantity)}</p>
          </div>
          <div>
            <p className="text-gray-400">Batch</p>
            <p className="font-semibold text-gray-700 dark:text-gray-300">{product.batchNumber}</p>
          </div>
        </div>
      </div>
    );
  };

  const Section = ({ title, items, color, icon, emptyMsg }: {
    title: string; items: typeof products; color: string; icon: React.ReactNode; emptyMsg: string;
  }) => (
    <div className="bg-gray-50 dark:bg-gray-950 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
        <span className={`ml-auto text-xs px-2.5 py-0.5 rounded-full font-semibold ${color}`}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <CheckCircle size={28} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">{emptyMsg}</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {items.map(p => (
            <ProductCard key={p.id} product={p}
              colorClass={p.expiryDate && getDaysUntilExpiry(p.expiryDate) < 0
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : color}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Expired', count: grouped.expired.length, color: 'bg-red-600', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
          { label: 'In 30 Days', count: grouped.within30.length, color: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
          { label: 'In 60 Days', count: grouped.within60.length, color: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
          { label: 'In 90 Days', count: grouped.within90.length, color: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Safe', count: grouped.safe.length, color: 'bg-green-500', text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
        ].map(item => (
          <div key={item.label} className={`${item.bg} rounded-2xl p-4 border border-transparent`}>
            <div className={`w-3 h-3 rounded-full ${item.color} mb-2`} />
            <p className={`text-2xl font-bold ${item.text}`}>{item.count}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Expired */}
      <Section
        title="🔴 Expired Products"
        items={grouped.expired}
        color="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
        icon={<AlertTriangle size={18} className="text-red-600 dark:text-red-400" />}
        emptyMsg="No expired products ✅"
      />

      {/* Within 30 Days */}
      <Section
        title="🟠 Expiring in 30 Days"
        items={grouped.within30}
        color="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
        icon={<Clock size={18} className="text-orange-500" />}
        emptyMsg="No products expiring in 30 days"
      />

      {/* Within 60 Days */}
      <Section
        title="🟡 Expiring in 60 Days"
        items={grouped.within60}
        color="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
        icon={<Clock size={18} className="text-yellow-500" />}
        emptyMsg="No products expiring in 60 days"
      />

      {/* Within 90 Days */}
      <Section
        title="🔵 Expiring in 90 Days"
        items={grouped.within90}
        color="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
        icon={<Clock size={18} className="text-blue-500" />}
        emptyMsg="No products expiring in 90 days"
      />

      {/* Safe */}
      <Section
        title="🟢 Safe Products"
        items={grouped.safe}
        color="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
        icon={<CheckCircle size={18} className="text-green-500" />}
        emptyMsg="No safe products"
      />
    </div>
  );
}
