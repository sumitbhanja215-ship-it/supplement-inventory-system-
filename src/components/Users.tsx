import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Users as UsersIcon, Plus, Edit2, Trash2, X, Eye, EyeOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDateTime, getRoleBadgeColor, getRoleLabel, formatRelativeTime } from '../utils/helpers';
import { saveUserDoc } from '../services/firestoreService';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import type { UserRole, User } from '../types';

export default function UsersPage() {
  const { users, locations, addUser, updateUser, deleteUser, currentUser } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', pin: '',
    role: 'staff' as UserRole, assignedLocation: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Repair state
  const [showRepair, setShowRepair] = useState(false);
  const [repairForm, setRepairForm] = useState({ email: '', password: '', name: '', pin: '', role: 'staff' as UserRole, assignedLocation: '' });
  const [repairing, setRepairing] = useState(false);
  const [repairMsg, setRepairMsg] = useState('');
  const [repairError, setRepairError] = useState('');

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isAdmin = currentUser?.role === 'admin';
  const canManageUsers = isSuperAdmin || isAdmin;

  // Admin cannot see Super Admin accounts
  const visibleUsers = isAdmin ? users.filter(u => u.role !== 'super_admin') : users;
  // Admin cannot create/edit another Super Admin
  const allowedRoles = isAdmin
    ? ['staff', 'store_manager', 'admin'] as UserRole[]
    : ['staff', 'store_manager', 'admin', 'super_admin'] as UserRole[];

  const openAdd = () => {
    setForm({ name: '', email: '', password: '', pin: '', role: 'staff', assignedLocation: '' });
    setEditUser(null);
    setSubmitError('');
    setSubmitSuccess('');
    setShowPass(false);
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setForm({
      name: user.name,
      email: user.email,
      password: user.password,
      pin: user.pin || '',
      role: user.role,
      assignedLocation: user.assignedLocation || '',
    });
    setEditUser(user);
    setSubmitError('');
    setSubmitSuccess('');
    setShowPass(false);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setSubmitting(true);

    // Validate PIN length
    if (form.pin && form.pin.length < 4) {
      setSubmitError('PIN must be at least 4 digits.');
      setSubmitting(false);
      return;
    }

    // Validate password length for new users
    if (!editUser && form.password.length < 6) {
      setSubmitError('Password must be at least 6 characters.');
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        pin: form.pin || undefined,
        role: form.role,
        assignedLocation: form.assignedLocation || undefined,
      };

      if (editUser) {
        await updateUser(editUser.id, payload);
        setSubmitSuccess(`User "${form.name}" updated successfully.`);
        setTimeout(() => setShowModal(false), 1200);
      } else {
        await addUser(payload);
        setSubmitSuccess(`User "${form.name}" created successfully.`);
        setTimeout(() => setShowModal(false), 1200);
      }
    } catch (err: unknown) {
      console.error('[Users] Submit error:', err);
      const code = (err as { code?: string }).code;
      const msg = (err as { message?: string }).message;
      if (code === 'auth/email-already-in-use') {
        setSubmitError('This email is already registered in Firebase Auth.');
      } else if (code === 'auth/weak-password') {
        setSubmitError('Password must be at least 6 characters.');
      } else if (code === 'permission-denied') {
        setSubmitError('Permission denied. Check Firestore security rules.');
      } else {
        setSubmitError(msg || 'An error occurred. Check console for details.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (id === currentUser?.id) {
      alert('You cannot delete your own account.');
      return;
    }
    if (!confirm(`Delete user "${name}"? This removes the Firestore profile. Firebase Auth account must be deleted manually from the Firebase console.`)) return;
    try {
      await deleteUser(id);
    } catch (err) {
      console.error('[Users] Delete error:', err);
      alert('Failed to delete user. Check console for details.');
    }
  };

  // ── Repair: sync an existing Firebase Auth user into Firestore ──────────
  const handleRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    setRepairError('');
    setRepairMsg('');
    setRepairing(true);

    const adminEmail = currentUser?.email || '';
    const adminPassword = currentUser?.password || '';

    try {
      // Sign in as the target user to get their UID
      console.log('[Repair] Signing in as target user to get UID:', repairForm.email);
      const cred = await signInWithEmailAndPassword(auth, repairForm.email, repairForm.password);
      const uid = cred.user.uid;
      console.log('[Repair] Target UID:', uid);

      // Check if Firestore doc already exists
      const existingUser = users.find(u => u.id === uid);
      if (existingUser) {
        // Sign back in as admin first
        await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        setRepairError(`User already has a Firestore document (${existingUser.name}).`);
        setRepairing(false);
        return;
      }

      // Create Firestore doc while signed in as that user
      const userDoc = {
        id: uid,
        name: repairForm.name.trim(),
        email: repairForm.email.trim().toLowerCase(),
        password: repairForm.password,
        pin: repairForm.pin || undefined,
        role: repairForm.role,
        assignedLocation: repairForm.assignedLocation || undefined,
        createdAt: new Date().toISOString(),
      };

      await saveUserDoc(userDoc);
      console.log('[Repair] Firestore document created for UID:', uid);

      // Sign back in as admin
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      console.log('[Repair] Re-signed in as admin');

      setRepairMsg(`Successfully created Firestore profile for "${repairForm.name}" (${repairForm.email}). They can now log in.`);
      setRepairForm({ email: '', password: '', name: '', pin: '', role: 'staff', assignedLocation: '' });
    } catch (err: unknown) {
      console.error('[Repair] Error:', err);
      const code = (err as { code?: string }).code;
      // Try to sign back in as admin if something went wrong
      if (adminEmail && adminPassword) {
        try {
          await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        } catch { /* ignore */ }
      }
      if (code === 'auth/invalid-credential') {
        setRepairError('Wrong email/password for target user. They must exist in Firebase Auth.');
      } else if (code === 'permission-denied') {
        setRepairError('Firestore permission denied. Check security rules.');
      } else {
        setRepairError((err as { message?: string }).message || 'Repair failed. Check console.');
      }
    } finally {
      setRepairing(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{visibleUsers.length} total users</p>
        </div>
        {canManageUsers && (
          <div className="flex gap-2">
            <button
              onClick={() => { setShowRepair(true); setRepairError(''); setRepairMsg(''); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-all shadow-md shadow-amber-400/30"
            >
              <RefreshCw size={16} />
              Sync User
            </button>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all shadow-md shadow-blue-500/30"
            >
              <Plus size={16} />
              Add User
            </button>
          </div>
        )}
      </div>

      {/* Role Summary */}
      <div className={`grid grid-cols-2 gap-3 ${isAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-4'}`}>
        {[
          ...(isAdmin ? [] : [{ role: 'super_admin' as UserRole, label: 'Super Admins', color: 'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-300' }]),
          { role: 'admin' as UserRole, label: 'Admins', color: 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800', text: 'text-indigo-700 dark:text-indigo-300' },
          { role: 'store_manager' as UserRole, label: 'Store Managers', color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300' },
          { role: 'staff' as UserRole, label: 'Staff', color: 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-300' },
        ].map(r => (
          <div key={r.role} className={`${r.color} border rounded-2xl p-4`}>
            <p className={`text-2xl font-bold ${r.text}`}>{visibleUsers.filter(u => u.role === r.role).length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{r.label}</p>
          </div>
        ))}
      </div>

      {/* User Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleUsers.map(user => (
          <div key={user.id} className={`bg-white dark:bg-gray-900 rounded-2xl border overflow-hidden ${user.id === currentUser?.id ? 'border-blue-300 dark:border-blue-700' : 'border-gray-100 dark:border-gray-800'}`}>
            {user.id === currentUser?.id && (
              <div className="bg-blue-600 text-white text-xs text-center py-1 font-medium">You</div>
            )}
            <div className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0 relative ${
                  user.role === 'super_admin' ? 'bg-gradient-to-br from-purple-500 to-purple-700' :
                  user.role === 'admin' ? 'bg-gradient-to-br from-indigo-500 to-indigo-700' :
                  user.role === 'store_manager' ? 'bg-gradient-to-br from-blue-500 to-blue-700' :
                  'bg-gradient-to-br from-green-500 to-green-700'
                }`}>
                  {user.name.charAt(0).toUpperCase()}
                  <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${
                    user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                    <span className={`w-2 h-2 rounded-full ${user.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                  </div>
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
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Status</span>
                  <span className={`text-xs font-medium ${user.status === 'online' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {user.status === 'online' ? 'Online' : 'Offline'}
                  </span>
                </div>
                {user.lastActive && user.status === 'online' && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Active</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatRelativeTime(user.lastActive)}</span>
                  </div>
                )}
                {user.lastSeen && user.status !== 'online' && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Last Seen</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatRelativeTime(user.lastSeen)}</span>
                  </div>
                )}
                {user.lastLogin && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Last Login</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(user.lastLogin)}</span>
                  </div>
                )}
              </div>

              {canManageUsers && (
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

      {/* ── Add / Edit User Modal ─────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !submitting && setShowModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-gray-800">
              <UsersIcon size={20} className="text-blue-600 dark:text-blue-400" />
              <h2 className="font-bold text-gray-900 dark:text-white">{editUser ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={() => !submitting && setShowModal(false)} className="ml-auto p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Full Name *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="Enter full name"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  disabled={!!editUser}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                />
                {editUser && <p className="text-xs text-gray-400 mt-1">Email cannot be changed after creation.</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Password {editUser ? '(leave blank to keep current)' : '*'}
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required={!editUser}
                    placeholder={editUser ? 'Leave blank to keep current' : 'Min 6 characters'}
                    className="w-full px-3 py-2.5 pr-10 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">PIN (4–6 digits, optional)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={form.pin}
                  onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '') }))}
                  placeholder="e.g. 1234"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Role *</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {allowedRoles.map(role => (
                    <option key={role} value={role}>
                      {role === 'store_manager' ? 'Store Manager' : role === 'super_admin' ? 'Super Admin' : role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              {form.role !== 'super_admin' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Assigned Location</label>
                  <select
                    value={form.assignedLocation}
                    onChange={e => setForm(f => ({ ...f, assignedLocation: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Locations</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              )}

              {/* Error / Success */}
              {submitError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-red-600 dark:text-red-400 text-xs">{submitError}</p>
                </div>
              )}
              {submitSuccess && (
                <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                  <p className="text-green-600 dark:text-green-400 text-xs">{submitSuccess}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => !submitting && setShowModal(false)}
                  disabled={submitting}
                  className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {editUser ? 'Updating…' : 'Creating…'}</>
                  ) : (
                    editUser ? 'Update User' : 'Add User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Sync / Repair Modal ───────────────────────────────────────────────── */}
      {showRepair && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !repairing && setShowRepair(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-gray-800">
              <RefreshCw size={20} className="text-amber-500" />
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">Sync Auth User to Firestore</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Use this to fix users who exist in Firebase Auth but are missing from Firestore.</p>
              </div>
              <button onClick={() => !repairing && setShowRepair(false)} className="ml-auto p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRepair} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">User Email (must exist in Firebase Auth) *</label>
                <input type="email" value={repairForm.email} onChange={e => setRepairForm(f => ({ ...f, email: e.target.value }))} required placeholder="user@example.com"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">User Password (their Firebase Auth password) *</label>
                <input type="password" value={repairForm.password} onChange={e => setRepairForm(f => ({ ...f, password: e.target.value }))} required placeholder="Their current password"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Display Name *</label>
                <input value={repairForm.name} onChange={e => setRepairForm(f => ({ ...f, name: e.target.value }))} required placeholder="Full Name"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">PIN (optional)</label>
                <input type="text" maxLength={6} value={repairForm.pin} onChange={e => setRepairForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '') }))} placeholder="e.g. 2345"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Role *</label>
                <select value={repairForm.role} onChange={e => setRepairForm(f => ({ ...f, role: e.target.value as UserRole }))}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {allowedRoles.map(role => (
                    <option key={role} value={role}>
                      {role === 'store_manager' ? 'Store Manager' : role === 'super_admin' ? 'Super Admin' : role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              {repairForm.role !== 'super_admin' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Assigned Location</label>
                  <select value={repairForm.assignedLocation} onChange={e => setRepairForm(f => ({ ...f, assignedLocation: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All Locations</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              )}

              {repairError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-red-600 dark:text-red-400 text-xs">{repairError}</p>
                </div>
              )}
              {repairMsg && (
                <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                  <p className="text-green-600 dark:text-green-400 text-xs">{repairMsg}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => !repairing && setShowRepair(false)} disabled={repairing}
                  className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50">
                  Close
                </button>
                <button type="submit" disabled={repairing}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2">
                  {repairing ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Syncing…</>
                  ) : (
                    <><RefreshCw size={14} /> Sync to Firestore</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
