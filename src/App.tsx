import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './components/Auth/Login';
import Layout from './components/Dashboard/Layout';
import DashboardHome from './components/Dashboard/Home';
import MasterBarang from './components/Inventory/MasterBarang';
import TakeItemHistory from './components/Inventory/TakeItemHistory';
import LogItemChange from './components/Inventory/LogItemChange';
import { Loader2 } from 'lucide-react';
import { ToastProvider } from './components/UI/Toast';

export default function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
          <p className="text-gray-600 font-medium">Loading StockMaster Pro...</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      {!user ? (
        <Login />
      ) : (
        <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
          {activeTab === 'dashboard' && <DashboardHome />}
          {activeTab === 'barang' && <MasterBarang />}
          {activeTab === 'take-item-history' && <TakeItemHistory />}
          {activeTab === 'log-item-change' && <LogItemChange />}
        </Layout>
      )}
    </ToastProvider>
  );
}
