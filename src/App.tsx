import { useEffect } from 'react';
import { useStore } from './store/useStore';
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
  const { isAuthenticated, activeTab, settings } = useStore();

  // Apply theme on mount
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

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
