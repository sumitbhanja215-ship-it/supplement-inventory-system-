import { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  Search, Plus, Edit2, Trash2, Filter, Package,
  ChevronDown, Eye, AlertTriangle
} from 'lucide-react';
import { formatCurrency, formatDate, getExpiryStatus, getExpiryColor } from '../utils/helpers';
import ProductModal from './ProductModal';
import type { Product } from '../types';

export default function Inventory() {
  const { products, categories, brands, locations, suppliers, currentUser, deleteProduct } = useStore();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterExpiry, setFilterExpiry] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const canDelete = currentUser?.role === 'super_admin' || currentUser?.role === 'store_manager';

  const filtered = products.filter(p => {
    const brand = brands.find(b => b.id === p.brandId)?.name || '';
    const category = categories.find(c => c.id === p.categoryId)?.name || '';
    const matchSearch = !search || [p.name, brand, category, p.batchNumber, p.supplierContact].some(
      v => v?.toLowerCase().includes(search.toLowerCase())
    );
    const matchCat = !filterCategory || p.categoryId === filterCategory;
    const matchBrand = !filterBrand || p.brandId === filterBrand;
    const matchLoc = !filterLocation || p.locationId === filterLocation;
    const matchExpiry = !filterExpiry || getExpiryStatus(p.expiryDate) === filterExpiry;
    return matchSearch && matchCat && matchBrand && matchLoc && matchExpiry;
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete "${name}"? This action cannot be undone.`)) {
      deleteProduct(id);
    }
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 relative min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products, batch, supplier..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <Filter size={16} /> Filters <ChevronDown size={14} className={showFilters ? 'rotate-180' : ''} />
        </button>
        <button
          onClick={() => { setEditProduct(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all shadow-md shadow-blue-500/30"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Brands</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Locations</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <select value={filterExpiry} onChange={e => setFilterExpiry(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Expiry Status</option>
            <option value="expired">Expired</option>
            <option value="critical">Expiring in 30 days</option>
            <option value="warning">Expiring in 60 days</option>
            <option value="soon">Expiring in 90 days</option>
            <option value="safe">Safe</option>
          </select>
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-3 flex-wrap text-sm">
        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
          Total: {filtered.length}
        </span>
        <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full">
          Low Stock: {filtered.filter(p => p.quantity <= p.minimumStockLevel).length}
        </span>
        <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
          Expired: {filtered.filter(p => getExpiryStatus(p.expiryDate) === 'expired').length}
        </span>
      </div>

      {/* Product Grid / Table */}
      <div className="hidden lg:block bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-400 font-semibold">Product</th>
              <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-400 font-semibold">Category / Brand</th>
              <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-400 font-semibold">Location</th>
              <th className="text-right px-4 py-3 text-gray-600 dark:text-gray-400 font-semibold">Qty</th>
              <th className="text-right px-4 py-3 text-gray-600 dark:text-gray-400 font-semibold">Price</th>
              <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-400 font-semibold">Expiry</th>
              <th className="text-center px-4 py-3 text-gray-600 dark:text-gray-400 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-gray-400 py-12">
                <Package size={40} className="mx-auto mb-2 opacity-30" />
                No products found
              </td></tr>
            ) : filtered.map(p => {
              const brand = brands.find(b => b.id === p.brandId)?.name || '-';
              const category = categories.find(c => c.id === p.categoryId)?.name || '-';
              const location = locations.find(l => l.id === p.locationId)?.name || '-';
              const expiryStatus = getExpiryStatus(p.expiryDate);
              const lowStock = p.quantity <= p.minimumStockLevel;
              return (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <Package size={16} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{p.name}</p>
                        <p className="text-xs text-gray-400">Batch: {p.batchNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700 dark:text-gray-300">{category}</p>
                    <p className="text-xs text-gray-400">{brand}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{location}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${lowStock ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>
                      {p.quantity}
                    </span>
                    {lowStock && <AlertTriangle size={12} className="inline ml-1 text-orange-500" />}
                    <p className="text-xs text-gray-400">Min: {p.minimumStockLevel}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(p.sellingPrice)}</p>
                    <p className="text-xs text-gray-400">Cost: {formatCurrency(p.purchasePrice)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getExpiryColor(expiryStatus)}`}>
                      {formatDate(p.expiryDate)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setViewProduct(p)} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-blue-500 transition-all">
                        <Eye size={15} />
                      </button>
                      <button onClick={() => { setEditProduct(p); setShowModal(true); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 transition-all">
                        <Edit2 size={15} />
                      </button>
                      {canDelete && (
                        <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-all">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package size={40} className="mx-auto mb-2 opacity-30" />
            No products found
          </div>
        ) : filtered.map(p => {
          const brand = brands.find(b => b.id === p.brandId)?.name || '-';
          const category = categories.find(c => c.id === p.categoryId)?.name || '-';
          const location = locations.find(l => l.id === p.locationId)?.name || '-';
          const expiryStatus = getExpiryStatus(p.expiryDate);
          const lowStock = p.quantity <= p.minimumStockLevel;
          return (
            <div key={p.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Package size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{p.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{brand} • {category}</p>
                  <p className="text-xs text-gray-400 mt-0.5">📍 {location}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditProduct(p); setShowModal(true); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500">
                    <Edit2 size={14} />
                  </button>
                  {canDelete && (
                    <button onClick={() => handleDelete(p.id, p.name)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-red-500">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                <div className="flex-1">
                  <p className="text-xs text-gray-400">Quantity</p>
                  <p className={`font-bold ${lowStock ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>
                    {p.quantity} {lowStock && '⚠️'}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400">Selling Price</p>
                  <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(p.sellingPrice)}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getExpiryColor(expiryStatus)}`}>
                  {formatDate(p.expiryDate)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Product Modal */}
      {showModal && (
        <ProductModal
          product={editProduct}
          onClose={() => { setShowModal(false); setEditProduct(null); }}
        />
      )}

      {/* View Modal */}
      {viewProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewProduct(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Package size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white text-lg">{viewProduct.name}</h2>
                <p className="text-sm text-gray-500">{brands.find(b => b.id === viewProduct.brandId)?.name}</p>
              </div>
              <button onClick={() => setViewProduct(null)} className="ml-auto p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Category', categories.find(c => c.id === viewProduct.categoryId)?.name],
                ['Location', locations.find(l => l.id === viewProduct.locationId)?.name],
                ['Batch #', viewProduct.batchNumber],
                ['Quantity', `${viewProduct.quantity} units`],
                ['Min Stock', `${viewProduct.minimumStockLevel} units`],
                ['Purchase Price', formatCurrency(viewProduct.purchasePrice)],
                ['Selling Price', formatCurrency(viewProduct.sellingPrice)],
                ['GST', `${viewProduct.gstPercentage}%`],
                ['Expiry Date', formatDate(viewProduct.expiryDate)],
                ['Mfg Date', formatDate(viewProduct.manufacturingDate)],
                ['Supplier', suppliers.find(s => s.id === viewProduct.supplierId)?.name || viewProduct.supplierId],
                ['Supplier Contact', viewProduct.supplierContact],
              ].map(([label, value]) => (
                <div key={label as string} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{value || '-'}</p>
                </div>
              ))}
            </div>
            {viewProduct.notes && (
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Notes</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{viewProduct.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
