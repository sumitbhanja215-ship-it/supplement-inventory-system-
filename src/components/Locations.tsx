import { useState } from 'react';
import { useStore } from '../store/useStore';
import { MapPin, Plus, Edit2, Trash2, Check, X, Package } from 'lucide-react';
import { formatDate } from '../utils/helpers';

export default function Locations() {
  const { locations, products, addLocation, renameLocation, deleteLocation, currentUser } = useStore();
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const handleAdd = () => {
    if (newName.trim()) {
      addLocation(newName.trim());
      setNewName('');
    }
  };

  const handleRename = (id: string) => {
    if (editName.trim()) {
      renameLocation(id, editName.trim());
      setEditId(null);
    }
  };

  const handleDelete = (id: string, name: string) => {
    const hasProducts = products.some(p => p.locationId === id);
    if (hasProducts) {
      alert(`Cannot delete "${name}" - it has products assigned to it. Please move products first.`);
      return;
    }
    if (confirm(`Delete location "${name}"?`)) {
      deleteLocation(id);
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Add Location */}
      {isSuperAdmin && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4 flex items-center gap-2">
            <Plus size={16} className="text-blue-600 dark:text-blue-400" />
            Add New Location
          </h3>
          <div className="flex gap-3">
            <input
              value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Location name (e.g., Kolkata Central)"
              className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={handleAdd} disabled={!newName.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all shadow-md shadow-blue-500/30 flex items-center gap-2">
              <Plus size={16} />
              Add
            </button>
          </div>
        </div>
      )}

      {/* Location Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((loc, index) => {
          const locProducts = products.filter(p => p.locationId === loc.id);
          const totalValue = locProducts.reduce((s, p) => s + p.purchasePrice * p.quantity, 0);
          const lowStock = locProducts.filter(p => p.quantity <= p.minimumStockLevel).length;
          const isEditing = editId === loc.id;

          const gradients = [
            'from-blue-600 to-blue-500',
            'from-purple-600 to-purple-500',
            'from-emerald-600 to-emerald-500',
            'from-orange-600 to-orange-500',
            'from-pink-600 to-pink-500',
          ];

          return (
            <div key={loc.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              {/* Card Header */}
              <div className={`bg-gradient-to-r ${gradients[index % gradients.length]} p-5`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <MapPin size={20} className="text-white" />
                    </div>
                    <div>
                      {isEditing ? (
                        <input
                          value={editName} onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleRename(loc.id)}
                          className="bg-white/20 text-white placeholder-white/70 border border-white/30 rounded-lg px-3 py-1 text-sm focus:outline-none focus:bg-white/30"
                          autoFocus
                        />
                      ) : (
                        <h3 className="font-bold text-white">{loc.name}</h3>
                      )}
                      <p className="text-white/70 text-xs mt-0.5">Added {formatDate(loc.createdAt)}</p>
                    </div>
                  </div>

                  {isSuperAdmin && (
                    <div className="flex gap-1">
                      {isEditing ? (
                        <>
                          <button onClick={() => handleRename(loc.id)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-all">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setEditId(null)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-all">
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditId(loc.id); setEditName(loc.name); }} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-all">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(loc.id, loc.name)} className="p-1.5 bg-red-500/30 hover:bg-red-500/50 rounded-lg text-white transition-all">
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Stats */}
              <div className="p-4 grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Products</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{locProducts.length}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Total Units</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {locProducts.reduce((s, p) => s + p.quantity, 0)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Inv. Value</p>
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    ₹{(totalValue / 1000).toFixed(1)}k
                  </p>
                </div>
                <div className={`rounded-xl p-3 ${lowStock > 0 ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
                  <p className="text-xs text-gray-400 mb-1">Low Stock</p>
                  <p className={`text-xl font-bold ${lowStock > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                    {lowStock}
                  </p>
                </div>
              </div>

              {/* Product List Preview */}
              {locProducts.length > 0 && (
                <div className="px-4 pb-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Products at this location:</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {locProducts.slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center gap-2 text-xs">
                        <Package size={10} className="text-gray-400 shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400 flex-1 truncate">{p.name}</span>
                        <span className="font-semibold text-gray-900 dark:text-white shrink-0">{p.quantity}</span>
                      </div>
                    ))}
                    {locProducts.length > 5 && (
                      <p className="text-xs text-blue-600 dark:text-blue-400">+{locProducts.length - 5} more products</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {locations.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <MapPin size={40} className="mx-auto mb-2 opacity-30" />
          <p>No locations yet. Add your first location above.</p>
        </div>
      )}
    </div>
  );
}
