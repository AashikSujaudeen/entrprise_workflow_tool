import React, { useState, useRef, useEffect } from 'react';

// Mock Data - Banking Focused
const mockWorkflows = [
  {
    id: 1,
    name: 'Wire Transfer Processing',
    status: 'Active',
    casesOpen: 156,
    avgTime: '4.5 hours',
    lastModified: '2024-01-15',
    efficiency: 94,
    icon: '💳',
    type: 'banking',
    stages: ['Maker', 'Checker', 'QC', 'Resolve'],
    currentStage: 'Checker'
  },
  {
    id: 2,
    name: 'Loan Application Review',
    status: 'Active',
    casesOpen: 89,
    avgTime: '2.3 days',
    lastModified: '2024-01-15',
    efficiency: 91,
    icon: '🏦',
    type: 'banking',
    stages: ['Maker', 'Checker', 'QC', 'Resolve'],
    currentStage: 'QC'
  },
  {
    id: 3,
    name: 'Account Opening Process',
    status: 'Active',
    casesOpen: 234,
    avgTime: '1.8 days',
    lastModified: '2024-01-14',
    efficiency: 96,
    icon: '👥',
    type: 'banking',
    stages: ['Maker', 'Checker', 'QC', 'Resolve'],
    currentStage: 'Maker'
  },
  {
    id: 4,
    name: 'Compliance Verification',
    status: 'Active',
    casesOpen: 67,
    avgTime: '6.2 hours',
    lastModified: '2024-01-14',
    efficiency: 88,
    icon: '🛡️',
    type: 'banking',
    stages: ['Maker', 'Checker', 'QC', 'Resolve'],
    currentStage: 'Resolve'
  },
  {
    id: 5,
    name: 'Trade Finance Processing',
    status: 'Active',
    casesOpen: 45,
    avgTime: '3.1 days',
    lastModified: '2024-01-13',
    efficiency: 92,
    icon: '📊',
    type: 'banking',
    stages: ['Maker', 'Checker', 'QC', 'Resolve'],
    currentStage: 'Checker'
  },
  {
    id: 6,
    name: 'Credit Card Activation',
    status: 'Draft',
    casesOpen: 0,
    avgTime: '-',
    lastModified: '2024-01-12',
    efficiency: 0,
    icon: '💳',
    type: 'banking',
    stages: ['Maker', 'Checker', 'QC', 'Resolve'],
    currentStage: 'Draft'
  }
];

const mockCases = [
  {
    id: 'WT-2024-001',
    title: 'Wire Transfer - $250,000 to Deutsche Bank',
    status: 'Checker Review',
    priority: 'High',
    assignee: 'Sarah Johnson',
    created: '2024-01-15 09:30',
    dueDate: '2024-01-15 17:00',
    workflow: 'Wire Transfer Processing',
    currentStage: 'Checker',
    amount: '$250,000',
    customer: 'Global Industries Corp',
    maker: 'David Chen',
    checker: 'Sarah Johnson'
  },
  {
    id: 'LA-2024-002',
    title: 'Personal Loan Application - $45,000',
    status: 'QC Review',
    priority: 'Medium',
    assignee: 'Mike Rodriguez',
    created: '2024-01-15 11:15',
    dueDate: '2024-01-16 14:00',
    workflow: 'Loan Application Review',
    currentStage: 'QC',
    amount: '$45,000',
    customer: 'Jennifer Williams',
    maker: 'Alex Thompson',
    checker: 'Lisa Brown',
    qc: 'Mike Rodriguez'
  },
  {
    id: 'AO-2024-003',
    title: 'Business Account Opening - TechStart LLC',
    status: 'Resolved',
    priority: 'Low',
    assignee: 'Jennifer Davis',
    created: '2024-01-14 14:20',
    dueDate: '2024-01-16 12:00',
    workflow: 'Account Opening Process',
    currentStage: 'Resolve',
    amount: 'Initial Deposit: $10,000',
    customer: 'TechStart LLC',
    maker: 'Robert Kim',
    checker: 'Jennifer Davis',
    qc: 'Mark Wilson',
    resolver: 'Jennifer Davis'
  },
  {
    id: 'CV-2024-004',
    title: 'AML Compliance Check - High Risk Customer',
    status: 'Maker Entry',
    priority: 'High',
    assignee: 'Amanda Foster',
    created: '2024-01-15 16:45',
    dueDate: '2024-01-16 10:00',
    workflow: 'Compliance Verification',
    currentStage: 'Maker',
    amount: 'Transaction: $500,000',
    customer: 'International Trading Co',
    maker: 'Amanda Foster'
  },
  {
    id: 'TF-2024-005',
    title: 'Letter of Credit Processing - Import Finance',
    status: 'Checker Review',
    priority: 'Medium',
    assignee: 'Carlos Martinez',
    created: '2024-01-14 08:30',
    dueDate: '2024-01-15 18:00',
    workflow: 'Trade Finance Processing',
    currentStage: 'Checker',
    amount: '$1,200,000',
    customer: 'Pacific Import Export',
    maker: 'Elena Petrov',
    checker: 'Carlos Martinez'
  }
];

const workflowElements = [
  { type: 'start', label: 'Start', icon: '▶️' },
  { type: 'assignment', label: 'Assignment', icon: '👤' },
  { type: 'decision', label: 'Decision', icon: '❓' },
  { type: 'connector', label: 'Connector', icon: '➡️' },
  { type: 'subprocess', label: 'Subprocess', icon: '⚙️' },
  { type: 'end', label: 'End', icon: '⏹️' }
];

// Header Component
export const Header = ({ activeTab, setActiveTab }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Pega Platform</h1>
          </div>
          <nav className="flex space-x-1">
            {['Dashboard', 'Workflows', 'Cases', 'Analytics'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.toLowerCase()
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-12h0v12z" />
            </svg>
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
          <div className="flex items-center space-x-2">
            <img 
              src="https://images.pexels.com/photos/7616608/pexels-photo-7616608.jpeg" 
              alt="User Avatar" 
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-sm text-gray-700">John Doe</span>
          </div>
        </div>
      </div>
    </header>
  );
};

// Dashboard Component
export const Dashboard = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-2">Welcome to Pega Platform</h2>
            <p className="text-blue-100 mb-6">Transform your business with intelligent workflow automation</p>
            <div className="flex space-x-4">
              <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
                Create Workflow
              </button>
              <button className="border border-white text-white px-6 py-2 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition-colors">
                View Demo
              </button>
            </div>
          </div>
          <div className="hidden lg:block">
            <img 
              src="https://images.unsplash.com/photo-1544717297-fa95b6ee9643" 
              alt="Business Professional" 
              className="w-64 h-48 object-cover rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Workflows</p>
              <p className="text-2xl font-bold text-gray-900">24</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Open Cases</p>
              <p className="text-2xl font-bold text-gray-900">255</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Avg. Resolution</p>
              <p className="text-2xl font-bold text-gray-900">2.3 days</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Efficiency</p>
              <p className="text-2xl font-bold text-gray-900">91%</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6 space-y-4">
            {mockCases.slice(0, 3).map((case_item) => (
              <div key={case_item.id} className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{case_item.title}</p>
                  <p className="text-xs text-gray-500">{case_item.created}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  case_item.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                  case_item.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {case_item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6 space-y-3">
            <button className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Create New Workflow</p>
                  <p className="text-sm text-gray-500">Design a new business process</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Create New Case</p>
                  <p className="text-sm text-gray-500">Start a new case instance</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">View Reports</p>
                  <p className="text-sm text-gray-500">Analyze workflow performance</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Workflows Component
export const Workflows = () => {
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Workflows</h2>
          <p className="text-gray-600">Manage and monitor your business processes</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>New Workflow</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {mockWorkflows.map((workflow) => (
          <div key={workflow.id} className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer" onClick={() => setSelectedWorkflow(workflow)}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">{workflow.icon}</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  workflow.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {workflow.status}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{workflow.name}</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Open Cases:</span>
                  <span className="font-medium">{workflow.casesOpen}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Time:</span>
                  <span className="font-medium">{workflow.avgTime}</span>
                </div>
                <div className="flex justify-between">
                  <span>Efficiency:</span>
                  <span className="font-medium text-green-600">{workflow.efficiency}%</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">Last modified: {workflow.lastModified}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedWorkflow && (
        <WorkflowModal workflow={selectedWorkflow} onClose={() => setSelectedWorkflow(null)} />
      )}
    </div>
  );
};

// Workflow Modal Component
const WorkflowModal = ({ workflow, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">{workflow.name}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <img 
            src="https://images.pexels.com/photos/7663144/pexels-photo-7663144.jpeg" 
            alt="Workflow Diagram" 
            className="w-full h-64 object-cover rounded-lg mb-4"
          />
          <p className="text-gray-600">Workflow Designer Interface</p>
          <p className="text-sm text-gray-500 mt-2">Drag and drop workflow elements to design your process</p>
        </div>
      </div>
    </div>
  );
};

// Workflow Designer Component
export const WorkflowDesigner = () => {
  const [draggedElement, setDraggedElement] = useState(null);
  const [droppedElements, setDroppedElements] = useState([]);
  const canvasRef = useRef(null);

  const handleDragStart = (element) => {
    setDraggedElement(element);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (draggedElement && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const newElement = {
        ...draggedElement,
        id: Date.now(),
        x,
        y
      };
      
      setDroppedElements([...droppedElements, newElement]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Workflow Designer</h2>
          <p className="text-gray-600">Design your business process flow</p>
        </div>
        <div className="flex space-x-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Save
          </button>
          <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            Preview
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Toolbox */}
        <div className="w-64 bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Toolbox</h3>
          <div className="space-y-2">
            {workflowElements.map((element) => (
              <div
                key={element.type}
                className="p-3 border border-gray-200 rounded-lg cursor-grab hover:border-blue-300 hover:bg-blue-50 transition-colors"
                draggable
                onDragStart={() => handleDragStart(element)}
              >
                <div className="flex items-center space-x-2">
                  <span>{element.icon}</span>
                  <span className="text-sm font-medium">{element.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1">
          <div 
            ref={canvasRef}
            className="bg-white border border-gray-200 rounded-xl min-h-[600px] relative"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="absolute inset-0 bg-gray-50 bg-opacity-50" style={{
              backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}></div>
            
            {droppedElements.map((element) => (
              <div
                key={element.id}
                className="absolute bg-white border-2 border-blue-500 rounded-lg p-3 shadow-lg cursor-move"
                style={{ left: element.x - 50, top: element.y - 25 }}
              >
                <div className="flex items-center space-x-2">
                  <span>{element.icon}</span>
                  <span className="text-sm font-medium">{element.label}</span>
                </div>
              </div>
            ))}
            
            {droppedElements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500">Drag workflow elements here to start designing</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-64 bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Properties</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Element Name</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="Enter name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                rows="3"
                placeholder="Enter description"
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignment</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Select assignee</option>
                <option>Current User</option>
                <option>Manager</option>
                <option>Work Queue</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Cases Component
export const Cases = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const filteredCases = mockCases.filter(case_item => {
    const matchesSearch = case_item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || case_item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cases</h2>
          <p className="text-gray-600">Manage and track case instances</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>New Case</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search cases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>All</option>
              <option>In Progress</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCases.map((case_item) => (
                <tr key={case_item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{case_item.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{case_item.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      case_item.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      case_item.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {case_item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      case_item.priority === 'High' ? 'bg-red-100 text-red-700' :
                      case_item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {case_item.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{case_item.assignee}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{case_item.dueDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                    <button className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Analytics Component
export const Analytics = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
          <p className="text-gray-600">Monitor workflow performance and insights</p>
        </div>
        <div className="flex space-x-2">
          <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            Export
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Generate Report
          </button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Performance</h3>
          <div className="text-center">
            <img 
              src="https://images.pexels.com/photos/8532850/pexels-photo-8532850.jpeg" 
              alt="Analytics Dashboard" 
              className="w-full h-32 object-cover rounded-lg mb-4"
            />
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Average Resolution Time</span>
                <span className="font-semibold">2.3 days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Success Rate</span>
                <span className="font-semibold text-green-600">94%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Processes</span>
                <span className="font-semibold">24</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Productivity</h3>
          <div className="text-center">
            <img 
              src="https://images.pexels.com/photos/7562452/pexels-photo-7562452.jpeg" 
              alt="Team Collaboration" 
              className="w-full h-32 object-cover rounded-lg mb-4"
            />
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Cases Completed</span>
                <span className="font-semibold">1,247</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Team Efficiency</span>
                <span className="font-semibold text-blue-600">91%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Users</span>
                <span className="font-semibold">42</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Process Automation</h3>
          <div className="text-center">
            <img 
              src="https://images.pexels.com/photos/8728384/pexels-photo-8728384.jpeg" 
              alt="Process Automation" 
              className="w-full h-32 object-cover rounded-lg mb-4"
            />
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Automated Tasks</span>
                <span className="font-semibold">156</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time Saved</span>
                <span className="font-semibold text-purple-600">340 hrs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Error Reduction</span>
                <span className="font-semibold text-green-600">78%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Workflow Trends</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 text-blue-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-gray-600">Workflow trend chart</p>
              <p className="text-sm text-gray-500">Interactive analytics visualization</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Distribution</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 text-purple-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              <p className="text-gray-600">Case distribution pie chart</p>
              <p className="text-sm text-gray-500">Visual breakdown by workflow type</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};