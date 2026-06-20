import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { useFirestoreSync } from './hooks/useFirestoreSync';
import { seedFirestoreIfEmpty } from './services/seedService';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import StockIn from './components/StockIn';
import StockOut from './components/StockOut';
import Transfers from './components/Transfers';
import Expiry from './components/Expiry';
import POS from './components/POS';
import Reports from './components/Reports';
import AuditLogs from './components/AuditLogs';
import Locations from './components/Locations';
import Users from './components/Users';
import SettingsPage from './components/SettingsPage';

export default function App() {
  const { isAuthenticated, activeTab, settings, authLoading } = useStore();
  const [seeding, setSeeding] = useState(true);

  // Set up all Firestore real-time listeners
  useFirestoreSync();

  // Apply theme immediately on mount from localStorage (before Firestore loads)
  // and keep it synced with store settings
  useEffect(() => {
    const savedTheme = localStorage.getItem('koushik-theme') as 'light' | 'dark' | null;
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Seed Firestore on first run
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.warn('[App] Seeding timeout reached — forcing loading complete');
      setSeeding(false);
    }, 10000);

    seedFirestoreIfEmpty()
      .catch(err => console.error('Seed error:', err))
      .finally(() => {
        clearTimeout(timeout);
        console.log('[App] Seeding complete, setting seeding=false');
        setSeeding(false);
      });
  }, []);

  // Show loading spinner while seeding or waiting for Firebase Auth
  if (seeding || authLoading) {
    console.log('[App] Loading screen — seeding:', seeding, 'authLoading:', authLoading);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950 flex flex-col items-center justify-center gap-4">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white shadow-2xl overflow-hidden mb-2">
          <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain" />
        </div>
        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
        <p className="text-blue-200 text-sm font-medium">
          {seeding ? 'Initializing store data…' : 'Connecting…'}
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'inventory': return <Inventory />;
      case 'stock-in': return <StockIn />;
      case 'stock-out': return <StockOut />;
      case 'transfers': return <Transfers />;
      case 'expiry': return <Expiry />;
      case 'pos': return <POS />;
      case 'reports': return <Reports />;
      case 'logs': return <AuditLogs />;
      case 'locations': return <Locations />;
      case 'users': return <Users />;
      case 'settings': return <SettingsPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout>
      {renderPage()}
    </Layout>
  );
}
