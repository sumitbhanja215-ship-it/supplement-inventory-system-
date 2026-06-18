import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Users as UsersIcon, Plus, Edit2, Trash2, Shield, X, Eye, EyeOff } from 'lucide-react';
import { formatDateTime, getRoleBadgeColor, getRoleLabel } from '../utils/helpers';
import type { UserRole } from '../types';

export default function Users() {
  const { users, locations, addUser, updateUser, deleteUser, currentUser } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<typeof users[0] | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', pin: '',
    role: 'staff' as UserRole, assignedLocation: '',
  });

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const openAdd = () => {
    setForm({ name: '', email: '', password: '', pin: '', role: 'staff', assignedLocation: '' });
    setEditUser(null);
    setShowModal(true);
  };

  const openEdit = (user: typeof users[0]) => {
    setForm({
      name: user.name, email: user.email, password: user.password,
      pin: user.pin || '', role: user.role, assignedLocation: user.assignedLocation || '',
    });
    setEditUser(user);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editUser) {
      updateUser(editUser.id, { ...form, pin: form.pin || undefined, assignedLocation: form.assignedLocation || undefined });
    } else {
      addUser({ ...form, pin: form.pin || undefined, assignedLocation: form.assignedLocation || undefined });
    }
    setShowModal(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (id === currentUser?.id) {
      alert("You cannot delete your own account.");
      return;
    }
    if (confirm(`Delete user "${name}"?`)) {
      deleteUser(id);
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{users.length} total users</p>
        </div>
        {isSuperAdmin && (
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all shadow-md shadow-blue-500/30">
            <Plus size={16} />
            Add User
          </button>
        )}
      </div>

      {/* Role Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { role: 'super_admin', label: 'Super Admins', color: 'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-300' },
          { role: 'store_manager', label: 'Store Managers', color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300' },
          { role: 'staff', label: 'Staff', color: 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-300' },
        ].map(r => (
          <div key={r.role} className={`${r.color} border rounded-2xl p-4`}>
            <p className={`text-2xl font-bold ${r.text}`}>{users.filter(u => u.role === r.role).length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{r.label}</p>
          </div>
        ))}
      </div>

      {/* User Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(user => (
          <div key={user.id} className={`bg-white dark:bg-gray-900 rounded-2xl border overflow-hidden ${user.id === currentUser?.id ? 'border-blue-300 dark:border-blue-700' : 'border-gray-100 dark:border-gray-800'}`}>
            {user.id === currentUser?.id && (
              <div className="bg-blue-600 text-white text-xs text-center py-1 font-medium">You</div>
            )}
            <div className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0 ${
                  user.role === 'super_admin' ? 'bg-gradient-to-br from-purple-500 to-purple-700' :
                  user.role === 'store_manager' ? 'bg-gradient-to-br from-blue-500 to-blue-700' :
                  'bg-gradient-to-br from-green-500 to-green-700'
                }`}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Role</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getRoleBadgeColor(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </div>
                {user.assignedLocation && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Location</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {locations.find(l => l.id === user.assignedLocation)?.name || user.assignedLocation}
                    </span>
                  </div>
                )}
                {user.pin && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">PIN Login</span>
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">✓ Enabled</span>
                  </div>
                )}
                {user.lastLogin && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Last Login</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(user.lastLogin)}</span>
                  </div>
                )}
              </div>

              {isSuperAdmin && (
                <div className="flex gap-2 pt-3 border-t border-gray-50 dark:border-gray-800">
                  <button onClick={() => openEdit(user)} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-medium transition-all">
                    <Edit2 size={13} />
                    Edit
                  </button>
                  {user.id !== currentUser?.id && (
                    <button onClick={() => handleDelete(user.id, user.name)} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-medium transition-all">
                      <Trash2 size={13} />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Permission Guide */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4 flex items-center gap-2">
          <Shield size={16} className="text-blue-600 dark:text-blue-400" />
          Role Permissions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {[
            { role: 'Super Admin', color: 'text-purple-600 dark:text-purple-400', perms: ['Full access to everything', 'Manage users & roles', 'Manage all locations', 'Export logs & reports', 'Delete products & logs', 'View all stores'] },
            { role: 'Store Manager', color: 'text-blue-600 dark:text-blue-400', perms: ['Access assigned store', 'Stock in & out', 'Transfers', 'View reports', 'View audit logs', 'Manage inventory'] },
            { role: 'Staff', color: 'text-green-600 dark:text-green-400', perms: ['Add stock in/out', 'View inventory', 'POS billing', 'View expiry alerts', 'Cannot delete logs', 'Cannot delete products'] },
          ].map(r => (
            <div key={r.role} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className={`font-bold mb-2 ${r.color}`}>{r.role}</p>
              {r.perms.map(p => (
                <p key={p} className="text-gray-600 dark:text-gray-400 mb-0.5">• {p}</p>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-gray-800">
              <UsersIcon size={20} className="text-blue-600 dark:text-blue-400" />
              <h2 className="font-bold text-gray-900 dark:text-white">{editUser ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={() => setShowModal(false)} className="ml-auto p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500"><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Full Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Enter full name"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="email@example.com"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Password *</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required placeholder="Enter password"
                    className="w-full px-3 py-2.5 pr-10 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">PIN (4-6 digits, optional)</label>
                <input type="text" maxLength={6} value={form.pin} onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '') }))} placeholder="1234"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Role *</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="staff">Staff</option>
                  <option value="store_manager">Store Manager</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              {form.role !== 'super_admin' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Assigned Location</label>
                  <select value={form.assignedLocation} onChange={e => setForm(f => ({ ...f, assignedLocation: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All Locations</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-500/30">
                  {editUser ? 'Update User' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
