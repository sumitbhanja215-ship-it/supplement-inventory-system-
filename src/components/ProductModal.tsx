import { useState } from 'react';
import { useStore } from '../store/useStore';
import { X, Plus, Package } from 'lucide-react';
import type { Product } from '../types';

interface Props {
  product?: Product | null;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: Props) {
  const { categories, brands, locations, suppliers, currentUser, addProduct, updateProduct, addCategory, addBrand, addSupplier } = useStore();

  const [form, setForm] = useState({
    name: product?.name || '',
    brandId: product?.brandId || '',
    categoryId: product?.categoryId || '',
    batchNumber: product?.batchNumber || '',
    expiryDate: product?.expiryDate || '',
    manufacturingDate: product?.manufacturingDate || '',
    purchasePrice: product?.purchasePrice?.toString() || '',
    sellingPrice: product?.sellingPrice?.toString() || '',
    gstPercentage: product?.gstPercentage?.toString() || '18',
    quantity: product?.quantity?.toString() || '',
    minimumStockLevel: product?.minimumStockLevel?.toString() || '10',
    supplierId: product?.supplierId || '',
    supplierContact: product?.supplierContact || '',
    locationId: product?.locationId || locations[0]?.id || '',
    notes: product?.notes || '',
  });

  const [newCategory, setNewCategory] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierContact, setNewSupplierContact] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Product name is required';
    if (!form.brandId) e.brandId = 'Brand is required';
    if (!form.categoryId) e.categoryId = 'Category is required';
    if (!form.batchNumber.trim()) e.batchNumber = 'Batch number is required';
    if (!form.expiryDate) e.expiryDate = 'Expiry date is required';
    if (!form.manufacturingDate) e.manufacturingDate = 'Manufacturing date is required';
    if (!form.purchasePrice || isNaN(Number(form.purchasePrice))) e.purchasePrice = 'Valid purchase price required';
    if (!form.sellingPrice || isNaN(Number(form.sellingPrice))) e.sellingPrice = 'Valid selling price required';
    if (!form.quantity || isNaN(Number(form.quantity))) e.quantity = 'Valid quantity required';
    if (!form.locationId) e.locationId = 'Location is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));

    const data = {
      ...form,
      purchasePrice: Number(form.purchasePrice),
      sellingPrice: Number(form.sellingPrice),
      gstPercentage: Number(form.gstPercentage),
      quantity: Number(form.quantity),
      minimumStockLevel: Number(form.minimumStockLevel),
      createdBy: currentUser?.id || 'unknown',
    };

    if (product) {
      updateProduct(product.id, data);
    } else {
      addProduct(data);
    }
    setLoading(false);
    onClose();
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      addCategory(newCategory.trim());
      setNewCategory('');
      setShowAddCat(false);
    }
  };

  const handleAddBrand = () => {
    if (newBrand.trim()) {
      addBrand(newBrand.trim());
      setNewBrand('');
      setShowAddBrand(false);
    }
  };

  const handleAddSupplier = () => {
    if (newSupplierName.trim() && newSupplierContact.trim()) {
      addSupplier({ name: newSupplierName.trim(), contact: newSupplierContact.trim() });
      setNewSupplierName('');
      setNewSupplierContact('');
      setShowAddSupplier(false);
    }
  };

  const InputField = ({ label, name, type = 'text', required = false, placeholder = '' }: {
    label: string; name: string; type?: string; required?: boolean; placeholder?: string;
  }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={form[name as keyof typeof form]}
        onChange={e => update(name, e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 border rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          errors[name] ? 'border-red-400 dark:border-red-600' : 'border-gray-200 dark:border-gray-700'
        }`}
      />
      {errors[name] && <p className="text-xs text-red-500 mt-0.5">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Package size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">{product ? 'Edit Product' : 'Add New Product'}</h2>
            <p className="text-xs text-gray-400">Fill in all product details</p>
          </div>
          <button onClick={onClose} className="ml-auto p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">1</span>
              Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputField label="Product Name" name="name" required placeholder="e.g. Whey Gold Standard" />
              <InputField label="Batch Number" name="batchNumber" required placeholder="e.g. WGS-2024-001" />
            </div>
          </div>

          {/* Category & Brand */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">2</span>
              Category & Brand
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Category <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <select value={form.categoryId} onChange={e => update('categoryId', e.target.value)}
                    className={`flex-1 px-3 py-2.5 border rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.categoryId ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}>
                    <option value="">Select category...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button type="button" onClick={() => setShowAddCat(!showAddCat)} className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100">
                    <Plus size={16} />
                  </button>
                </div>
                {errors.categoryId && <p className="text-xs text-red-500 mt-0.5">{errors.categoryId}</p>}
                {showAddCat && (
                  <div className="flex gap-2 mt-2">
                    <input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="New category name"
                      className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="button" onClick={handleAddCategory} className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium">Add</button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Brand <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <select value={form.brandId} onChange={e => update('brandId', e.target.value)}
                    className={`flex-1 px-3 py-2.5 border rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.brandId ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}>
                    <option value="">Select brand...</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <button type="button" onClick={() => setShowAddBrand(!showAddBrand)} className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100">
                    <Plus size={16} />
                  </button>
                </div>
                {errors.brandId && <p className="text-xs text-red-500 mt-0.5">{errors.brandId}</p>}
                {showAddBrand && (
                  <div className="flex gap-2 mt-2">
                    <input value={newBrand} onChange={e => setNewBrand(e.target.value)} placeholder="New brand name"
                      className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="button" onClick={handleAddBrand} className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium">Add</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">3</span>
              Dates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputField label="Manufacturing Date" name="manufacturingDate" type="date" required />
              <InputField label="Expiry Date" name="expiryDate" type="date" required />
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">4</span>
              Pricing & GST
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <InputField label="Purchase Price (₹)" name="purchasePrice" type="number" required placeholder="0.00" />
              <InputField label="Selling Price (₹)" name="sellingPrice" type="number" required placeholder="0.00" />
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">GST %</label>
                <select value={form.gstPercentage} onChange={e => update('gstPercentage', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stock */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">5</span>
              Stock & Location
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <InputField label="Quantity" name="quantity" type="number" required placeholder="0" />
              <InputField label="Minimum Stock Level" name="minimumStockLevel" type="number" placeholder="10" />
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Location <span className="text-red-500">*</span></label>
                <select value={form.locationId} onChange={e => update('locationId', e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.locationId ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}>
                  <option value="">Select location...</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Supplier */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">6</span>
              Supplier Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Supplier</label>
                <div className="flex gap-2">
                  <select value={form.supplierId} onChange={e => {
                    update('supplierId', e.target.value);
                    const sup = suppliers.find(s => s.id === e.target.value);
                    if (sup) update('supplierContact', sup.contact);
                  }}
                    className="flex-1 px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select supplier...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <button type="button" onClick={() => setShowAddSupplier(!showAddSupplier)} className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100">
                    <Plus size={16} />
                  </button>
                </div>
                {showAddSupplier && (
                  <div className="mt-2 space-y-2">
                    <input value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} placeholder="Supplier name"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" />
                    <div className="flex gap-2">
                      <input value={newSupplierContact} onChange={e => setNewSupplierContact(e.target.value)} placeholder="Contact number"
                        className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" />
                      <button type="button" onClick={handleAddSupplier} className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium">Add</button>
                    </div>
                  </div>
                )}
              </div>
              <InputField label="Supplier Contact" name="supplierContact" placeholder="+91 98765 43210" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Notes (Optional)</label>
            <textarea
              value={form.notes} onChange={e => update('notes', e.target.value)}
              rows={3} placeholder="Additional notes about the product..."
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              {product ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
