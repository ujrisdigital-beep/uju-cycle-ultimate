import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { 
  Shield, Activity, Cpu, Database, AlertTriangle, 
  CheckCircle, Clock, Users, TrendingUp, Lock,
  Server, HardDrive, Wifi, Zap, RefreshCw,
  ChevronDown, ChevronUp, Terminal, FileText, Settings
} from 'lucide-react';

interface SystemMetrics {
  health: {
    status: 'healthy' | 'degraded' | 'critical';
    uptime: number;
    lastIncident: string | null;
  };
  performance: {
    avgResponseTime: number;
    p95ResponseTime: number;
    throughput: number;
    errorRate: number;
    history: Array<{ timestamp: string; responseTime: number; throughput: number }>;
  };
  learning: {
    totalTasksProcessed: number;
    averageImprovement: number;
    currentAccuracy: number;
    nextRetraining: string;
    modelVersion: string;
  };
  security: {
    threatAttemptsBlocked: number;
    activeCourtOrders: number;
    userGrantsActive: number;
    lastPenTest: string;
  };
  resources: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    activeConnections: number;
  };
  aiAgents: {
    [key: string]: {
      status: 'active' | 'degraded' | 'down';
      tasksProcessed: number;
      avgLatency: number;
    };
  };
  alerts: Array<{
    id: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: string;
  }>;
}

const MasterAdminDashboard = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [showSOP, setShowSOP] = useState(false);
  const [sopCategory, setSopCategory] = useState('performance_degradation');
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.hostname}:8006/ws/admin`);
    
    socket.onopen = () => {
      setWs(socket);
      console.log('✅ Admin dashboard connected');
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMetrics(data);
      } catch (e) {
        console.error('Failed to parse metrics:', e);
      }
    };
    
    socket.onclose = () => {
      setWs(null);
      console.log('❌ Admin dashboard disconnected');
      if (autoRefresh) {
        setTimeout(() => {
          const newSocket = new WebSocket(`${protocol}//${window.location.hostname}:8006/ws/admin`);
          setWs(newSocket);
        }, 3000);
      }
    };

    return () => socket.close();
  }, [autoRefresh]);

  const handleRefresh = useCallback(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'refresh' }));
    }
  }, [ws]);

  const healthColor = useMemo(() => {
    if (!metrics) return 'text-gray-400';
    return {
      healthy: 'text-green-500',
      degraded: 'text-yellow-500',
      critical: 'text-red-500'
    }[metrics.health.status] || 'text-gray-400';
  }, [metrics]);

  if (!metrics) return (
    <div className="flex items-center justify-center h-screen bg-gray-950 text-gray-100">
      <div className="text-center">
        <RefreshCw className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
        <p className="text-lg">Loading UJU Master System...</p>
        <p className="text-sm text-gray-400 mt-2">Establishing secure connection to orchestrator</p>
      </div>
    </div>
  );

  const cpuColor = metrics.resources.cpuUsage > 80 ? 'bg-red-500' : 
                   metrics.resources.cpuUsage > 60 ? 'bg-yellow-500' : 'bg-emerald-500';
  const memColor = metrics.resources.memoryUsage > 80 ? 'bg-red-500' : 
                   metrics.resources.memoryUsage > 60 ? 'bg-yellow-500' : 'bg-emerald-500';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-600 to-blue-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                UJU CYCLE LIVE
              </h1>
              <span className="text-xs px-2 py-1 bg-emerald-900/50 text-emerald-400 rounded-full border border-emerald-700">
                MASTER ADMIN v4.0
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${autoRefresh ? 'text-emerald-400' : 'text-gray-400'}`}>
              <div className={`w-3 h-3 rounded-full ${metrics.health.status === 'healthy' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm font-mono">{metrics.health.status.toUpperCase()}</span>
            </div>
            <button 
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-lg transition ${autoRefresh ? 'bg-emerald-900/50 text-emerald-400' : 'bg-gray-800 text-gray-400'}`}
              title="Toggle auto-refresh"
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={handleRefresh}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
              title="Refresh now"
            >
              <Zap className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setShowSOP(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>SOP Manual</span>
            </button>
          </div>
        </div>
      </header>

      <main className="p-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <MetricCard 
            title="System Health" 
            value={metrics.health.status.toUpperCase()} 
            icon={<Activity className={`w-5 h-5 ${healthColor}`} />}
            color={healthColor}
            subtitle={`${Math.floor(metrics.health.uptime / 86400)}d ${Math.floor((metrics.health.uptime % 86400) / 3600)}h uptime`}
          />
          <MetricCard 
            title="Avg Response" 
            value={`${metrics.performance.avgResponseTime}ms`} 
            icon={<Clock className="w-5 h-5 text-blue-500" />}
            color="text-blue-500"
            subtitle={`P95: ${metrics.performance.p95ResponseTime}ms`}
          />
          <MetricCard 
            title="Tasks Processed" 
            value={metrics.learning.totalTasksProcessed.toLocaleString()} 
            icon={<Database className="w-5 h-5 text-purple-500" />}
            color="text-purple-500"
            subtitle={`${metrics.performance.throughput} tasks/24h`}
          />
          <MetricCard 
            title="Model Accuracy" 
            value={`${(metrics.learning.currentAccuracy * 100).toFixed(1)}%`} 
            icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
            color="text-emerald-500"
            subtitle={`v${metrics.learning.modelVersion}`}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Performance Chart */}
          <div className="lg:col-span-2 bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <Activity className="w-5 h-5 mr-2 text-emerald-500" />
                System Performance (Last 24 Hours)
              </h2>
              <div className="flex space-x-2">
                {['24h', '7d', '30d'].map(range => (
                  <button
                    key={range}
                    onClick={() => setSelectedTimeRange(range)}
                    className={`px-3 py-1 rounded text-xs font-medium transition ${
                      selectedTimeRange === range 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.performance.history || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#9CA3AF"
                  tickFormatter={(val) => new Date(val).toLocaleTimeString()}
                />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelFormatter={(val) => new Date(val).toLocaleString()}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="responseTime" 
                  stroke="#10B981" 
                  name="Response Time (ms)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="throughput" 
                  stroke="#3B82F6" 
                  name="Throughput (req/s)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* AI Agents Status */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Cpu className="w-5 h-5 mr-2 text-emerald-500" />
              AI Agents Status
            </h2>
            <div className="space-y-3">
              {Object.entries(metrics.aiAgents).map(([name, agent]) => (
                <AgentStatusCard key={name} name={name} agent={agent} />
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">All Agents</span>
                <span className="text-emerald-400">
                  {Object.values(metrics.aiAgents).filter(a => a.status === 'active').length}/{Object.keys(metrics.aiAgents).length} Online
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Security Metrics */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Lock className="w-5 h-5 mr-2 text-red-500" />
              Security Dashboard
            </h2>
            <div className="space-y-3">
              <SecurityMetric 
                label="Threats Blocked (24h)" 
                value={metrics.security.threatAttemptsBlocked} 
                icon={<Shield className="w-4 h-4" />}
                color="text-green-500"
              />
              <SecurityMetric 
                label="Active Court Orders" 
                value={metrics.security.activeCourtOrders} 
                icon={<AlertTriangle className="w-4 h-4" />}
                color="text-yellow-500"
              />
              <SecurityMetric 
                label="User Grants Active" 
                value={metrics.security.userGrantsActive} 
                icon={<Users className="w-4 h-4" />}
                color="text-blue-500"
              />
              <SecurityMetric 
                label="Last Pen Test" 
                value={metrics.security.lastPenTest} 
                icon={<CheckCircle className="w-4 h-4" />}
                color="text-emerald-500"
              />
            </div>
          </div>

          {/* Resource Usage */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Server className="w-5 h-5 mr-2 text-emerald-500" />
              Resource Utilization
            </h2>
            <div className="space-y-4">
              <ResourceBar 
                label="CPU Usage" 
                usage={metrics.resources.cpuUsage} 
                color={cpuColor}
                icon={<Cpu className="w-4 h-4" />}
              />
              <ResourceBar 
                label="Memory Usage" 
                usage={metrics.resources.memoryUsage} 
                color={memColor}
                icon={<HardDrive className="w-4 h-4" />}
              />
              <ResourceBar 
                label="Disk Usage" 
                usage={metrics.resources.diskUsage} 
                color="bg-blue-500"
                icon={<HardDrive className="w-4 h-4" />}
              />
              <ResourceBar 
                label="Connections" 
                usage={metrics.resources.activeConnections} 
                max={10000}
                color="bg-purple-500"
                icon={<Wifi className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* Learning Metrics */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-emerald-500" />
              Learning & Improvement
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-400 text-xs">Improvement/Task</p>
                <p className="text-xl font-bold text-emerald-500 mt-1">
                  +{(metrics.learning.averageImprovement * 100).toFixed(2)}%
                </p>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-400 text-xs">Next Retraining</p>
                <p className="text-sm font-bold mt-1">{metrics.learning.nextRetraining}</p>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-400 text-xs">Accuracy</p>
                <p className="text-xl font-bold text-blue-500 mt-1">
                  {(metrics.learning.currentAccuracy * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-400 text-xs">Model Version</p>
                <p className="text-xl font-bold mt-1">v{metrics.learning.modelVersion}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-400">
                ↻ Auto-retraining every Saturday 02:00 UTC
              </p>
            </div>
          </div>
        </div>

        {/* Alerts History */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
            Recent Alerts
          </h2>
          <div className="space-y-2">
            {metrics.alerts && metrics.alerts.length > 0 ? (
              metrics.alerts.slice(0, 5).map((alert, i) => (
                <AlertRow key={i} alert={alert} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
                <p>No alerts in the last 24 hours</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* SOP Modal */}
      {showSOP && (
        <SOPModal 
          category={sopCategory} 
          onClose={() => setShowSOP(false)} 
          onCategoryChange={setSopCategory}
        />
      )}
    </div>
  );
};

// Sub-components
const MetricCard = ({ title, value, icon, color, subtitle }: any) => (
  <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <p className="text-gray-400 text-sm">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${color || 'text-white'}`}>{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className="p-2 bg-gray-800 rounded-lg">{icon}</div>
    </div>
  </div>
);

const AgentStatusCard = ({ name, agent }: { name: string; agent: any }) => (
  <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
    <div className="flex items-center space-x-3">
      <div className={`w-2 h-2 rounded-full ${
        agent.status === 'active' ? 'bg-green-500' : 
        agent.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
      }`} />
      <span className="capitalize font-medium text-sm">{name.replace('_', ' ')}</span>
    </div>
    <div className="text-right">
      <p className="text-xs text-gray-400">{agent.tasksProcessed?.toLocaleString() || 0} tasks</p>
      <p className="text-xs text-gray-500">{agent.avgLatency || 0}ms avg</p>
    </div>
  </div>
);

const ResourceBar = ({ label, usage, max = 100, color = 'bg-emerald-500', icon }: any) => (
  <div>
    <div className="flex justify-between text-sm mb-1">
      <span className="flex items-center space-x-2">
        {icon && <span className="text-gray-400">{icon}</span>}
        <span>{label}</span>
      </span>
      <span className="font-mono">{usage}{max === 100 ? '%' : `/${max}`}</span>
    </div>
    <div className="w-full bg-gray-800 rounded-full h-2">
      <div 
        className={`h-2 rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min((usage / max) * 100, 100)}%` }}
      />
    </div>
  </div>
);

const SecurityMetric = ({ label, value, icon, color = 'text-gray-300' }: any) => (
  <div className="flex justify-between py-2 border-b border-gray-800 last:border-0">
    <span className="text-sm text-gray-300 flex items-center space-x-2">
      <span className={color}>{icon}</span>
      <span>{label}</span>
    </span>
    <span className="text-sm font-mono font-medium">{value}</span>
  </div>
);

const AlertRow = ({ alert }: { alert: any }) => (
  <div className={`flex items-center space-x-3 p-3 rounded-lg ${
    alert.severity === 'critical' ? 'bg-red-900/20 border border-red-800' :
    alert.severity === 'warning' ? 'bg-yellow-900/20 border border-yellow-800' :
    'bg-gray-800'
  }`}>
    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
      alert.severity === 'critical' ? 'bg-red-500' :
      alert.severity === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
    }`} />
    <div className="flex-1">
      <p className="text-sm">{alert.message}</p>
      <p className="text-xs text-gray-400">{new Date(alert.timestamp).toLocaleString()}</p>
    </div>
  </div>
);

const SOPModal = ({ category, onClose, onCategoryChange }: any) => {
  const categories = [
    { id: 'performance_degradation', label: 'Performance (15min)', icon: <Activity className="w-4 h-4" /> },
    { id: 'security_breach', label: 'Security Breach (5min)', icon: <Lock className="w-4 h-4" /> },
    { id: 'model_drift', label: 'Model Drift (30min)', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'resource_exhaustion', label: 'Resource Exhaustion (60min)', icon: <Server className="w-4 h-4" /> },
    { id: 'data_corruption', label: 'Data Corruption (30min)', icon: <Database className="w-4 h-4" /> },
    { id: 'court_order_received', label: 'Court Order (120min)', icon: <FileText className="w-4 h-4" /> },
    { id: 'user_escalation', label: 'User Escalation (240min)', icon: <Users className="w-4 h-4" /> },
  ];

  const [sopData, setSopData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/admin/sop/${category}`)
      .then(r => r.json())
      .then(data => {
        setSopData(data);
        setLoading(false);
      })
      .catch(() => {
        setSopData(null);
        setLoading(false);
      });
  }, [category]);

  const getSeverityColor = (slaMinutes: number) => {
    if (slaMinutes <= 5) return 'text-red-500 bg-red-900/20 border-red-800';
    if (slaMinutes <= 15) return 'text-orange-500 bg-orange-900/20 border-orange-800';
    if (slaMinutes <= 60) return 'text-yellow-500 bg-yellow-900/20 border-yellow-800';
    return 'text-green-500 bg-green-900/20 border-green-800';
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden border border-gray-700" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            <span>SOP Manual</span>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex h-[calc(80vh-4rem)]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
            <div className="p-4 space-y-1">
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => onCategoryChange(c.id)}
                  className={`w-full px-3 py-2 rounded-lg text-left text-sm transition flex items-center space-x-2 ${
                    category === c.id 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {c.icon}
                  <span className="flex-1">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            ) : sopData ? (
              <div>
                {/* Status Badge */}
                <div className="flex items-center space-x-3 mb-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    sopData.auto_resolvable 
                      ? 'bg-green-900/50 text-green-400 border border-green-700' 
                      : 'bg-orange-900/50 text-orange-400 border border-orange-700'
                  }`}>
                    {sopData.auto_resolvable ? '🤖 AI Auto-Resolvable' : '👨‍💼 Human Intervention Required'}
                  </span>
                  {sopData.sla_minutes && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(sopData.sla_minutes)}`}>
                      SLA: {sopData.sla_minutes} minutes
                    </span>
                  )}
                </div>

                {/* Human Steps */}
                {sopData.human_steps && (
                  <div>
                    <h3 className="font-semibold mb-3 text-emerald-400 flex items-center">
                      <Terminal className="w-4 h-4 mr-2" />
                      Human Intervention Steps:
                    </h3>
                    <ol className="space-y-3">
                      {sopData.human_steps.map((step: string, i: number) => (
                        <li key={i} className="flex items-start space-x-3 p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition group">
                          <span className="w-8 h-8 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center text-sm font-bold flex-shrink-0 group-hover:bg-blue-800 transition">
                            {i + 1}
                          </span>
                          <code className="text-sm text-gray-300 flex-1 font-mono">{step}</code>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Auto Steps (if any) */}
                {sopData.auto_steps && sopData.auto_steps.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <h3 className="font-semibold mb-3 text-blue-400">Auto-Resolution Steps:</h3>
                    <ul className="space-y-2">
                      {sopData.auto_steps.map((step: any, i: number) => (
                        <li key={i} className="flex items-center space-x-2 text-sm text-gray-400">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>{step.name} {step.params ? JSON.stringify(step.params) : ''}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
                <p>SOP not found for this category</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterAdminDashboard;
