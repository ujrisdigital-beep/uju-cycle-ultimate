import { useState, useEffect } from 'react';

const API = ''; // proxied

function MasterAdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [ws, setWs] = useState(null);
  const [showSOP, setShowSOP] = useState(false);
  const [sopCategory, setSopCategory] = useState('performance_degradation');

  useEffect(() => {
    const socket = new WebSocket(`ws://${window.location.hostname}:8006/ws/admin`);
    socket.onmessage = (e) => {
      try { setMetrics(JSON.parse(e.data)); } catch {}
    };
    socket.onopen = () => setWs(socket);
    return () => socket.close();
  }, []);

  if (!metrics) return (
    <div className="flex items-center justify-center h-screen bg-gray-950 text-gray-100">
      Loading UJU Master System...
    </div>
  );

  const healthColor = metrics.health.status === 'healthy' ? 'text-green-500' :
                     metrics.health.status === 'degraded' ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-emerald-900/50 flex items-center justify-center">
              <span className="text-emerald-400 font-bold text-lg">◈</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">UJU CYCLE LIVE</h1>
              <span className="text-xs px-2 py-1 bg-emerald-900/50 text-emerald-400 rounded-full">MASTER ADMIN v4.0</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`w-3 h-3 rounded-full ${metrics.health.status === 'healthy' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm capitalize">{metrics.health.status}</span>
            <button onClick={() => setShowSOP(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition">
              📋 SOP Manual
            </button>
          </div>
        </div>
      </header>

      <main className="p-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <MetricCard title="System Health" value={metrics.health.status.toUpperCase()} color={healthColor} />
          <MetricCard title="Uptime" value={`${Math.floor(metrics.health.uptime/86400)}d ${Math.floor((metrics.health.uptime%86400)/3600)}h`} />
          <MetricCard title="Tasks Processed" value={metrics.learning.total_tasks_processed?.toLocaleString() || '0'} />
          <MetricCard title="Current Accuracy" value={`${(metrics.learning.current_accuracy * 100)?.toFixed(1) || '0.0'}%`} />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* AI Agents Status */}
          <div className="lg:col-span-1 bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <span className="w-5 h-5 mr-2 text-emerald-500">⚙️</span> AI Agents Status
            </h2>
            <div className="space-y-3">
              {metrics.ai_agents && Object.entries(metrics.ai_agents).map(([name, agent]) => (
                <div key={name} className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="capitalize">{name.replace('_', ' ')}</span>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    <div>{agent.tasks_processed?.toLocaleString() || 0} tasks</div>
                    <div>{agent.avg_latency || 0}ms avg</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Chart (simplified) */}
          <div className="lg:col-span-2 bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold mb-4">System Performance (24h)</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-800 p-3 rounded-lg">
                <p className="text-xs text-gray-400">Avg Response</p>
                <p className="text-xl font-bold text-emerald-500">{metrics.performance?.avg_response_time || 220}ms</p>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg">
                <p className="text-xs text-gray-400">P95 Response</p>
                <p className="text-xl font-bold text-blue-500">{metrics.performance?.p95_response_time || 450}ms</p>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg">
                <p className="text-xs text-gray-400">Error Rate</p>
                <p className="text-xl font-bold text-red-500">{metrics.performance?.error_rate?.toFixed(1) || 0.5}%</p>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center text-gray-400 text-sm">
              [Prometheus Chart: Response Time & Throughput — Connected to :9090]
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Security */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <span className="w-5 h-5 mr-2 text-red-500">🔒</span> Security Dashboard
            </h2>
            <SecurityMetric label="Threats Blocked" value={metrics.security?.threat_attempts_blocked || 0} />
            <SecurityMetric label="Active Court Orders" value={metrics.security?.active_court_orders || 0} />
            <SecurityMetric label="User Grants Active" value={metrics.security?.user_grants_active || 0} />
            <SecurityMetric label="Last Pen Test" value={metrics.security?.last_pen_test || '2026-04-15'} />
          </div>

          {/* Resources */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <span className="w-5 h-5 mr-2 text-emerald-500">🖥️</span> Resource Utilization
            </h2>
            <ResourceBar label="CPU" usage={metrics.resources?.cpu_usage || 45} />
            <ResourceBar label="Memory" usage={metrics.resources?.memory_usage || 62} />
            <ResourceBar label="Disk" usage={metrics.resources?.disk_usage || 38} />
            <ResourceBar label="Connections" usage={metrics.resources?.active_connections || 127} max={10000} />
          </div>

          {/* Learning Metrics */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <span className="w-5 h-5 mr-2 text-emerald-500">📈</span> Learning & Improvement
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-xs">Avg Improvement/Task</p>
                <p className="text-xl font-bold text-emerald-500">+{((metrics.learning?.average_improvement || 0.04) * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Next Retraining</p>
                <p className="text-xl font-bold">{metrics.learning?.next_retraining || 'Sat 02:00'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Model Version</p>
                <p className="text-xl font-bold">{metrics.learning?.model_version || 'v4.0'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Accuracy</p>
                <p className="text-xl font-bold text-blue-500">{((metrics.learning?.current_accuracy || 0.91) * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* SOP Modal */}
      {showSOP && <SOPModal category={sopCategory} onClose={() => setShowSOP(false)} onCategoryChange={setSopCategory} />}
    </div>
  );
}

function MetricCard({ title, value, color }) {
  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <p className="text-gray-400 text-sm">{title}</p>
      <p className={`text-2xl font-bold mt-1 ${color || 'text-white'}`}>{value}</p>
    </div>
  );
}

function SecurityMetric({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-800 last:border-0">
      <span className="text-sm text-gray-300">{label}</span>
      <span className="text-sm font-mono">{value}</span>
    </div>
  );
}

function ResourceBar({ label, usage, max = 100 }) {
  const pct = max === 100 ? usage : (usage / max) * 100;
  const color = pct > 80 ? 'bg-red-500' : pct > 60 ? 'bg-yellow-500' : 'bg-emerald-500';
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>{usage}{max === 100 ? '%' : `/${max}`}</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

function SOPModal({ category, onClose, onCategoryChange }) {
  const categories = [
    { id: 'performance_degradation', label: 'Performance (15min)' },
    { id: 'security_breach', label: 'Security Breach (5min)' },
    { id: 'model_drift', label: 'Model Drift (30min)' },
    { id: 'resource_exhaustion', label: 'Resource Exhaustion (60min)' },
    { id: 'data_corruption', label: 'Data Corruption (30min)' },
    { id: 'court_order_received', label: 'Court Order (120min)' },
    { id: 'user_escalation', label: 'User Escalation (240min)' },
  ];

  const [sopData, setSopData] = useState(null);

  useEffect(() => {
    fetch(`${API}/admin/sop/${category}`)
      .then(r => r.json())
      .then(setSopData)
      .catch(() => setSopData(null));
  }, [category]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-gray-700">
        <div className="sticky top-0 bg-gray-900 p-6 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">📋 SOP Manual</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        <div className="p-6">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => onCategoryChange(c.id)}
                className={`px-3 py-1 rounded-full text-xs ${category === c.id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* SOP Content */}
          {sopData && (
            <div>
              <div className="mb-4">
                <span className={`px-2 py-1 rounded text-xs ${sopData.auto_resolvable ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                  {sopData.auto_resolvable ? '🤖 AI Auto-Resolvable' : '👨‍💼 Human Intervention Required'}
                </span>
                <span className="ml-3 text-xs text-gray-400">SLA: {sopData.sla_minutes} minutes</span>
              </div>

              {sopData.human_steps && (
                <div>
                  <h3 className="font-semibold mb-3 text-emerald-400">Human Steps:</h3>
                  <ol className="space-y-2">
                    {sopData.human_steps.map((step, i) => (
                      <li key={i} className="flex items-start space-x-3 p-3 bg-gray-800 rounded-lg">
                        <span className="w-6 h-6 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <code className="text-sm text-gray-300">{step}</code>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MasterAdminDashboard;
