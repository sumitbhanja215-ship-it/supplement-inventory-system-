import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import {
  LayoutDashboard, Package, ArrowDownCircle, ArrowUpCircle,
  ArrowLeftRight, FileText, BarChart2, Settings, LogOut,
  Bell, Menu, X, Moon, Sun, MapPin, Users, ShoppingCart,
  ChevronRight, AlertTriangle, Clock, Truck
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'stock-in', label: 'Stock In', icon: ArrowDownCircle },
  { id: 'stock-out', label: 'Stock Out', icon: ArrowUpCircle },
  { id: 'transfers', label: 'Transfers', icon: Truck },
  { id: 'expiry', label: 'Expiry', icon: Clock },
  { id: 'pos', label: 'POS Billing', icon: ShoppingCart },
  { id: 'reports', label: 'Reports', icon: BarChart2 },
  { id: 'logs', label: 'Audit Logs', icon: FileText },
  { id: 'locations', label: 'Locations', icon: MapPin },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const STAFF_NAV = ['dashboard', 'inventory', 'stock-in', 'stock-out', 'pos', 'expiry'];
const MANAGER_NAV = ['dashboard', 'inventory', 'stock-in', 'stock-out', 'transfers', 'pos', 'expiry', 'reports', 'logs'];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { currentUser, settings, notifications, logout, setActiveTab, activeTab, setTheme, markAllNotificationsRead } = useStore();
  const sidebarOpen = useStore(s => s.sidebarOpen);
  const setSidebarOpen = useStore(s => s.setSidebarOpen);
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const allowedTabs = currentUser?.role === 'super_admin'
    ? NAV_ITEMS.map(n => n.id)
    : currentUser?.role === 'store_manager'
    ? MANAGER_NAV
    : STAFF_NAV;

  const visibleNav = NAV_ITEMS.filter(n => allowedTabs.includes(n.id));

  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const toggleTheme = () => {
    setTheme(settings.theme === 'dark' ? 'light' : 'dark');
  };

  const handleNav = (id: string) => {
    setActiveTab(id);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:z-auto`}>
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-700 to-blue-600">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0">
            <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight truncate">KOUSHIK'S</p>
            <p className="text-blue-200 text-xs leading-tight truncate">SUPPLEMENT STORE</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-white">
            <X size={20} />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {currentUser?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{currentUser?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">{currentUser?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {visibleNav.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon size={18} className={active ? 'text-white' : 'text-gray-400 group-hover:text-blue-500'} />
                {item.label}
                {active && <ChevronRight size={14} className="ml-auto" />}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
          <button
            onClick={toggleTheme}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm transition-all"
          >
            {settings.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {settings.theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <button
            onClick={logout}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 text-sm transition-all"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3 shrink-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          >
            <Menu size={20} />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
              {NAV_ITEMS.find(n => n.id === activeTab)?.label || 'Dashboard'}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Seamless Inventory Tracking</p>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen(!notifOpen); }}
              className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-all"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">Notifications</span>
                  <button onClick={() => { markAllNotificationsRead(); setNotifOpen(false); }} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Mark all read</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-center text-gray-400 py-8 text-sm">No notifications</p>
                  ) : notifications.slice(0, 10).map(n => (
                    <div key={n.id} className={`p-3 border-b border-gray-50 dark:border-gray-800 ${!n.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                      <div className="flex items-start gap-2">
                        <div className={`p-1.5 rounded-lg shrink-0 ${
                          n.type === 'low_stock' ? 'bg-orange-100 dark:bg-orange-900/30' :
                          n.type === 'expiring' ? 'bg-red-100 dark:bg-red-900/30' :
                          n.type === 'transfer' ? 'bg-blue-100 dark:bg-blue-900/30' :
                          'bg-green-100 dark:bg-green-900/30'
                        }`}>
                          {n.type === 'low_stock' ? <AlertTriangle size={12} className="text-orange-600 dark:text-orange-400" /> :
                           n.type === 'expiring' ? <Clock size={12} className="text-red-600 dark:text-red-400" /> :
                           n.type === 'transfer' ? <ArrowLeftRight size={12} className="text-blue-600 dark:text-blue-400" /> :
                           <Package size={12} className="text-green-600 dark:text-green-400" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">{n.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{n.message}</p>
                        </div>
                        {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />}
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setNotifOpen(false)} className="w-full p-3 text-xs text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium">
                  Close
                </button>
              </div>
            )}
          </div>

          <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
            {settings.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button onClick={logout} className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 text-sm font-medium">
            <LogOut size={16} />
            <span className="hidden md:inline">Logout</span>
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex z-40 safe-area-bottom">
          {visibleNav.slice(0, 5).map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all ${
                  active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-gray-400 dark:text-gray-600"
          >
            <Menu size={20} />
            <span className="text-xs">More</span>
          </button>
        </div>
      </div>
    </div>
  );
}
