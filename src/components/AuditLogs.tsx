import { useState } from 'react';
import { useStore } from '../store/useStore';
import { FileText, Download, Search } from 'lucide-react';
import { formatDateTime } from '../utils/helpers';
import { format } from 'date-fns';
import type { LogAction } from '../types';

const ACTION_LABELS: Record<LogAction, string> = {
  product_created: 'Product Created',
  product_edited: 'Product Edited',
  product_deleted: 'Product Deleted',
  stock_added: 'Stock Added',
  stock_removed: 'Stock Removed',
  transfer_created: 'Transfer Created',
  transfer_completed: 'Transfer Completed',
  login: 'Login',
  logout: 'Logout',
  user_created: 'User Created',
  user_edited: 'User Edited',
  location_created: 'Location Created',
  location_renamed: 'Location Renamed',
  location_deleted: 'Location Deleted',
  pos_sale: 'POS Sale',
};

const ACTION_COLORS: Record<string, string> = {
  product_created: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  product_edited: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  product_deleted: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  stock_added: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  stock_removed: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  transfer_created: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  transfer_completed: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  login: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  logout: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  user_created: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
  user_edited: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
  location_created: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
  location_renamed: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
  location_deleted: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  pos_sale: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
};

export default function AuditLogs() {
  const { logs, currentUser } = useStore();
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const canExport = currentUser?.role === 'super_admin';

  const filtered = logs.filter(log => {
    const matchSearch = !search || log.description.toLowerCase().includes(search.toLowerCase()) || log.userName.toLowerCase().includes(search.toLowerCase());
    const matchAction = !filterAction || log.action === filterAction;
    return matchSearch && matchAction;
  });

  const exportCSV = () => {
    const data = [
      ['Timestamp', 'User', 'Action', 'Description'],
      ...filtered.map(l => [formatDateTime(l.timestamp), l.userName, ACTION_LABELS[l.action] || l.action, l.description])
    ];
    const csv = data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 relative min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search logs..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Actions</option>
          {Object.entries(ACTION_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        {canExport && (
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all">
            <Download size={16} />
            Export CSV
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Logs', value: logs.length, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Stock Events', value: logs.filter(l => l.action === 'stock_added' || l.action === 'stock_removed').length, color: 'text-green-600 dark:text-green-400' },
          { label: 'Product Events', value: logs.filter(l => l.action.startsWith('product_')).length, color: 'text-purple-600 dark:text-purple-400' },
          { label: 'Login Events', value: logs.filter(l => l.action === 'login' || l.action === 'logout').length, color: 'text-orange-600 dark:text-orange-400' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl p-3 border border-gray-100 dark:border-gray-800">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Note */}
      <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
        <FileText size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
        <p className="text-xs text-blue-700 dark:text-blue-300">Audit logs are immutable and cannot be edited or deleted. {canExport ? 'You can export logs as CSV.' : ''}</p>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <FileText size={18} className="text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Activity Log</h3>
          <span className="ml-auto text-xs text-gray-400">{filtered.length} records</span>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {['Timestamp', 'User', 'Action', 'Description'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-12">
                    <FileText size={32} className="mx-auto mb-2 opacity-30" />
                    No logs found
                  </td>
                </tr>
              ) : filtered.map(log => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{log.userName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{log.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden divide-y divide-gray-50 dark:divide-gray-800 max-h-[60vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No logs found</div>
          ) : filtered.map(log => (
            <div key={log.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{log.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{log.userName} • {formatDateTime(log.timestamp)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
