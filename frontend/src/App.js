import React, { useState } from 'react';
import './App.css';
import { 
  AuthProvider,
  useAuth,
  Login,
  Header, 
  Dashboard, 
  Workflows, 
  AdvancedWorkflowDesigner, 
  Cases, 
  Analytics,
  Reports
} from './components';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PegaBank Platform...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={() => {}} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'workflows':
        return <Workflows />;
      case 'designer':
        return <AdvancedWorkflowDesigner />;
      case 'cases':
        return <Cases />;
      case 'analytics':
        return <Analytics />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="transition-all duration-300">
        {renderContent()}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;