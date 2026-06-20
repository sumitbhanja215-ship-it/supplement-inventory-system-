import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Settings, Moon, Sun, Store, Tag, Package, Trash2, Plus, Check, Download, Upload } from 'lucide-react';

export default function SettingsPage() {
  const {
    settings, updateSettings, setTheme,
    categories, brands, suppliers,
    addCategory, deleteCategory,
    addBrand, deleteBrand,
    addSupplier,
    products, stockMovements, logs, posSales,
    currentUser,
  } = useStore();

  const [storeName, setStoreName] = useState(settings.storeName);
  const [saved, setSaved] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newSupName, setNewSupName] = useState('');
  const [newSupContact, setNewSupContact] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'categories' | 'brands' | 'suppliers' | 'backup'>('general');

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isAdmin = currentUser?.role === 'admin';
  const canManageBackup = isSuperAdmin || isAdmin;

  const handleSave = () => {
    updateSettings({ storeName });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportBackup = () => {
    const data = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      products,
      stockMovements,
      logs,
      posSales,
      settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `koushik_store_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'brands', label: 'Brands', icon: Package },
    { id: 'suppliers', label: 'Suppliers', icon: Store },
    ...(canManageBackup ? [{ id: 'backup', label: 'Backup', icon: Download }] : []),
  ] as const;

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}>
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Store size={18} className="text-blue-600 dark:text-blue-400" />
              Store Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Store Name</label>
                <input value={storeName} onChange={e => setStoreName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Currency</label>
                <select value={settings.currency} onChange={e => updateSettings({ currency: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="₹">₹ Indian Rupee (INR)</option>
                  <option value="$">$ US Dollar (USD)</option>
                  <option value="€">€ Euro (EUR)</option>
                </select>
              </div>
              <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/30">
                {saved ? <><Check size={16} /> Saved!</> : 'Save Changes'}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              {settings.theme === 'dark' ? <Moon size={18} className="text-blue-400" /> : <Sun size={18} className="text-yellow-500" />}
              Appearance
            </h3>
            <div className="flex gap-3">
              <button onClick={() => setTheme('light')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all ${settings.theme === 'light' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <Sun size={18} />
                Light Mode
              </button>
              <button onClick={() => setTheme('dark')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all ${settings.theme === 'dark' ? 'border-blue-500 bg-blue-900/20 text-blue-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <Moon size={18} />
                Dark Mode
              </button>
            </div>
          </div>

          {/* App Info */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
              </div>
              <div>
                <h3 className="font-bold text-lg">KOUSHIK'S</h3>
                <p className="text-blue-200 font-medium">THE SUPPLEMENT STORE</p>
                <p className="text-blue-300 text-xs mt-1">Seamless Inventory Tracking for Modern Supplement Businesses</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-xl font-bold">{products.length}</p>
                <p className="text-xs text-blue-200">Products</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-xl font-bold">{stockMovements.length}</p>
                <p className="text-xs text-blue-200">Movements</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-xl font-bold">{logs.length}</p>
                <p className="text-xs text-blue-200">Log Entries</p>
              </div>
            </div>
            <p className="text-blue-300 text-xs text-center mt-4">Version 1.0.0 | © 2024 KOUSHIK'S THE SUPPLEMENT STORE</p>
          </div>
        </div>
      )}

      {/* Categories */}
      {activeTab === 'categories' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Tag size={18} className="text-blue-600 dark:text-blue-400" />
              Product Categories ({categories.length})
            </h3>
            <div className="flex gap-2">
              <input value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && newCat.trim() && (addCategory(newCat.trim()), setNewCat(''))}
                placeholder="New category name..."
                className="flex-1 px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={() => { if (newCat.trim()) { addCategory(newCat.trim()); setNewCat(''); } }}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-96 overflow-y-auto">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{cat.name}</span>
                {cat.custom && <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">Custom</span>}
                {isSuperAdmin && cat.custom && (
                  <button onClick={() => deleteCategory(cat.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-all">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Brands */}
      {activeTab === 'brands' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Package size={18} className="text-blue-600 dark:text-blue-400" />
              Product Brands ({brands.length})
            </h3>
            <div className="flex gap-2">
              <input value={newBrand} onChange={e => setNewBrand(e.target.value)} onKeyDown={e => e.key === 'Enter' && newBrand.trim() && (addBrand(newBrand.trim()), setNewBrand(''))}
                placeholder="New brand name..."
                className="flex-1 px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={() => { if (newBrand.trim()) { addBrand(newBrand.trim()); setNewBrand(''); } }}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-96 overflow-y-auto">
            {brands.map(brand => (
              <div key={brand.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{brand.name}</span>
                {brand.custom && <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full">Custom</span>}
                {isSuperAdmin && brand.custom && (
                  <button onClick={() => deleteBrand(brand.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-all">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suppliers */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Plus size={18} className="text-blue-600 dark:text-blue-400" />
              Add Supplier
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={newSupName} onChange={e => setNewSupName(e.target.value)} placeholder="Supplier name"
                className="px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex gap-2">
                <input value={newSupContact} onChange={e => setNewSupContact(e.target.value)} placeholder="Contact number"
                  className="flex-1 px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={() => {
                  if (newSupName.trim() && newSupContact.trim()) {
                    addSupplier({ name: newSupName.trim(), contact: newSupContact.trim() });
                    setNewSupName(''); setNewSupContact('');
                  }
                }} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">All Suppliers ({suppliers.length})</h3>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {suppliers.map(sup => (
                <div key={sup.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm shrink-0">
                    {sup.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{sup.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{sup.contact}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Backup */}
      {activeTab === 'backup' && canManageBackup && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Download size={18} className="text-blue-600 dark:text-blue-400" />
              Export Backup
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Download all inventory data as a JSON backup file.</p>
            <button onClick={handleExportBackup} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all">
              <Download size={16} />
              Download Backup
            </button>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Upload size={16} className="text-amber-600 dark:text-amber-400" />
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Restore Backup</p>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-300">To restore a backup, upload the JSON file below. This will overwrite current data.</p>
            <input type="file" accept=".json" className="mt-3 text-xs text-gray-600 dark:text-gray-400 w-full" />
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Data Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Products', value: products.length },
                { label: 'Stock Movements', value: stockMovements.length },
                { label: 'Audit Logs', value: logs.length },
                { label: 'POS Sales', value: posSales.length },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
