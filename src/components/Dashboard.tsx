import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import {
  Package, AlertTriangle, Clock,
  ArrowUpCircle, ArrowDownCircle, DollarSign, Activity, MapPin
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { formatCurrency, formatDateTime, getExpiryStatus, getDaysUntilExpiry } from '../utils/helpers';
import { format, subDays, parseISO, isSameDay } from 'date-fns';

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#9333ea', '#0891b2', '#be185d', '#65a30d'];

export default function Dashboard() {
  const { products, stockMovements, locations, categories, logs, transfers } = useStore();

  const stats = useMemo(() => {
    const totalValue = products.reduce((sum, p) => sum + p.purchasePrice * p.quantity, 0);
    const totalProducts = products.length;
    const lowStock = products.filter(p => p.quantity <= p.minimumStockLevel);
    const expiring30 = products.filter(p => {
      const status = getExpiryStatus(p.expiryDate);
      return status === 'critical' || status === 'expired';
    });

    const today = new Date();
    const todayMovements = stockMovements.filter(m => isSameDay(parseISO(m.timestamp), today));
    const todayIn = todayMovements.filter(m => m.type === 'stock_in').reduce((s, m) => s + m.quantity, 0);
    const todayOut = todayMovements.filter(m => m.type === 'stock_out').reduce((s, m) => s + m.quantity, 0);

    return { totalValue, totalProducts, lowStock, expiring30, todayIn, todayOut };
  }, [products, stockMovements]);

  // Last 7 days stock movement chart
  const movementChart = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayMovements = stockMovements.filter(m => isSameDay(parseISO(m.timestamp), date));
      return {
        date: format(date, 'dd MMM'),
        In: dayMovements.filter(m => m.type === 'stock_in').reduce((s, m) => s + m.quantity, 0),
        Out: dayMovements.filter(m => m.type === 'stock_out').reduce((s, m) => s + m.quantity, 0),
      };
    });
  }, [stockMovements]);

  // Category distribution
  const categoryChart = useMemo(() => {
    const catMap: Record<string, number> = {};
    products.forEach(p => {
      const cat = categories.find(c => c.id === p.categoryId)?.name || 'Other';
      catMap[cat] = (catMap[cat] || 0) + p.quantity;
    });
    return Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [products, categories]);

  // Location stock value
  const locationChart = useMemo(() => {
    return locations.map(loc => {
      const locProducts = products.filter(p => p.locationId === loc.id);
      const value = locProducts.reduce((s, p) => s + p.purchasePrice * p.quantity, 0);
      const qty = locProducts.reduce((s, p) => s + p.quantity, 0);
      return { name: loc.name.split(' ')[0], value: Math.round(value), qty };
    });
  }, [products, locations]);

  const inTransitTransfers = transfers.filter(t => t.status === 'in_transit');
  const expiringProducts = products.filter(p => {
    const days = getDaysUntilExpiry(p.expiryDate);
    return days >= 0 && days <= 30;
  });
  const expiredProducts = products.filter(p => getDaysUntilExpiry(p.expiryDate) < 0);

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Welcome back! 👋</h2>
            <p className="text-blue-100 text-sm mt-1">Here's your store overview for today</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-blue-200 text-sm">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
            <p className="text-white font-semibold">{locations.length} Active Locations</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Inventory Value"
          value={formatCurrency(stats.totalValue)}
          icon={<DollarSign size={22} />}
          color="blue"
          subtitle={`${stats.totalProducts} products`}
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts.toString()}
          icon={<Package size={22} />}
          color="purple"
          subtitle={`${categories.length} categories`}
        />
        <StatCard
          title="Low Stock Alerts"
          value={stats.lowStock.length.toString()}
          icon={<AlertTriangle size={22} />}
          color="orange"
          subtitle="Below minimum level"
          alert={stats.lowStock.length > 0}
        />
        <StatCard
          title="Expiring in 30 Days"
          value={stats.expiring30.length.toString()}
          icon={<Clock size={22} />}
          color="red"
          subtitle={`${expiredProducts.length} already expired`}
          alert={stats.expiring30.length > 0}
        />
      </div>

      {/* Today's Movement */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 col-span-1 lg:col-span-2">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 font-medium">Today's Stock Movement</p>
          <div className="flex gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <ArrowDownCircle size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.todayIn}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Units In</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <ArrowUpCircle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.todayOut}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Units Out</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 font-medium">In Transit</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{inTransitTransfers.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Active transfers</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 font-medium">Expired Products</p>
          <p className={`text-3xl font-bold ${expiredProducts.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {expiredProducts.length}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Need attention</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stock Movement Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} className="text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Stock Movement (Last 7 Days)</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={movementChart} barSize={16}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', fontSize: '12px' }} />
              <Bar dataKey="In" fill="#22c55e" radius={[4, 4, 0, 0]} name="Stock In" />
              <Bar dataKey="Out" fill="#ef4444" radius={[4, 4, 0, 0]} name="Stock Out" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Package size={18} className="text-purple-600 dark:text-purple-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Category Distribution</h3>
          </div>
          {categoryChart.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={categoryChart} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                    {categoryChart.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {categoryChart.map((cat, i) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1">{cat.name}</span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">{cat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-400 py-10 text-sm">No products yet</p>
          )}
        </div>
      </div>

      {/* Location Stock Value Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={18} className="text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Store-wise Inventory Value</h3>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={locationChart} barSize={40}>
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', fontSize: '12px' }}
              formatter={(v: unknown) => [`₹${(v as number).toLocaleString('en-IN')}`, 'Inventory Value']}
            />
            <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} name="Value (₹)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-gray-100 dark:border-gray-800">
            <AlertTriangle size={18} className="text-orange-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Low Stock Alerts</h3>
            <span className="ml-auto text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">{stats.lowStock.length}</span>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-64 overflow-y-auto">
            {stats.lowStock.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">✅ All products are well stocked</p>
            ) : stats.lowStock.map(p => {
              const loc = locations.find(l => l.id === p.locationId);
              return (
                <div key={p.id} className="flex items-center gap-3 p-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                    <Package size={14} className="text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{loc?.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-orange-600 dark:text-orange-400">{p.quantity}</p>
                    <p className="text-xs text-gray-400">Min: {p.minimumStockLevel}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-gray-100 dark:border-gray-800">
            <Activity size={18} className="text-blue-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">No activity yet</p>
            ) : logs.slice(0, 8).map(log => (
              <div key={log.id} className="flex items-start gap-3 p-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-700 dark:text-gray-300 truncate">{log.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{log.userName} • {formatDateTime(log.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expiring Products */}
      {expiringProducts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={18} className="text-amber-600 dark:text-amber-400" />
            <h3 className="font-semibold text-amber-800 dark:text-amber-200 text-sm">Products Expiring in 30 Days</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {expiringProducts.map(p => {
              const days = getDaysUntilExpiry(p.expiryDate);
              return (
                <div key={p.id} className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-amber-100 dark:border-amber-900/30">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold">Expires in {days} days</p>
                  <p className="text-xs text-gray-400">{p.quantity} units remaining</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'orange' | 'red' | 'green';
  subtitle?: string;
  alert?: boolean;
}

function StatCard({ title, value, icon, color, subtitle, alert }: StatCardProps) {
  const colorMap = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl p-4 border ${alert ? 'border-orange-200 dark:border-orange-800' : 'border-gray-100 dark:border-gray-800'} relative overflow-hidden`}>
      {alert && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />}
      <div className={`w-10 h-10 rounded-xl ${colorMap[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-0.5">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}
