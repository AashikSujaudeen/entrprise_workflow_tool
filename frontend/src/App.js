import React, { useState } from 'react';
import './App.css';
import { 
  Header, 
  Dashboard, 
  Workflows, 
  WorkflowDesigner, 
  Cases, 
  Analytics 
} from './components';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'workflows':
        return <Workflows />;
      case 'designer':
        return <WorkflowDesigner />;
      case 'cases':
        return <Cases />;
      case 'analytics':
        return <Analytics />;
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

export default App;