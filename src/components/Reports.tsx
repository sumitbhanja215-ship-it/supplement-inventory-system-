import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { BarChart2, Download, Calendar, TrendingUp, Package, DollarSign, MapPin } from 'lucide-react';
import { formatCurrency, formatDate, getDaysUntilExpiry } from '../utils/helpers';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, subDays, startOfWeek, startOfMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type ReportType = 'stock' | 'movement' | 'expiry' | 'value' | 'supplier' | 'store' | 'category' | 'brand' | 'profit';
type DateRange = 'today' | 'week' | 'month' | 'custom';

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#9333ea', '#0891b2', '#be185d', '#65a30d'];

export default function Reports() {
  const { products, stockMovements, locations, categories, brands, suppliers } = useStore();
  const [reportType, setReportType] = useState<ReportType>('stock');
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const dateFilter = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case 'today': return { start: startOfDay(now), end: endOfDay(now) };
      case 'week': return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfDay(now) };
      case 'month': return { start: startOfMonth(now), end: endOfDay(now) };
      case 'custom': return customStart && customEnd
        ? { start: startOfDay(parseISO(customStart)), end: endOfDay(parseISO(customEnd)) }
        : { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
      default: return { start: startOfMonth(now), end: endOfDay(now) };
    }
  }, [dateRange, customStart, customEnd]);

  const filteredMovements = useMemo(() => {
    return stockMovements.filter(m => {
      const date = parseISO(m.timestamp);
      return isWithinInterval(date, dateFilter);
    });
  }, [stockMovements, dateFilter]);

  // Report data generators
  const stockReportData = useMemo(() => {
    return products.map(p => ({
      name: p.name,
      brand: brands.find(b => b.id === p.brandId)?.name || '-',
      category: categories.find(c => c.id === p.categoryId)?.name || '-',
      location: locations.find(l => l.id === p.locationId)?.name || '-',
      quantity: p.quantity,
      minLevel: p.minimumStockLevel,
      value: p.purchasePrice * p.quantity,
      sellingValue: p.sellingPrice * p.quantity,
    }));
  }, [products, brands, categories, locations]);

  const movementReportData = useMemo(() => {
    return filteredMovements.map(m => ({
      date: formatDate(m.timestamp),
      product: products.find(p => p.id === m.productId)?.name || 'Unknown',
      type: m.type,
      quantity: m.quantity,
      location: locations.find(l => l.id === m.locationId)?.name || '-',
      reason: m.reason || '-',
    }));
  }, [filteredMovements, products, locations]);

  const categoryChartData = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach(p => {
      const cat = categories.find(c => c.id === p.categoryId)?.name || 'Other';
      map[cat] = (map[cat] || 0) + p.quantity;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [products, categories]);

  const locationChartData = useMemo(() => {
    return locations.map(loc => {
      const prods = products.filter(p => p.locationId === loc.id);
      return {
        name: loc.name.split(' ')[0],
        products: prods.length,
        value: prods.reduce((s, p) => s + p.purchasePrice * p.quantity, 0),
        qty: prods.reduce((s, p) => s + p.quantity, 0),
      };
    });
  }, [products, locations]);

  const profitData = useMemo(() => {
    return products.map(p => ({
      name: p.name,
      cost: p.purchasePrice,
      selling: p.sellingPrice,
      margin: p.sellingPrice - p.purchasePrice,
      marginPct: ((p.sellingPrice - p.purchasePrice) / p.purchasePrice * 100).toFixed(1),
      quantity: p.quantity,
      potentialProfit: (p.sellingPrice - p.purchasePrice) * p.quantity,
    }));
  }, [products]);

  const expiryReportData = useMemo(() => {
    return products.map(p => {
      const days = getDaysUntilExpiry(p.expiryDate);
      return {
        name: p.name,
        batch: p.batchNumber,
        expiry: formatDate(p.expiryDate),
        daysLeft: days,
        status: days < 0 ? 'Expired' : days <= 30 ? 'Critical' : days <= 60 ? 'Warning' : days <= 90 ? 'Soon' : 'Safe',
        quantity: p.quantity,
        value: p.purchasePrice * p.quantity,
      };
    }).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [products]);

  const supplierReportData = useMemo(() => {
    const map: Record<string, { name: string; products: number; totalValue: number; totalQty: number }> = {};
    products.forEach(p => {
      const sup = suppliers.find(s => s.id === p.supplierId);
      const name = sup?.name || p.supplierContact || 'Unknown';
      if (!map[name]) map[name] = { name, products: 0, totalValue: 0, totalQty: 0 };
      map[name].products++;
      map[name].totalValue += p.purchasePrice * p.quantity;
      map[name].totalQty += p.quantity;
    });
    return Object.values(map);
  }, [products, suppliers]);

  const exportCSV = () => {
    let data: string[][] = [];
    let filename = '';

    if (reportType === 'stock') {
      filename = 'stock_report';
      data = [
        ['Product', 'Brand', 'Category', 'Location', 'Quantity', 'Min Level', 'Purchase Value', 'Selling Value'],
        ...stockReportData.map(r => [r.name, r.brand, r.category, r.location, r.quantity.toString(), r.minLevel.toString(), r.value.toString(), r.sellingValue.toString()])
      ];
    } else if (reportType === 'movement') {
      filename = 'movement_report';
      data = [
        ['Date', 'Product', 'Type', 'Quantity', 'Location', 'Reason'],
        ...movementReportData.map(r => [r.date, r.product, r.type, r.quantity.toString(), r.location, r.reason])
      ];
    } else if (reportType === 'expiry') {
      filename = 'expiry_report';
      data = [
        ['Product', 'Batch', 'Expiry Date', 'Days Left', 'Status', 'Quantity', 'Value'],
        ...expiryReportData.map(r => [r.name, r.batch, r.expiry, r.daysLeft.toString(), r.status, r.quantity.toString(), r.value.toString()])
      ];
    } else if (reportType === 'profit') {
      filename = 'profit_report';
      data = [
        ['Product', 'Purchase Price', 'Selling Price', 'Margin', 'Margin %', 'Quantity', 'Potential Profit'],
        ...profitData.map(r => [r.name, r.cost.toString(), r.selling.toString(), r.margin.toString(), r.marginPct, r.quantity.toString(), r.potentialProfit.toString()])
      ];
    } else if (reportType === 'supplier') {
      filename = 'supplier_report';
      data = [
        ['Supplier', 'Products', 'Total Qty', 'Total Value'],
        ...supplierReportData.map(r => [r.name, r.products.toString(), r.totalQty.toString(), r.totalValue.toString()])
      ];
    }

    if (data.length) {
      const csv = data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_${format(new Date(), 'yyyyMMdd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const totalInventoryValue = products.reduce((s, p) => s + p.purchasePrice * p.quantity, 0);
  const totalPotentialRevenue = products.reduce((s, p) => s + p.sellingPrice * p.quantity, 0);
  const totalStockIn = filteredMovements.filter(m => m.type === 'stock_in').reduce((s, m) => s + m.quantity, 0);
  const totalStockOut = filteredMovements.filter(m => m.type === 'stock_out').reduce((s, m) => s + m.quantity, 0);

  const REPORT_TYPES = [
    { id: 'stock', label: 'Stock Report', icon: Package },
    { id: 'movement', label: 'Movement', icon: TrendingUp },
    { id: 'expiry', label: 'Expiry Report', icon: Calendar },
    { id: 'value', label: 'Value Report', icon: DollarSign },
    { id: 'supplier', label: 'Supplier Report', icon: Package },
    { id: 'store', label: 'Store Report', icon: MapPin },
    { id: 'category', label: 'Category Report', icon: BarChart2 },
    { id: 'profit', label: 'Profit Estimate', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Report Type Selector */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
        <div className="flex flex-wrap gap-2">
          {REPORT_TYPES.map(r => (
            <button key={r.id} onClick={() => setReportType(r.id as ReportType)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${reportType === r.id ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range & Export */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2">
          {(['today', 'week', 'month', 'custom'] as DateRange[]).map(r => (
            <button key={r} onClick={() => setDateRange(r)}
              className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all ${dateRange === r ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'}`}>
              {r}
            </button>
          ))}
        </div>
        {dateRange === 'custom' && (
          <>
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <span className="text-gray-400 text-sm">to</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </>
        )}
        <button onClick={exportCSV} className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-all">
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Inventory Value</p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalInventoryValue)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Potential Revenue</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalPotentialRevenue)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Stock In (Period)</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{totalStockIn} units</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Stock Out (Period)</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{totalStockOut} units</p>
        </div>
      </div>

      {/* Charts */}
      {(reportType === 'category' || reportType === 'value') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">Category Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                  {categoryChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">Store Inventory Value</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={locationChartData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(Number(v)/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '11px' }} />
                <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} name="Value (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <BarChart2 size={18} className="text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
            {REPORT_TYPES.find(r => r.id === reportType)?.label} Data
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              {reportType === 'stock' && (
                <tr>
                  {['Product', 'Category', 'Location', 'Qty', 'Min Level', 'Purchase Value', 'Selling Value'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              )}
              {reportType === 'movement' && (
                <tr>
                  {['Date', 'Product', 'Type', 'Qty', 'Location', 'Reason'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              )}
              {reportType === 'expiry' && (
                <tr>
                  {['Product', 'Batch', 'Expiry', 'Days Left', 'Status', 'Qty', 'Value'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              )}
              {reportType === 'profit' && (
                <tr>
                  {['Product', 'Cost Price', 'Selling Price', 'Margin', 'Margin %', 'Qty', 'Potential Profit'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              )}
              {reportType === 'supplier' && (
                <tr>
                  {['Supplier', 'Products', 'Total Qty', 'Total Value'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              )}
              {reportType === 'store' && (
                <tr>
                  {['Store', 'Products', 'Total Qty', 'Inventory Value'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {reportType === 'stock' && stockReportData.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">{r.name}</td>
                  <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{r.category}</td>
                  <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{r.location}</td>
                  <td className="px-4 py-2.5 font-semibold text-gray-900 dark:text-white">{r.quantity}</td>
                  <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{r.minLevel}</td>
                  <td className="px-4 py-2.5 text-gray-900 dark:text-white">{formatCurrency(r.value)}</td>
                  <td className="px-4 py-2.5 text-green-600 dark:text-green-400 font-semibold">{formatCurrency(r.sellingValue)}</td>
                </tr>
              ))}
              {reportType === 'movement' && movementReportData.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400 whitespace-nowrap">{r.date}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">{r.product}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.type === 'stock_in' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                      {r.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-gray-900 dark:text-white">{r.quantity}</td>
                  <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{r.location}</td>
                  <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{r.reason}</td>
                </tr>
              ))}
              {reportType === 'expiry' && expiryReportData.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">{r.name}</td>
                  <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{r.batch}</td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{r.expiry}</td>
                  <td className="px-4 py-2.5 font-semibold">{r.daysLeft < 0 ? <span className="text-red-600">Expired</span> : <span>{r.daysLeft}d</span>}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.status === 'Expired' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                      r.status === 'Critical' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' :
                      r.status === 'Warning' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                      r.status === 'Soon' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                      'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    }`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{r.quantity}</td>
                  <td className="px-4 py-2.5 text-gray-900 dark:text-white">{formatCurrency(r.value)}</td>
                </tr>
              ))}
              {reportType === 'profit' && profitData.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">{r.name}</td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{formatCurrency(r.cost)}</td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{formatCurrency(r.selling)}</td>
                  <td className="px-4 py-2.5 font-semibold text-green-600 dark:text-green-400">{formatCurrency(r.margin)}</td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{r.marginPct}%</td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{r.quantity}</td>
                  <td className="px-4 py-2.5 font-bold text-blue-600 dark:text-blue-400">{formatCurrency(r.potentialProfit)}</td>
                </tr>
              ))}
              {reportType === 'supplier' && supplierReportData.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">{r.name}</td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{r.products}</td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{r.totalQty}</td>
                  <td className="px-4 py-2.5 text-gray-900 dark:text-white font-semibold">{formatCurrency(r.totalValue)}</td>
                </tr>
              ))}
              {reportType === 'store' && locationChartData.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">{r.name}</td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{r.products}</td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{r.qty}</td>
                  <td className="px-4 py-2.5 text-gray-900 dark:text-white font-semibold">{formatCurrency(r.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {((reportType === 'movement' && movementReportData.length === 0) || (reportType === 'stock' && stockReportData.length === 0)) && (
            <div className="text-center py-8 text-gray-400 text-sm">No data available for selected period</div>
          )}
        </div>
      </div>
    </div>
  );
}
