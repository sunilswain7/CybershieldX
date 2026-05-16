import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import api from '../utils/api';
import { HiChartBar, HiShieldCheck, HiExclamation, HiRefresh } from 'react-icons/hi';

const COLORS = ['#ef4444', '#f59e0b', '#06b6d4', '#10b981', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#6366f1', '#84cc16'];

const THREAT_COLORS = { Low: '#10b981', Medium: '#f59e0b', High: '#f97316', Critical: '#ef4444' };

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [threats, setThreats] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, alertsRes, threatsRes, timelineRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/alerts'),
        api.get('/dashboard/threats'),
        api.get('/dashboard/timeline'),
      ]);
      setStats(statsRes.data);
      setAlerts(alertsRes.data.alerts);
      setThreats(threatsRes.data.threats);
      setTimeline(timelineRes.data.timeline);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleReset = async () => {
    if (!window.confirm('Reset all dashboard data?')) return;
    await api.post('/dashboard/reset');
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-400"></div>
      </div>
    );
  }

  const overview = stats?.overview || {};
  const attacksByType = stats?.attacks_by_type || [];

  const pieData = attacksByType.map((a) => ({ name: a.attack_type?.replace(/_/g, ' '), value: parseInt(a.count) }));

  const timelineGrouped = timeline.reduce((acc, t) => {
    const key = new Date(t.time_bucket).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (!acc[key]) acc[key] = { time: key };
    acc[key][t.attack_type] = parseInt(t.count);
    return acc;
  }, {});
  const timelineData = Object.values(timelineGrouped);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <HiChartBar className="text-cyan-400" />
              Security Dashboard
            </h1>
            <p className="text-slate-400 mt-1">Real-time cyber defense monitoring</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchData} className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition border-0 cursor-pointer text-sm flex items-center gap-1">
              <HiRefresh /> Refresh
            </button>
            <button onClick={handleReset} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition border-0 cursor-pointer text-sm">
              Reset Data
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Attacks" value={overview.total_attacks || 0} icon={<HiExclamation className="text-red-400" />} color="red" />
          <StatCard title="Threat Level" value={overview.threat_level || 'Low'} icon={<HiShieldCheck className="text-yellow-400" />} color="yellow" />
          <StatCard title="Avg Threat Score" value={`${overview.avg_threat_score || 0}/100`} icon={<HiChartBar className="text-cyan-400" />} color="cyan" />
          <StatCard title="Tracked IPs" value={overview.tracked_ips || 0} icon={<HiShieldCheck className="text-green-400" />} color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
            <h3 className="text-lg font-semibold text-white mb-4">Attacks by Type</h3>
            {attacksByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attacksByType.map(a => ({ name: a.attack_type?.replace(/_/g, ' ').substring(0, 12), count: parseInt(a.count) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-30} textAnchor="end" height={80} />
                  <YAxis tick={{ fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                  <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">No attack data yet — run simulations first</div>
            )}
          </div>

          <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
            <h3 className="text-lg font-semibold text-white mb-4">Attack Distribution</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">No data available</div>
            )}
          </div>
        </div>

        {timelineData.length > 0 && (
          <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155] mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Attack Timeline (24h)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                <Area type="monotone" dataKey="SQL_INJECTION" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                <Area type="monotone" dataKey="REFLECTED_XSS" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                <Area type="monotone" dataKey="BRUTE_FORCE" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Alerts</h3>
            {alerts.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {alerts.slice(0, 15).map((a) => (
                  <div key={a.id} className={`p-3 rounded-lg border-l-4 ${
                    a.level >= 4 ? 'border-red-500 bg-red-500/5' : a.level >= 3 ? 'border-yellow-500 bg-yellow-500/5' : 'border-cyan-500 bg-cyan-500/5'
                  }`}>
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-slate-300">{a.message}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        a.level >= 4 ? 'bg-red-500/20 text-red-400' : a.level >= 3 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-cyan-500/20 text-cyan-400'
                      }`}>L{a.level}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{a.action_taken} — {new Date(a.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 text-sm">No alerts yet</div>
            )}
          </div>

          <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
            <h3 className="text-lg font-semibold text-white mb-4">Threat Scores by IP</h3>
            {threats.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {threats.map((t) => {
                  const level = t.score >= 70 ? 'Critical' : t.score >= 50 ? 'High' : t.score >= 30 ? 'Medium' : 'Low';
                  return (
                    <div key={t.id} className="p-3 bg-[#0f172a] rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-white font-mono">{t.ip_address}</span>
                        <span className="text-xs" style={{ color: THREAT_COLORS[level] }}>{level}</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${t.score}%`, backgroundColor: THREAT_COLORS[level] }}></div>
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-slate-500">
                        <span>Score: {t.score}/100</span>
                        <span>Attacks: {t.total_attacks}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-slate-500 text-sm">No tracked IPs yet</div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const borderColors = { red: 'border-red-500/30', yellow: 'border-yellow-500/30', cyan: 'border-cyan-500/30', green: 'border-green-500/30' };
  return (
    <motion.div whileHover={{ scale: 1.02 }} className={`bg-[#1e293b] rounded-xl p-5 border ${borderColors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-400">{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </motion.div>
  );
}
