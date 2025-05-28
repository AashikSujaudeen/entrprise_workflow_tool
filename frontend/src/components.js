import React, { useState, useRef, useEffect, createContext, useContext } from 'react';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Mock API for functionality when backend is not available
const mockAPI = {
  login: async (username, password) => {
    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const users = {
      'admin': { username: 'admin', full_name: 'Admin User', role: 'admin', department: 'IT' },
      'maker1': { username: 'maker1', full_name: 'John Maker', role: 'maker', department: 'operations' },
      'checker1': { username: 'checker1', full_name: 'Sarah Checker', role: 'checker', department: 'operations' },
      'qc1': { username: 'qc1', full_name: 'Mike QC', role: 'qc', department: 'quality' },
      'resolver1': { username: 'resolver1', full_name: 'Lisa Resolver', role: 'resolver', department: 'operations' }
    };
    
    if (users[username] && (password === username + '123' || password === 'admin123')) {
      return {
        success: true,
        data: {
          access_token: 'mock-token-' + username,
          user: users[username]
        }
      };
    }
    return { success: false, error: 'Invalid credentials' };
  },
  
  createCase: async (caseData) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, message: 'Case created successfully', case_id: 'CASE-' + Date.now() };
  },
  
  saveWorkflow: async (workflowData) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'Workflow saved successfully', workflow_id: 'WF-' + Date.now() };
  },
  
  approveCase: async (caseId) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, message: 'Case approved and moved forward' };
  },
  
  rejectCase: async (caseId) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, message: 'Case rejected and returned' };
  },
  
  generateReport: async (reportType, dateRange) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { success: true, message: 'Report generated successfully', report_id: 'RPT-' + Date.now() };
  }
};

// Authentication Context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Set a default user for testing
  const [user, setUser] = useState({
    id: '1',
    username: 'admin',
    role: 'admin',
    name: 'Admin User'
  });
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      // Try real API first, fallback to mock
      let result;
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
          const data = await response.json();
          result = { success: true, data };
        } else {
          throw new Error('API not available');
        }
      } catch (apiError) {
        // Fallback to mock API
        result = await mockAPI.login(username, password);
      }

      if (result.success) {
        setToken(result.data.access_token);
        setUser(result.data.user);
        localStorage.setItem('token', result.data.access_token);
        localStorage.setItem('user', JSON.stringify(result.data.user));
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};

// API Helper Functions
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Real-time notifications hook
const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, token]);

  const fetchNotifications = async () => {
    try {
      const data = await apiRequest('/api/notifications');
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await apiRequest(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return { notifications, markAsRead, fetchNotifications };
};

// Login Component
export const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(username, password);
    
    if (result.success) {
      onLogin();
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">PegaBank Platform</h1>
          <p className="text-gray-600">Banking Workflow Management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <div className="text-sm text-gray-600">
            <p className="mb-2">Demo Accounts:</p>
            <div className="space-y-1 text-xs">
              <p><strong>Admin:</strong> admin / admin123</p>
              <p><strong>Maker:</strong> maker1 / maker123</p>
              <p><strong>Checker:</strong> checker1 / checker123</p>
              <p><strong>QC:</strong> qc1 / qc123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Notifications Component
export const NotificationCenter = () => {
  const { notifications, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-12h0v12z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Notifications</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      notification.type === 'error' ? 'bg-red-500' :
                      notification.type === 'warning' ? 'bg-yellow-500' :
                      notification.type === 'success' ? 'bg-green-500' :
                      'bg-blue-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Mock Data - Banking Focused (fallback for offline mode)
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
  { type: 'start', label: 'Start', icon: '▶️', stage: 'Initialize' },
  { type: 'maker', label: 'Maker', icon: '✍️', stage: 'Maker' },
  { type: 'checker', label: 'Checker', icon: '✅', stage: 'Checker' },
  { type: 'qc', label: 'Quality Control', icon: '🔍', stage: 'QC' },
  { type: 'resolve', label: 'Resolve', icon: '⚡', stage: 'Resolve' },
  { type: 'decision', label: 'Decision', icon: '❓', stage: 'Decision' },
  { type: 'reject', label: 'Reject', icon: '❌', stage: 'Reject' },
  { type: 'end', label: 'End', icon: '⏹️', stage: 'Complete' }
];

// Header Component
export const Header = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">PegaBank Platform</h1>
          </div>
          <nav className="flex space-x-1">
            {['Dashboard', 'Workflows', 'Designer', 'Cases', 'Analytics', 'Reports'].map((tab) => (
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
          <NotificationCenter />
          <div className="flex items-center space-x-2">
            <img 
              src="https://images.pexels.com/photos/7616608/pexels-photo-7616608.jpeg" 
              alt="User Avatar" 
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="text-sm">
              <div className="text-gray-700">{user?.full_name || 'User'}</div>
              <div className="text-xs text-gray-500 capitalize">{user?.role || 'Role'}</div>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-gray-500 hover:text-gray-700"
            title="Logout"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

// Dashboard Component
export const Dashboard = () => {
  const [showCreateWorkflow, setShowCreateWorkflow] = useState(false);
  const [showComplianceDashboard, setShowComplianceDashboard] = useState(false);
  
  const handleCreateWorkflow = () => {
    setShowCreateWorkflow(true);
  };
  
  const handleViewCompliance = () => {
    setShowComplianceDashboard(true);
  };

  const handleQuickAction = async (action) => {
    const actions = {
      'wire_transfer': () => alert('Wire Transfer Creator opened! 💳\nFeature: Create new international wire transfer'),
      'loan_application': () => alert('Loan Application Processor opened! 🏦\nFeature: Review and process loan applications'),
      'compliance_check': () => alert('Compliance Checker opened! 🛡️\nFeature: Run AML/KYC verification processes'),
      'banking_reports': () => alert('Banking Reports opened! 📊\nFeature: Access regulatory and performance reports')
    };
    
    if (actions[action]) {
      actions[action]();
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-2">Welcome to PegaBank Platform</h2>
            <p className="text-blue-100 mb-6">Streamline banking operations with intelligent workflow automation</p>
            <div className="flex space-x-4">
              <button 
                onClick={handleCreateWorkflow}
                className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                Create Banking Workflow
              </button>
              <button 
                onClick={handleViewCompliance}
                className="border border-white text-white px-6 py-2 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition-colors"
              >
                View Compliance Dashboard
              </button>
            </div>
          </div>
          <div className="hidden lg:block">
            <img 
              src="https://images.pexels.com/photos/7616608/pexels-photo-7616608.jpeg" 
              alt="Banking Professional" 
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
              <p className="text-gray-500 text-sm">Active Banking Workflows</p>
              <p className="text-2xl font-bold text-gray-900">6</p>
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
              <p className="text-gray-500 text-sm">Pending Cases</p>
              <p className="text-2xl font-bold text-gray-900">591</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Avg. Processing Time</p>
              <p className="text-2xl font-bold text-gray-900">3.4 hrs</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Compliance Score</p>
              <p className="text-2xl font-bold text-gray-900">98.5%</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
            <button 
              onClick={() => handleQuickAction('wire_transfer')}
              className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Create Wire Transfer</p>
                  <p className="text-sm text-gray-500">Initiate new wire transfer process</p>
                </div>
              </div>
            </button>
            <button 
              onClick={() => handleQuickAction('loan_application')}
              className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Process Loan Application</p>
                  <p className="text-sm text-gray-500">Review new loan applications</p>
                </div>
              </div>
            </button>
            <button 
              onClick={() => handleQuickAction('compliance_check')}
              className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Compliance Check</p>
                  <p className="text-sm text-gray-500">Run AML/KYC verification</p>
                </div>
              </div>
            </button>
            <button 
              onClick={() => handleQuickAction('banking_reports')}
              className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">View Banking Reports</p>
                  <p className="text-sm text-gray-500">Access regulatory reports</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateWorkflow && (
        <CreateWorkflowModal onClose={() => setShowCreateWorkflow(false)} />
      )}
      
      {showComplianceDashboard && (
        <ComplianceDashboardModal onClose={() => setShowComplianceDashboard(false)} />
      )}
    </div>
  );
};

// Create Workflow Modal
const CreateWorkflowModal = ({ onClose }) => {
  const [workflowName, setWorkflowName] = useState('');
  const [workflowType, setWorkflowType] = useState('wire_transfer');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const result = await mockAPI.saveWorkflow({
        name: workflowName,
        type: workflowType,
        stages: ['Maker', 'Checker', 'QC', 'Resolve']
      });
      alert(`✅ ${result.message}\nWorkflow ID: ${result.workflow_id}`);
      onClose();
    } catch (error) {
      alert('❌ Error creating workflow: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 max-w-md w-full m-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Create Banking Workflow</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Workflow Name</label>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter workflow name..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Workflow Type</label>
            <select
              value={workflowType}
              onChange={(e) => setWorkflowType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="wire_transfer">Wire Transfer Processing</option>
              <option value="loan_application">Loan Application Review</option>
              <option value="account_opening">Account Opening Process</option>
              <option value="compliance_check">Compliance Verification</option>
            </select>
          </div>
          
          <div className="flex space-x-3 mt-6">
            <button
              onClick={handleCreate}
              disabled={loading || !workflowName}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating...' : 'Create Workflow'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Compliance Dashboard Modal
const ComplianceDashboardModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Compliance Dashboard</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-green-800 mb-3">AML Compliance</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Compliance Rate:</span>
                <span className="font-bold text-green-600">100%</span>
              </div>
              <div className="flex justify-between">
                <span>Cases Reviewed:</span>
                <span className="font-bold">1,247</span>
              </div>
              <div className="flex justify-between">
                <span>Alerts Resolved:</span>
                <span className="font-bold">98.5%</span>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-blue-800 mb-3">KYC Verification</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Verification Rate:</span>
                <span className="font-bold text-blue-600">99.2%</span>
              </div>
              <div className="flex justify-between">
                <span>Pending Reviews:</span>
                <span className="font-bold">23</span>
              </div>
              <div className="flex justify-between">
                <span>Risk Score:</span>
                <span className="font-bold text-green-600">Low</span>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-purple-800 mb-3">Regulatory Reporting</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Reports Filed:</span>
                <span className="font-bold text-purple-600">156</span>
              </div>
              <div className="flex justify-between">
                <span>On-time Submission:</span>
                <span className="font-bold">100%</span>
              </div>
              <div className="flex justify-between">
                <span>Next Due:</span>
                <span className="font-bold">Jan 25, 2024</span>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-orange-800 mb-3">Audit Status</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Last Audit:</span>
                <span className="font-bold text-orange-600">Dec 2023</span>
              </div>
              <div className="flex justify-between">
                <span>Findings:</span>
                <span className="font-bold text-green-600">0 Critical</span>
              </div>
              <div className="flex justify-between">
                <span>Next Audit:</span>
                <span className="font-bold">Mar 2024</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export const Workflows = () => {
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Banking Workflows</h2>
          <p className="text-gray-600">Manage maker-checker-QC-resolve processes</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>New Banking Workflow</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
              
              {/* Banking Workflow Stages */}
              <div className="mb-4">
                <div className="flex items-center space-x-1 mb-2">
                  {workflow.stages.map((stage, index) => (
                    <div key={stage} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                        workflow.currentStage === stage 
                          ? 'bg-blue-500 text-white' 
                          : index < workflow.stages.indexOf(workflow.currentStage)
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                      }`}>
                        {stage === 'Maker' ? 'M' : stage === 'Checker' ? 'C' : stage === 'QC' ? 'Q' : 'R'}
                      </div>
                      {index < workflow.stages.length - 1 && (
                        <div className={`w-4 h-0.5 ${
                          index < workflow.stages.indexOf(workflow.currentStage) ? 'bg-green-500' : 'bg-gray-200'
                        }`}></div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">Current: <span className="font-medium text-blue-600">{workflow.currentStage}</span></p>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Pending Cases:</span>
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
        <BankingWorkflowModal workflow={selectedWorkflow} onClose={() => setSelectedWorkflow(null)} />
      )}
    </div>
  );
};

// Banking Workflow Modal Component
const BankingWorkflowModal = ({ workflow, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">{workflow.name} - Banking Process Flow</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Banking Workflow Visualization */}
        <div className="bg-gray-50 rounded-lg p-8 mb-6">
          <h4 className="text-lg font-semibold mb-4 text-center">Maker-Checker-QC-Resolve Process Flow</h4>
          <div className="flex items-center justify-center space-x-4">
            {workflow.stages.map((stage, index) => (
              <div key={stage} className="flex items-center">
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-sm font-semibold mb-2 ${
                    workflow.currentStage === stage 
                      ? 'bg-blue-500 text-white border-4 border-blue-200' 
                      : index < workflow.stages.indexOf(workflow.currentStage)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }`}>
                    {stage === 'Maker' ? '✍️' : stage === 'Checker' ? '✅' : stage === 'QC' ? '🔍' : '⚡'}
                  </div>
                  <p className="text-sm font-medium">{stage}</p>
                  <p className="text-xs text-gray-500">
                    {stage === 'Maker' ? 'Create & Submit' :
                     stage === 'Checker' ? 'Review & Verify' :
                     stage === 'QC' ? 'Quality Control' : 'Final Resolution'}
                  </p>
                </div>
                {index < workflow.stages.length - 1 && (
                  <div className="flex flex-col items-center mx-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Banking Process Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold mb-4">Process Overview</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Workflow Type:</span>
                <span className="font-medium">Banking Operations</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current Stage:</span>
                <span className="font-medium text-blue-600">{workflow.currentStage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending Cases:</span>
                <span className="font-medium">{workflow.casesOpen}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Processing:</span>
                <span className="font-medium">{workflow.avgTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Efficiency Rate:</span>
                <span className="font-medium text-green-600">{workflow.efficiency}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold mb-4">Banking Compliance</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">AML/KYC Compliance</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">Regulatory Approval</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">Dual Control Process</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">Audit Trail</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <img 
            src="https://images.unsplash.com/photo-1586790827327-1750e2e0cc48" 
            alt="Banking Operations" 
            className="w-full h-48 object-cover rounded-lg"
          />
          <p className="text-gray-600 mt-2">Enterprise Banking Workflow Management</p>
        </div>
      </div>
    </div>
  );
};

// Advanced Workflow Designer Component
export const AdvancedWorkflowDesigner = () => {
  const [draggedElement, setDraggedElement] = useState(null);
  const [droppedElements, setDroppedElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [workflowName, setWorkflowName] = useState('New Banking Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [connections, setConnections] = useState([]);
  const canvasRef = useRef(null);
  const { user } = useAuth();

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
        id: `${draggedElement.type}_${Date.now()}`,
        x: Math.max(0, Math.min(x - 50, rect.width - 100)),
        y: Math.max(0, Math.min(y - 25, rect.height - 50)),
        properties: {
          name: draggedElement.label,
          description: '',
          assignee: '',
          sla: '24 hours',
          conditions: []
        }
      };
      
      setDroppedElements([...droppedElements, newElement]);
      setDraggedElement(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleElementClick = (element) => {
    setSelectedElement(element);
  };

  const updateElementProperties = (elementId, properties) => {
    setDroppedElements(prev => 
      prev.map(el => 
        el.id === elementId ? { ...el, properties: { ...el.properties, ...properties } } : el
      )
    );
  };

  const deleteElement = (elementId) => {
    setDroppedElements(prev => prev.filter(el => el.id !== elementId));
    setSelectedElement(null);
  };

  const saveWorkflow = async () => {
    try {
      const workflowData = {
        name: workflowName,
        description: workflowDescription,
        elements: droppedElements,
        connections: connections,
        type: 'banking'
      };

      await apiRequest('/api/workflows', {
        method: 'POST',
        body: JSON.stringify(workflowData),
      });

      alert('Workflow saved successfully!');
    } catch (error) {
      alert('Error saving workflow: ' + error.message);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Workflow Designer</h2>
          <p className="text-gray-600">Design sophisticated banking workflows with drag-and-drop</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={saveWorkflow}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Save Workflow
          </button>
          <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            Preview
          </button>
        </div>
      </div>

      {/* Workflow Properties */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Workflow Name</label>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the workflow purpose..."
            />
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Enhanced Toolbox */}
        <div className="w-72 bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Banking Workflow Elements</h3>
          <div className="space-y-3">
            {workflowElements.map((element) => (
              <div
                key={element.type}
                className="p-3 border border-gray-200 rounded-lg cursor-grab hover:border-blue-300 hover:bg-blue-50 transition-colors"
                draggable
                onDragStart={() => handleDragStart(element)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{element.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{element.label}</div>
                    <div className="text-xs text-gray-500">{element.stage}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Workflow Template */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Quick Templates</h4>
            <button className="w-full p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left">
              <div className="text-sm font-medium">Standard Banking Flow</div>
              <div className="text-xs text-gray-500">Maker → Checker → QC → Resolve</div>
            </button>
          </div>
        </div>

        {/* Enhanced Canvas */}
        <div className="flex-1">
          <div 
            ref={canvasRef}
            className="bg-white border border-gray-200 rounded-xl min-h-[700px] relative overflow-hidden"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-40" style={{
              backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}></div>
            
            {/* Workflow Elements */}
            {droppedElements.map((element) => (
              <div
                key={element.id}
                className={`absolute bg-white border-2 rounded-lg p-3 shadow-lg cursor-move select-none ${
                  selectedElement?.id === element.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-blue-400'
                }`}
                style={{ left: element.x, top: element.y }}
                onClick={() => handleElementClick(element)}
                onDoubleClick={() => setSelectedElement(element)}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{element.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{element.properties?.name || element.label}</div>
                    <div className="text-xs text-gray-500">{element.stage}</div>
                  </div>
                </div>
                {element.properties?.assignee && (
                  <div className="text-xs text-blue-600 mt-1">
                    Assigned: {element.properties.assignee}
                  </div>
                )}
              </div>
            ))}
            
            {/* Empty State */}
            {droppedElements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-gray-500">Drag banking workflow elements here to start designing</p>
                  <p className="text-sm text-gray-400 mt-2">Create your maker-checker-QC-resolve process</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Properties Panel */}
        <div className="w-80 bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedElement ? 'Element Properties' : 'Properties Panel'}
          </h3>
          
          {selectedElement ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Element Name</label>
                <input
                  type="text"
                  value={selectedElement.properties?.name || ''}
                  onChange={(e) => updateElementProperties(selectedElement.id, { name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={selectedElement.properties?.description || ''}
                  onChange={(e) => updateElementProperties(selectedElement.id, { description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignee Role</label>
                <select
                  value={selectedElement.properties?.assignee || ''}
                  onChange={(e) => updateElementProperties(selectedElement.id, { assignee: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select assignee...</option>
                  <option value="maker">Maker</option>
                  <option value="checker">Checker</option>
                  <option value="qc">Quality Control</option>
                  <option value="resolver">Resolver</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SLA</label>
                <input
                  type="text"
                  value={selectedElement.properties?.sla || ''}
                  onChange={(e) => updateElementProperties(selectedElement.id, { sla: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 24 hours"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => deleteElement(selectedElement.id)}
                  className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedElement(null)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              <p>Click on a workflow element to edit its properties</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced Reports Component
export const Reports = () => {
  const [reportType, setReportType] = useState('workflow_performance');
  const [dateRange, setDateRange] = useState('last_30_days');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const reportTypes = [
    { value: 'workflow_performance', label: 'Workflow Performance Report' },
    { value: 'compliance_audit', label: 'Compliance Audit Report' },
    { value: 'user_activity', label: 'User Activity Report' },
    { value: 'sla_analysis', label: 'SLA Analysis Report' },
    { value: 'transaction_volume', label: 'Transaction Volume Report' }
  ];

  const generateReport = async () => {
    setLoading(true);
    // Simulate report generation
    setTimeout(() => {
      setLoading(false);
      alert(`${reportTypes.find(r => r.value === reportType)?.label} generated successfully!`);
    }, 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Banking Reports & Analytics</h2>
          <p className="text-gray-600">Generate comprehensive reports and insights</p>
        </div>
        <button
          onClick={generateReport}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {/* Report Configuration */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {reportTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="last_90_days">Last 90 Days</option>
              <option value="last_year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="pdf">PDF Report</option>
              <option value="excel">Excel Spreadsheet</option>
              <option value="csv">CSV Data</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Performance Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Cases Processed</span>
              <span className="font-semibold text-2xl text-green-600">1,247</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Average Processing Time</span>
              <span className="font-semibold text-2xl text-blue-600">3.4 hrs</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">SLA Compliance Rate</span>
              <span className="font-semibold text-2xl text-purple-600">96.8%</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Status</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">AML Compliance: 100% Compliant</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">KYC Verification: 99.2% Complete</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">Audit Trail: 1 Minor Issue</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">Regulatory Reporting: Up to Date</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Visualization */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
        <div className="h-80 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <svg className="w-16 h-16 text-blue-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-600">Interactive Performance Charts</p>
            <p className="text-sm text-gray-500">Real-time banking workflow analytics and trends</p>
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
  const [selectedCase, setSelectedCase] = useState(null);
  
  const filteredCases = mockCases.filter(case_item => {
    const matchesSearch = case_item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || case_item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Banking Cases</h2>
          <p className="text-gray-600">Track and manage banking workflow cases</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>New Banking Case</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search banking cases..."
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
              <option>Maker Entry</option>
              <option>Checker Review</option>
              <option>QC Review</option>
              <option>Resolved</option>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCases.map((case_item) => (
                <tr key={case_item.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedCase(case_item)}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{case_item.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{case_item.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{case_item.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{case_item.customer}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      case_item.currentStage === 'Maker' ? 'bg-blue-100 text-blue-700' :
                      case_item.currentStage === 'Checker' ? 'bg-yellow-100 text-yellow-700' :
                      case_item.currentStage === 'QC' ? 'bg-purple-100 text-purple-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {case_item.currentStage}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{case_item.assignee}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      case_item.priority === 'High' ? 'bg-red-100 text-red-700' :
                      case_item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {case_item.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{case_item.dueDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">Process</button>
                    <button className="text-green-600 hover:text-green-900">Approve</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCase && (
        <BankingCaseModal case_item={selectedCase} onClose={() => setSelectedCase(null)} />
      )}
    </div>
  );
};

// Banking Case Modal Component
const BankingCaseModal = ({ case_item, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Banking Case Details - {case_item.id}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Case Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold mb-3">Case Information</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Case ID:</span>
                <span className="font-medium">{case_item.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Title:</span>
                <span className="font-medium">{case_item.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium text-green-600">{case_item.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span className="font-medium">{case_item.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Priority:</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  case_item.priority === 'High' ? 'bg-red-100 text-red-700' :
                  case_item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {case_item.priority}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold mb-3">Workflow Progress</h4>
            <div className="space-y-3">
              {['Maker', 'Checker', 'QC', 'Resolve'].map((stage, index) => (
                <div key={stage} className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                    case_item.currentStage === stage 
                      ? 'bg-blue-500 text-white' 
                      : index < ['Maker', 'Checker', 'QC', 'Resolve'].indexOf(case_item.currentStage)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }`}>
                    {stage === 'Maker' ? '✍️' : stage === 'Checker' ? '✅' : stage === 'QC' ? '🔍' : '⚡'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{stage}</p>
                    <p className="text-xs text-gray-500">
                      {stage === 'Maker' && case_item.maker ? `Handled by: ${case_item.maker}` :
                       stage === 'Checker' && case_item.checker ? `Handled by: ${case_item.checker}` :
                       stage === 'QC' && case_item.qc ? `Handled by: ${case_item.qc}` :
                       stage === 'Resolve' && case_item.resolver ? `Handled by: ${case_item.resolver}` :
                       'Pending assignment'}
                    </p>
                  </div>
                  {case_item.currentStage === stage && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Current</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Edit Case
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Approve & Move Forward
          </button>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Reject & Return
          </button>
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
          <h2 className="text-2xl font-bold text-gray-900">Banking Analytics</h2>
          <p className="text-gray-600">Monitor banking workflow performance and compliance metrics</p>
        </div>
        <div className="flex space-x-2">
          <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            Export Report
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Generate Compliance Report
          </button>
        </div>
      </div>

      {/* Banking Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Maker-Checker Performance</h3>
          <div className="text-center">
            <img 
              src="https://images.unsplash.com/photo-1574288061782-da2d3f79a72e" 
              alt="Banking Operations" 
              className="w-full h-32 object-cover rounded-lg mb-4"
            />
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Avg. Maker Time</span>
                <span className="font-semibold">1.2 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Checker Approval Rate</span>
                <span className="font-semibold text-green-600">96%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">QC Pass Rate</span>
                <span className="font-semibold text-blue-600">98.5%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Metrics</h3>
          <div className="text-center">
            <img 
              src="https://images.unsplash.com/photo-1654089670624-0db58288cd01" 
              alt="Compliance Monitoring" 
              className="w-full h-32 object-cover rounded-lg mb-4"
            />
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">AML Compliance</span>
                <span className="font-semibold text-green-600">100%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">KYC Verification</span>
                <span className="font-semibold text-green-600">99.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Regulatory Score</span>
                <span className="font-semibold text-blue-600">98.5%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Processing</h3>
          <div className="text-center">
            <img 
              src="https://images.pexels.com/photos/9169180/pexels-photo-9169180.jpeg" 
              alt="Digital Banking" 
              className="w-full h-32 object-cover rounded-lg mb-4"
            />
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Daily Volume</span>
                <span className="font-semibold">$2.4M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Processing Time</span>
                <span className="font-semibold text-purple-600">3.4 hrs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Success Rate</span>
                <span className="font-semibold text-green-600">99.8%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Banking Workflow Trends</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 text-blue-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-gray-600">Banking workflow analytics</p>
              <p className="text-sm text-gray-500">Maker-Checker-QC-Resolve performance trends</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stage Distribution</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 text-purple-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              <p className="text-gray-600">Case distribution by stage</p>
              <p className="text-sm text-gray-500">Visual breakdown of workflow stages</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};